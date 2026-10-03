const mongoose = require("mongoose");
const Event = require("../models/Event");
const Venue = require("../models/Venue");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Attendance = require("../models/Attendance");
const EventRegistration = require("../models/EventRegistration");
const VenueRequest = require("../models/VenueRequest");

const findVenueConflict = async ({ venue, venueName, eventDate, startTime, endTime, excludeEventId }) => {
    const dateValue = eventDate instanceof Date
        ? eventDate.toISOString().slice(0, 10)
        : String(eventDate).slice(0, 10);
    const dayStart = new Date(`${dateValue}T00:00:00.000`);
    const dayEnd = new Date(`${dateValue}T23:59:59.999`);

    const [events, requests] = await Promise.all([
        Event.find({
            venue,
            eventDate: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ["cancelled", "rejected"] },
            ...(excludeEventId ? { _id: { $ne: excludeEventId } } : {})
        })
            .select("title startTime endTime status")
            .lean(),
        VenueRequest.find({
            venue: venueName,
            date: { $gte: dayStart, $lte: dayEnd },
            status: { $in: ["Pending", "Approved"] }
        })
            .select("event start end status")
            .lean()
    ]);

    return [
        ...events.map(event => ({
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime
        })),
        ...requests.map(request => ({
            title: request.event,
            startTime: request.start,
            endTime: request.end
        }))
    ].find(conflict => startTime < conflict.endTime && endTime > conflict.startTime);
};


const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            eventDate,
            startTime,
            endTime,
            venue,
            expectedParticipants
        } = req.body;

        const organizer = req.user.userId;

        if (
            !title ||
            !eventDate ||
            !startTime ||
            !endTime ||
            !venue
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(venue) ||
            !mongoose.Types.ObjectId.isValid(organizer)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid venue or organizer ID"
            });
        }

        const organizerUser =
            await User.findById(organizer);

        if (!organizerUser) {
            return res.status(404).json({
                success: false,
                message: "Organizer not found"
            });
        }

        if (organizerUser.role !== "organizer") {
            return res.status(403).json({
                success: false,
                message: "Only organizers can create events"
            });
        }

        const selectedVenue =
            await Venue.findById(venue);

        if (!selectedVenue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found"
            });
        }

        if (selectedVenue.status !== "available") {
            return res.status(400).json({
                success: false,
                message:
                    `Selected venue is currently ${selectedVenue.status}`
            });
        }

        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message:
                    "End time must be later than start time"
            });
        }

        if (
            expectedParticipants !== undefined &&
            expectedParticipants !== null &&
            expectedParticipants !== ""
        ) {
            const participantCount =
                Number(expectedParticipants);

            const isLab =
                /^Lab\s[1-6]$/i.test(
                    selectedVenue.name.trim()
                );

            const minimumParticipants = isLab
                ? selectedVenue.capacity
                : Math.floor(
                    selectedVenue.capacity * 0.9
                );

            const maximumParticipants = isLab
                ? selectedVenue.capacity
                : Math.ceil(
                    selectedVenue.capacity * 1.1
                );

            if (
                !Number.isFinite(participantCount) ||
                participantCount < minimumParticipants ||
                participantCount > maximumParticipants
            ) {
                return res.status(400).json({
                    success: false,
                    message: isLab
                        ? `Participants for ${selectedVenue.name} must be exactly ${selectedVenue.capacity}.`
                        : `Participants for ${selectedVenue.name} must be between ${minimumParticipants} and ${maximumParticipants}. Venue capacity is ${selectedVenue.capacity} and +/-10% seating adjustment is allowed.`
                });
            }
        }

        const conflictingEvent = await findVenueConflict({
            venue: selectedVenue._id,
            venueName: selectedVenue.name,
            eventDate,
            startTime,
            endTime
        });

        if (conflictingEvent) {
            return res.status(400).json({
                success: false,
                message:
                    `This venue is already booked from ${conflictingEvent.startTime} to ${conflictingEvent.endTime} on ${eventDate}. Please select another time.`
            });
        }

        const event =
            await Event.create({
                title: title.trim(),

                description:
                    description
                        ? description.trim()
                        : "",

                category:
                    category
                        ? category.trim()
                        : "Other",

                eventDate,

                startTime,

                endTime,

                venue,

                organizer,

                expectedParticipants:
                    Number(expectedParticipants) || 0,

                status: "pending"
            });

        const populatedEvent =
            await Event.findById(
                event._id
            )
                .populate(
                    "venue",
                    "name location capacity status"
                )
                .populate(
                    "organizer",
                    "name email collegeId department year"
                );

        res.status(201).json({
            success: true,
            message:
                "Event created successfully and sent for approval",
            event: populatedEvent
        });

    } catch (error) {
        console.error(
            "Create Event Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to create event",
            error:
                error.message
        });
    }
};


const getEvents = async (req, res) => {
    try {
        const filter = req.user?.role === "admin"
            ? {}
            : req.user?.role === "organizer"
                ? { organizer: req.user.userId }
                : { status: "approved" };

        const organizerFields = req.user?.role === "admin"
            ? "name email collegeId"
            : "name";

        const events =
            await Event.find(filter)
                .populate(
                    "venue",
                    "name location capacity status"
                )
                .populate(
                    "organizer",
                    organizerFields
                )
                .sort({
                    eventDate: 1
                });

        res.status(200).json({
            success: true,
            count:
                events.length,
            events
        });

    } catch (error) {
        console.error(
            "Get Events Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch events",
            error:
                error.message
        });
    }
};


const getEventById = async (req, res) => {
    try {
        const event =
            await Event.findById(
                req.params.id
            )
                .populate(
                    "venue",
                    "name location capacity status"
                )
                .populate(
                    "organizer",
                    "name email collegeId"
                );

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found"
            });
        }

        const isAdmin = req.user?.role === "admin";
        const isOwner = req.user?.role === "organizer" &&
            String(event.organizer?._id || event.organizer) === String(req.user.userId);

        if (event.status !== "approved" && !isAdmin && !isOwner) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        res.status(200).json({
            success: true,
            event
        });

    } catch (error) {
        console.error(
            "Get Event Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch event",
            error:
                error.message
        });
    }
};


const getOrganizerEvents = async (req, res) => {
    try {
        const organizerId = req.user.role === "admin"
            ? req.params.organizerId
            : req.user.userId;

        if (
            !mongoose.Types.ObjectId.isValid(
                organizerId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid organizer ID"
            });
        }

        const events =
            await Event.find({
                organizer:
                    organizerId
            })
                .populate(
                    "venue",
                    "name location capacity status"
                )
                .populate(
                    "organizer",
                    "name email collegeId"
                )
                .sort({
                    eventDate: 1
                });

        res.status(200).json({
            success: true,
            count:
                events.length,
            events
        });

    } catch (error) {
        console.error(
            "Organizer Events Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch organizer events",
            error:
                error.message
        });
    }
};


const updateEvent = async (req, res) => {
    try {
        const existingEvent =
            await Event.findById(
                req.params.id
            );

        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found"
            });
        }

        const oldStatus =
            existingEvent.status;

        const organizerId =
            existingEvent.organizer;

        const isAdmin =
            req.user.role === "admin";

        const isOwner =
            req.user.role === "organizer" &&
            String(organizerId) ===
            String(req.user.userId);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to update this event."
            });
        }

        const isOrganizerCancellation =
            isOwner &&
            req.body.status === "cancelled";

        const updates = {};
        [
            "title",
            "description",
            "category",
            "eventDate",
            "startTime",
            "endTime",
            "venue",
            "expectedParticipants"
        ].forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (req.body.status !== undefined) {
            updates.status = req.body.status;
        }

        const newStatus =
            updates.status !== undefined
                ? updates.status
                : oldStatus;

        const updatedVenueId = updates.venue || existingEvent.venue;
        const updatedDate = updates.eventDate || existingEvent.eventDate;
        const updatedStartTime = updates.startTime || existingEvent.startTime;
        const updatedEndTime = updates.endTime || existingEvent.endTime;

        if (
            !mongoose.Types.ObjectId.isValid(updatedVenueId) ||
            !updatedDate ||
            !updatedStartTime ||
            !updatedEndTime ||
            updatedStartTime >= updatedEndTime
        ) {
            return res.status(400).json({
                success: false,
                message: "Event venue, date and valid start/end times are required."
            });
        }

        if (
            !isAdmin &&
            req.body.status !== undefined &&
            req.body.status !== oldStatus &&
            !isOrganizerCancellation
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only admins can change event approval status."
            });
        }

        if (isOrganizerCancellation) {
            return deleteEvent(req, res);
        }

        if (!["cancelled", "rejected"].includes(newStatus)) {
            const selectedVenue = await Venue.findById(updatedVenueId);

            if (!selectedVenue) {
                return res.status(404).json({
                    success: false,
                    message: "Venue not found."
                });
            }

            if (selectedVenue.status === "maintenance") {
                return res.status(409).json({
                    success: false,
                    message: "The selected venue is under maintenance."
                });
            }

            const conflict = await findVenueConflict({
                venue: selectedVenue._id,
                venueName: selectedVenue.name,
                eventDate: updatedDate,
                startTime: updatedStartTime,
                endTime: updatedEndTime,
                excludeEventId: existingEvent._id
            });

            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: `This venue conflicts with ${conflict.title || "another booking"} (${conflict.startTime}-${conflict.endTime}).`
                });
            }
        }

        const event =
            await Event.findByIdAndUpdate(
                req.params.id,
                updates,
                {
                    returnDocument: "after",
                    runValidators: true
                }
            )
                .populate(
                    "venue",
                    "name location capacity status"
                )
                .populate(
                    "organizer",
                    "name email collegeId"
                );

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found"
            });
        }

        if (
            oldStatus !== newStatus &&
            (
                newStatus === "approved" ||
                newStatus === "rejected"
            )
        ) {
            try {
                const notificationTitle =
                    newStatus === "approved"
                        ? "Event Approved"
                        : "Event Rejected";

                const notificationMessage =
                    newStatus === "approved"
                        ? `Your event "${event.title}" has been approved.`
                        : `Your event "${event.title}" has been rejected.`;

                const notification =
                    await Notification.create({
                        user:
                            organizerId,

                        title:
                            notificationTitle,

                        message:
                            notificationMessage,

                        type:
                            "approval",

                        relatedEvent:
                            event._id,

                        isRead:
                            false
                    });

                console.log(
                    "Notification Created:",
                    notification._id
                );

            } catch (notificationError) {
                console.error(
                    "Approval Notification Error:",
                    notificationError
                );
            }
        }

        res.status(200).json({
            success: true,
            message:
                newStatus === "approved"
                    ? "Event approved successfully"
                    : newStatus === "rejected"
                        ? "Event rejected successfully"
                        : "Event updated successfully",
            event
        });

    } catch (error) {
        console.error(
            "Update Event Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update event",
            error:
                error.message
        });
    }
};


const deleteEvent = async (req, res) => {
    try {
        const event =
            await Event.findById(
                req.params.id
            )
                .populate(
                    "venue",
                    "name location capacity"
                )
                .populate(
                    "organizer",
                    "name email collegeId"
                );

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found"
            });
        }

        const isAdmin =
            req.user.role === "admin";

        const isOrganizer =
            req.user.role === "organizer" &&
            String(event.organizer._id) ===
            String(req.user.userId);

        if (!isAdmin && !isOrganizer) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to delete this event."
            });
        }

        const eventTitle =
            event.title;

        const organizerName =
            event.organizer &&
            event.organizer.name
                ? event.organizer.name
                : "Unknown Organizer";

        const venueName =
            event.venue &&
            event.venue.name
                ? event.venue.name
                : "Unknown Venue";

        const eventDate =
            event.eventDate
                ? new Date(
                    event.eventDate
                ).toLocaleDateString(
                    "en-IN",
                    {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }
                )
                : "Unknown Date";

        const eventTime =
            `${event.startTime || "--"} - ${event.endTime || "--"}`;

        if (isOrganizer) {
            event.status = "cancelled";
            await event.save();

            try {
                const [adminUsers, registrations] = await Promise.all([
                    User.find({
                        role: "admin",
                        isActive: true
                    }).select("_id"),
                    EventRegistration.find({
                        event: event._id,
                        status: "registered"
                    }).distinct("student")
                ]);

                const recipients = new Set([
                    ...adminUsers.map(user => String(user._id)),
                    ...registrations.map(userId => String(userId))
                ]);

                await Notification.insertMany(
                    [...recipients].map(userId => ({
                        user: userId,
                        title: "Event Cancelled",
                        message: `Organizer ${organizerName} cancelled "${eventTitle}". Venue: ${venueName}. Date: ${eventDate}. Time: ${eventTime}.`,
                        type: "event",
                        relatedEvent: event._id,
                        isRead: false
                    }))
                );

            } catch (notificationError) {
                console.error(
                    "Cancellation Notification Error:",
                    notificationError
                );
            }

            return res.status(200).json({
                success: true,
                message: "Event cancelled successfully.",
                event
            });
        }

        await Event.findByIdAndDelete(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Event deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete Event Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete event",
            error:
                error.message
        });
    }
};


const getEventReports = async (req, res) => {
    try {
        const totalEvents =
            await Event.countDocuments();

        const approvedEvents =
            await Event.countDocuments({
                status: "approved"
            });

        const pendingEvents =
            await Event.countDocuments({
                status: "pending"
            });

        const rejectedEvents =
            await Event.countDocuments({
                status: "rejected"
            });

        const cancelledEvents =
            await Event.countDocuments({
                status: "cancelled"
            });

        const participantResult =
            await Event.aggregate([
                {
                    $match: {
                        status: {
                            $nin: [
                                "cancelled",
                                "rejected"
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$expectedParticipants"
                        }
                    }
                }
            ]);

        const totalParticipants =
            participantResult.length > 0
                ? participantResult[0].total
                : 0;

        const categoryUsage =
            await Event.aggregate([
                {
                    $group: {
                        _id: { $ifNull: ["$category", "Other"] },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        category: "$_id",
                        count: 1
                    }
                },
                { $sort: { count: -1, category: 1 } },
                { $limit: 4 }
            ]);

        const [attendanceResult, totalRegistrations] = await Promise.all([
            Attendance.aggregate([
                {
                    $group: {
                        _id: null,
                        markedCount: { $sum: 1 },
                        presentCount: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "present"] }, 1, 0]
                            }
                        },
                        absentCount: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "absent"] }, 1, 0]
                            }
                        }
                    }
                }
            ]),
            EventRegistration.countDocuments({ status: "registered" })
        ]);

        const attendance = attendanceResult[0] || {
            markedCount: 0,
            presentCount: 0,
            absentCount: 0
        };

        attendance.rate = attendance.markedCount > 0
            ? Math.round((attendance.presentCount / attendance.markedCount) * 100)
            : 0;

        const venueUsage =
            await Event.aggregate([
                {
                    $match: {
                        status: "approved"
                    }
                },
                {
                    $group: {
                        _id: "$venue",
                        bookings: {
                            $sum: 1
                        }
                    }
                },
                {
                    $lookup: {
                        from: "venues",
                        localField: "_id",
                        foreignField: "_id",
                        as: "venue"
                    }
                },
                {
                    $unwind: {
                        path: "$venue",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $project: {
                        _id: 0,
                        name: "$venue.name",
                        bookings: 1,
                        capacity: "$venue.capacity"
                    }
                },
                {
                    $sort: {
                        bookings: -1
                    }
                },
                {
                    $limit: 4
                }
            ]);

        res.status(200).json({
            success: true,

            reports: {
                totalEvents,
                totalParticipants,
                totalRegistrations,

                venueBookings:
                    approvedEvents,

                approvedEvents,
                pendingEvents,
                rejectedEvents,
                cancelledEvents,

                venueUsage,
                categoryUsage,
                attendance
            }
        });

    } catch (error) {
        console.error(
            "Event Reports Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to generate event reports",
            error:
                error.message
        });
    }
};


module.exports = {
    createEvent,
    getEvents,
    getEventById,
    getOrganizerEvents,
    updateEvent,
    deleteEvent,
    getEventReports
};