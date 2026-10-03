const Notification = require("../models/Notification");



const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user.userId
        })
            .populate(
                "relatedEvent",
                "title eventDate startTime endTime"
            )
            .sort({
                createdAt: -1
            });

        const unreadCount =
            await Notification.countDocuments({
                user: req.user.userId,
                isRead: false
            });

        res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications
        });

    } catch (error) {

        console.error(
            "Get Notifications Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load notifications."
        });
    }
};




const markAsRead = async (req, res) => {
    try {

        const notification =
            await Notification.findOne({
                _id: req.params.id,
                user: req.user.userId
            });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        notification.isRead = true;

        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as read.",
            notification
        });

    } catch (error) {

        console.error(
            "Mark Notification Read Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update notification."
        });
    }
};




const markAllAsRead = async (req, res) => {
    try {

        const result =
            await Notification.updateMany(
                {
                    user: req.user.userId,
                    isRead: false
                },
                {
                    $set: {
                        isRead: true
                    }
                }
            );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read.",
            modifiedCount: result.modifiedCount
        });

    } catch (error) {

        console.error(
            "Mark All Notifications Read Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update notifications."
        });
    }
};




const deleteNotification = async (req, res) => {
    try {

        const notification =
            await Notification.findOneAndDelete({
                _id: req.params.id,
                user: req.user.userId
            });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully."
        });

    } catch (error) {

        console.error(
            "Delete Notification Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete notification."
        });
    }
};




const deleteAllNotifications = async (req, res) => {
    try {

        const result =
            await Notification.deleteMany({
                user: req.user.userId
            });

        res.status(200).json({
            success: true,
            message: "All notifications deleted successfully.",
            deletedCount: result.deletedCount
        });

    } catch (error) {

        console.error(
            "Delete All Notifications Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete notifications."
        });
    }
};


module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
};