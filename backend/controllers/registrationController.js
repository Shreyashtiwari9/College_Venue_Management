const EventRegistration = require("../models/EventRegistration");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const Attendance = require("../models/Attendance");




const registerForEvent = async (req, res) => {
    try {

        const studentId = req.user.userId;
        const { eventId } = req.body;

        if (req.user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can register for events."
            });
        }




        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required."
            });
        }




        const event = await Event.findById(eventId)
            .populate(
                "venue",
                "name location capacity status"
            );


        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }




        if (event.status !== "approved") {
            return res.status(400).json({
                success: false,
                message:
                    "You can only register for an approved event."
            });
        }




        let registration =
            await EventRegistration.findOne({
                event: eventId,
                student: studentId
            });




        if (
            registration &&
            registration.status === "registered"
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "You are already registered for this event.",
                registration
            });

        }




        if (
            registration &&
            registration.status === "cancelled"
        ) {

            registration.status =
                "registered";

            await registration.save();

        }




        if (!registration) {

            registration =
                await EventRegistration.create({
                    event: eventId,
                    student: studentId,
                    status: "registered"
                });

        }




        registration =
            await EventRegistration.findById(
                registration._id
            )
                .populate(
                    "event",
                    "title description eventDate startTime endTime status"
                )
                .populate(
                    "student",
                    "name collegeId email"
                );




        try {

            await Notification.create({

                user: studentId,

                title:
                    "Event Registration Successful",

                message:
                    `You have successfully registered for "${event.title}".`,

                type:
                    "registration",

                relatedEvent:
                    eventId,

                isRead:
                    false

            });

        } catch (notificationError) {



            console.error(
                "Notification Creation Error:",
                notificationError
            );

        }




        return res.status(201).json({

            success: true,

            message:
                "Event registration successful.",

            registration

        });


    } catch (error) {

        console.error(
            "Register Event Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to register for event."

        });

    }
};




const getMyEvents = async (req, res) => {

    try {

        const studentId =
            req.user.userId;


        const registrations =
            await EventRegistration.find({
                student: studentId
            })
                .populate({
                    path: "event",
                    populate: {
                        path: "venue",
                        select:
                            "name location capacity status"
                    }
                })
                .sort({
                    createdAt: -1
                })
                .lean();

        const attendanceRecords =
            await Attendance.find({
                student: studentId
            })
                .select("event status")
                .lean();

        const attendanceMap = new Map();

        attendanceRecords.forEach(function (record) {
            attendanceMap.set(
                String(record.event),
                record.status
            );
        });

        const registrationsWithAttendance =
            registrations.map(function (registration) {
                return {
                    ...registration,
                    attendanceStatus:
                        attendanceMap.get(
                            String(registration.event?._id)
                        ) || "not-marked"
                };
            });


        return res.status(200).json({

            success: true,

            count:
                registrations.length,

            registrations: registrationsWithAttendance

        });


    } catch (error) {

        console.error(
            "Get My Events Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load registered events."

        });

    }

};




const checkRegistration = async (req, res) => {

    try {

        const studentId =
            req.user.userId;

        const { eventId } =
            req.params;


        if (!eventId) {

            return res.status(400).json({

                success: false,

                message:
                    "Event ID is required."

            });

        }


        const registration =
            await EventRegistration.findOne({
                event: eventId,
                student: studentId
            });


        return res.status(200).json({

            success: true,

            registered:
                !!registration &&
                registration.status === "registered",

            registration:
                registration || null

        });


    } catch (error) {

        console.error(
            "Check Registration Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to check registration."

        });

    }

};




const cancelRegistration = async (req, res) => {

    try {

        const studentId =
            req.user.userId;

        const { eventId } =
            req.params;


        if (!eventId) {

            return res.status(400).json({

                success: false,

                message:
                    "Event ID is required."

            });

        }




        const registration =
            await EventRegistration.findOne({
                event: eventId,
                student: studentId
            });


        if (!registration) {

            return res.status(404).json({

                success: false,

                message:
                    "Registration not found."

            });

        }




        if (
            registration.status ===
            "cancelled"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This registration is already cancelled."

            });

        }




        registration.status =
            "cancelled";


        await registration.save();




        const event =
            await Event.findById(
                eventId
            );




        if (event) {

            try {

                await Notification.create({

                    user: studentId,

                    title:
                        "Event Registration Cancelled",

                    message:
                        `Your registration for "${event.title}" has been cancelled.`,

                    type:
                        "registration",

                    relatedEvent:
                        eventId,

                    isRead:
                        false

                });

            } catch (notificationError) {

                console.error(
                    "Cancellation Notification Error:",
                    notificationError
                );

            }

        }




        return res.status(200).json({

            success: true,

            message:
                "Event registration cancelled successfully.",

            registration

        });


    } catch (error) {

        console.error(
            "Cancel Registration Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to cancel registration."

        });

    }

};




module.exports = {

    registerForEvent,

    getMyEvents,

    checkRegistration,

    cancelRegistration

};