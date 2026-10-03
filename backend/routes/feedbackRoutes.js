const express = require("express");

const router = express.Router();

const {
    createFeedback,
    getAllFeedback,
    getMyFeedback,
    updateFeedbackStatus,
    deleteFeedback
} = require("../controllers/feedbackController");

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");

router.post("/", protect, requireRole("student", "organizer"), createFeedback);

router.get("/", protect, requireRole("admin"), getAllFeedback);

router.get("/user/:userId", protect, getMyFeedback);

router.patch("/:id/status", protect, requireRole("admin"), updateFeedbackStatus);

router.delete("/:id", protect, requireRole("admin"), deleteFeedback);

module.exports = router;