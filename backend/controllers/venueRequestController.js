const VenueRequest = require("../models/VenueRequest");
const Notification = require("../models/Notification");
const Venue = require("../models/Venue");
const Event = require("../models/Event");

const findVenueRequestConflict = async ({ venue, date, start, end, excludeRequestId }) => {
    const dateValue = date instanceof Date
        ? date.toISOString().slice(0, 10)
        : String(date).slice(0, 10);
    const dayStart = new Date(`${dateValue}T00:00:00.000`);
    const dayEnd = new Date(`${dateValue}T23:59:59.999`);

    const [events, requests] = await Promise.all([
        Event.find({
            venue: venue._id,
            eventDate: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ["cancelled", "rejected"] }
        })
            .select("title startTime endTime")
            .lean(),
        VenueRequest.find({
            venue: venue.name,
            date: { $gte: dayStart, $lte: dayEnd },
            status: { $in: ["Pending", "Approved"] },
            ...(excludeRequestId ? { _id: { $ne: excludeRequestId } } : {})
        })
            .select("event start end")
            .lean()
    ]);

    return [
        ...events.map(event => ({
            title: event.title,
            start: event.startTime,
            end: event.endTime
        })),
        ...requests.map(request => ({
            title: request.event,
            start: request.start,
            end: request.end
        }))
    ].find(item => start < item.end && end > item.start);
};

const createVenueRequest = async (req, res) => {
    try {
        const {
            event,
            venue,
            participants,
            date,
            start,
            end,
            purpose
        } = req.body;

        if (!event || !venue || !participants || !date || !start || !end) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required venue request fields."
            });
        }

        const participantCount = Number(participants);

        if (
            !Number.isFinite(participantCount) ||
            participantCount < 1 ||
            start >= end ||
            Number.isNaN(new Date(date).getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid date, time range and participant count."
            });
        }

        const venueRecord = await Venue.findOne({ name: venue.trim() });

        if (!venueRecord) {
            return res.status(404).json({ success: false, message: "Venue not found." });
        }

        if (venueRecord.status === "maintenance" || participantCount > venueRecord.capacity) {
            return res.status(400).json({
                success: false,
                message: venueRecord.status === "maintenance"
                    ? "Venue is under maintenance."
                    : "Participant count exceeds venue capacity."
            });
        }

        const conflict = await findVenueRequestConflict({
            venue: venueRecord,
            date,
            start,
            end
        });

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: `The requested slot overlaps ${conflict.title || "another booking"} (${conflict.start}-${conflict.end}).`
            });
        }

        const request = await VenueRequest.create({
            organizer: req.user.userId,
            event: event.trim(),
            venue: venue.trim(),
            participants: participantCount,
            date,
            start,
            end,
            purpose: purpose ? purpose.trim() : ""
        });

        return res.status(201).json({
            success: true,
            message: "Venue request submitted successfully.",
            request
        });
    } catch (error) {
        console.error("Create Venue Request Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit venue request."
        });
    }
};

const getMyVenueRequests = async (req, res) => {
    try {
        const requests = await VenueRequest.find({
            organizer: req.user.userId
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error("Get Venue Requests Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load venue requests."
        });
    }
};

const getAllVenueRequests = async (req, res) => {
    try {
        const requests = await VenueRequest.find()
            .populate("organizer", "name email collegeId")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error("Get All Venue Requests Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load venue requests."
        });
    }
};

const updateVenueRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Approved or Rejected."
            });
        }

        const existingRequest = await VenueRequest.findById(req.params.id);

        if (!existingRequest) {
            return res.status(404).json({
                success: false,
                message: "Venue request not found."
            });
        }

        if (status === "Approved") {
            const venueRecord = await Venue.findOne({ name: existingRequest.venue });

            if (!venueRecord) {
                return res.status(404).json({ success: false, message: "Requested venue no longer exists." });
            }

            const conflict = await findVenueRequestConflict({
                venue: venueRecord,
                date: existingRequest.date,
                start: existingRequest.start,
                end: existingRequest.end,
                excludeRequestId: existingRequest._id
            });

            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: `Cannot approve: this slot overlaps ${conflict.title || "another booking"}.`
                });
            }
        }

        existingRequest.status = status;
        existingRequest.reviewedBy = req.user.userId;
        const request = await existingRequest.save();

        try {
            await Notification.create({
                user: request.organizer,
                title: `Venue Request ${status}`,
                message: `Your venue request for ${request.venue} was ${status.toLowerCase()}.`,
                type: "venue"
            });
        } catch (notificationError) {
            console.error("Venue Request Notification Error:", notificationError);
        }

        return res.status(200).json({
            success: true,
            message: `Venue request ${status.toLowerCase()}.`,
            request
        });
    } catch (error) {
        console.error("Update Venue Request Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update venue request."
        });
    }
};

module.exports = {
    createVenueRequest,
    getMyVenueRequests,
    getAllVenueRequests,
    updateVenueRequestStatus
};