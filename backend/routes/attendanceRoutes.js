const express = require("express");

const router = express.Router();

const {
    getEventAttendance,
    markAttendance,
    getMyAttendance
} = require("../controllers/attendanceController");

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");

router.get(
    "/event/:eventId",
    protect,
    requireRole("organizer", "admin"),
    getEventAttendance
);

router.post(
    "/mark",
    protect,
    requireRole("organizer", "admin"),
    markAttendance
);

router.get(
    "/my",
    protect,
    requireRole("student"),
    getMyAttendance
);

module.exports = router;