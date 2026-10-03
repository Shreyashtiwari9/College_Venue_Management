const express = require("express");

const router = express.Router();

const {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
} = require("../controllers/notificationController");

const {
    protect
} = require("../middleware/authMiddleware");




router.get(
    "/",
    protect,
    getMyNotifications
);




router.put(
    "/:id/read",
    protect,
    markAsRead
);




router.put(
    "/read-all",
    protect,
    markAllAsRead
);




router.delete(
    "/:id",
    protect,
    deleteNotification
);




router.delete(
    "/",
    protect,
    deleteAllNotifications
);


module.exports = router;