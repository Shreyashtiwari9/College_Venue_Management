const express = require("express");

const router = express.Router();

const {
    createEvent,
    getEvents,
    getEventById,
    getOrganizerEvents,
    updateEvent,
    deleteEvent,
    getEventReports
} = require("../controllers/eventController");

const {
    protect,
    optionalProtect,
    requireRole
} = require("../middleware/authMiddleware");


router.post(
    "/",
    protect,
    requireRole("organizer"),
    createEvent
);


router.get(
    "/",
    optionalProtect,
    getEvents
);


router.get(
    "/reports",
    protect,
    requireRole("admin"),
    getEventReports
);


router.get(
    "/organizer/:organizerId",
    protect,
    requireRole("organizer", "admin"),
    getOrganizerEvents
);


router.get(
    "/:id",
    optionalProtect,
    getEventById
);


router.put(
    "/:id",
    protect,
    updateEvent
);


router.delete(
    "/:id",
    protect,
    deleteEvent
);


module.exports = router;