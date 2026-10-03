const Venue = require("../models/Venue");
const Event = require("../models/Event");
const VenueRequest = require("../models/VenueRequest");

const inferVenueType = name => {
    const normalizedName = String(name || "").toLowerCase();

    if (normalizedName.includes("lab")) return "Laboratory";
    if (normalizedName.includes("seminar")) return "Seminar Hall";
    if (normalizedName.includes("classroom") || normalizedName.includes("dronacharya")) return "Classroom";
    if (normalizedName.includes("auditorium") || normalizedName.includes("chanakya")) return "Auditorium";
    return "College Venue";
};

const getAvailabilityByVenue = async (venues, date = new Date()) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const [events, requests] = await Promise.all([
        Event.find({
            venue: { $in: venues.map(venue => venue._id) },
            eventDate: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ["cancelled", "rejected"] }
        })
            .select("venue status")
            .lean(),
        VenueRequest.find({
            venue: { $in: venues.map(venue => venue.name) },
            date: { $gte: dayStart, $lte: dayEnd },
            status: { $in: ["Pending", "Approved"] }
        })
            .select("venue status")
            .lean()
    ]);

    return new Map(venues.map(venue => {
        const eventsForVenue = events.filter(
            event => String(event.venue) === String(venue._id)
        );
        const requestsForVenue = requests.filter(
            request => request.venue.toLowerCase() === venue.name.toLowerCase()
        );
        const booked = eventsForVenue.some(event => event.status === "approved") ||
            requestsForVenue.some(request => request.status === "Approved") ||
            venue.status === "occupied";
        const pending = eventsForVenue.length > 0 ||
            requestsForVenue.some(request => request.status === "Pending");
        const availability = venue.status === "maintenance"
            ? "unavailable"
            : booked
                ? "booked"
                : pending
                    ? "pending"
                    : "available";

        return [String(venue._id), availability];
    }));
};

const getVenues = async (req, res) => {
    try {

        const venues = await Venue.find();

        const venueOrder = [
            "New Seminar Hall",
            "Old Seminar Hall",
            "Dronacharya",
            "Chanakya",
            "Lab 1",
            "Lab 2",
            "Lab 3",
            "Lab 4",
            "Lab 5",
            "Lab 6"
        ];

        venues.sort((a, b) => {
            return venueOrder.indexOf(a.name) - venueOrder.indexOf(b.name);
        });

        const availability = await getAvailabilityByVenue(venues);

        res.status(200).json({
            success: true,
            count: venues.length,
            venues: venues.map(venue => ({
                ...venue.toObject(),
                type: venue.type || inferVenueType(venue.name),
                availability: availability.get(String(venue._id))
            }))
        });

    } catch (error) {

        console.error("Get Venues Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch venues",
            error: error.message
        });

    }
};

const getVenueById = async (req, res) => {
    try {

        const venue = await Venue.findById(req.params.id);

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found"
            });
        }

        const upcomingEvents = await Event.find({
            venue: venue._id,
            status: "approved",
            eventDate: { $gte: new Date() }
        })
            .populate("organizer", "name")
            .sort({ eventDate: 1, startTime: 1 })
            .lean();

        const availability = await getAvailabilityByVenue([venue]);

        res.status(200).json({
            success: true,
            venue: {
                ...venue.toObject(),
                type: venue.type || inferVenueType(venue.name),
                availability: availability.get(String(venue._id))
            },
            upcomingEvents
        });

    } catch (error) {

        console.error("Get Venue Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch venue",
            error: error.message
        });

    }
};

const getVenueAvailability = async (req, res) => {
    try {
        const { date, startTime, endTime } = req.query;

        if (!date || !startTime || !endTime || startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: "A date and valid start/end times are required."
            });
        }

        const dayStart = new Date(`${date}T00:00:00.000`);

        if (Number.isNaN(dayStart.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid availability date."
            });
        }

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const venue = await Venue.findById(req.params.id).lean();

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found."
            });
        }

        const [events, requests] = await Promise.all([
            Event.find({
                venue: venue._id,
                eventDate: { $gte: dayStart, $lte: dayEnd },
                status: { $nin: ["cancelled", "rejected"] }
            })
                .select("title startTime endTime status")
                .lean(),
            VenueRequest.find({
                venue: venue.name,
                date: { $gte: dayStart, $lte: dayEnd },
                status: { $in: ["Pending", "Approved"] }
            })
                .select("event start end status")
                .lean()
        ]);

        const conflicts = [
            ...events.map(event => ({
                title: event.title,
                startTime: event.startTime,
                endTime: event.endTime,
                status: event.status
            })),
            ...requests.map(request => ({
                title: request.event,
                startTime: request.start,
                endTime: request.end,
                status: request.status
            }))
        ].filter(item => startTime < item.endTime && endTime > item.startTime);

        const available = venue.status === "available" && conflicts.length === 0;

        return res.status(200).json({
            success: true,
            available,
            status: venue.status === "maintenance"
                ? "unavailable"
                : conflicts.length
                    ? "booked"
                    : venue.status,
            conflicts
        });
    } catch (error) {
        console.error("Check Venue Availability Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to check venue availability."
        });
    }
};

const createVenue = async (req, res) => {
    try {

        const {
            name,
            type,
            location,
            capacity,
            description,
            facilities,
            status,
            image
        } = req.body;

        if (!name || !location || !capacity) {
            return res.status(400).json({
                success: false,
                message: "Name, location and capacity are required"
            });
        }

        const venue = await Venue.create({
            name,
            type: type || inferVenueType(name),
            location,
            capacity,
            description,
            facilities,
            status,
            image
        });

        res.status(201).json({
            success: true,
            message: "Venue created successfully",
            venue
        });

    } catch (error) {

        console.error("Create Venue Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create venue",
            error: error.message
        });

    }
};

const updateVenue = async (req, res) => {
    try {

        const updates = {};
        ["name", "type", "location", "capacity", "description", "facilities", "status", "image"]
            .forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

        if (updates.name && !updates.type) {
            updates.type = inferVenueType(updates.name);
        }

        const venue = await Venue.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Venue updated successfully",
            venue
        });

    } catch (error) {

        console.error("Update Venue Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update venue",
            error: error.message
        });

    }
};

const deleteVenue = async (req, res) => {
    try {

        const venue = await Venue.findByIdAndDelete(
            req.params.id
        );

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Venue deleted successfully"
        });

    } catch (error) {

        console.error("Delete Venue Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete venue",
            error: error.message
        });

    }
};

module.exports = {
    getVenues,
    getVenueById,
    getVenueAvailability,
    createVenue,
    updateVenue,
    deleteVenue
};