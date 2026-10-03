const Feedback = require("../models/Feedback");

const createFeedback = async (req, res) => {
    try {
        const { event, title, message, rating } = req.body;
        const user = req.user.userId;

        if (!user || !title || !message || !rating) {
            return res.status(400).json({
                success: false,
                message: "User, title, message and rating are required."
            });
        }

        const feedback = await Feedback.create({
            user,
            event: event || null,
            title,
            message,
            rating
        });

        const populatedFeedback = await Feedback.findById(feedback._id)
            .populate("user", "name email role")
            .populate("event", "title");

        res.status(201).json({
            success: true,
            message: "Feedback submitted successfully.",
            feedback: populatedFeedback
        });
    } catch (error) {
        console.error("Create Feedback Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to submit feedback.",
            error: error.message
        });
    }
};

const getAllFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find()
            .populate("user", "name email role")
            .populate("event", "title")
            .sort({ createdAt: -1 });

        const totalResponses = feedback.length;

        const averageRating =
            totalResponses > 0
                ? feedback.reduce((sum, item) => sum + item.rating, 0) / totalResponses
                : 0;

        const positiveFeedback =
            totalResponses > 0
                ? (feedback.filter(item => item.rating >= 4).length / totalResponses) * 100
                : 0;

        const pendingReviews = feedback.filter(
            item => item.status === "pending"
        ).length;

        res.status(200).json({
            success: true,
            statistics: {
                averageRating: Number(averageRating.toFixed(1)),
                totalResponses,
                positiveFeedback: Math.round(positiveFeedback),
                pendingReviews
            },
            feedback
        });
    } catch (error) {
        console.error("Get Feedback Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load feedback.",
            error: error.message
        });
    }
};

const getMyFeedback = async (req, res) => {
    try {
        const { userId } = req.params;

        if (
            req.user.role !== "admin" &&
            String(req.user.userId) !== String(userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only view your own feedback."
            });
        }

        const feedback = await Feedback.find({ user: userId })
            .populate("event", "title")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            feedback
        });
    } catch (error) {
        console.error("Get My Feedback Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load your feedback.",
            error: error.message
        });
    }
};

const updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminReply } = req.body;

        if (!["pending", "reviewed"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid feedback status."
            });
        }

        const feedback = await Feedback.findByIdAndUpdate(
            id,
            {
                status,
                adminReply: adminReply || ""
            },
            {
                new: true,
                runValidators: true
            }
        )
            .populate("user", "name email role")
            .populate("event", "title");

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Feedback updated successfully.",
            feedback
        });
    } catch (error) {
        console.error("Update Feedback Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update feedback.",
            error: error.message
        });
    }
};

const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;

        const feedback = await Feedback.findByIdAndDelete(id);

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Feedback deleted successfully."
        });
    } catch (error) {
        console.error("Delete Feedback Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete feedback.",
            error: error.message
        });
    }
};

module.exports = {
    createFeedback,
    getAllFeedback,
    getMyFeedback,
    updateFeedbackStatus,
    deleteFeedback
};