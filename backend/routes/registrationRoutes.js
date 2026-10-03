const express = require("express");

const router =
    express.Router();


const {
    registerForEvent,
    getMyEvents,
    checkRegistration,
    cancelRegistration
} =
    require(
        "../controllers/registrationController"
    );


const {
    protect,
    requireRole
} =
    require(
        "../middleware/authMiddleware"
    );





router.post(
    "/",
    protect,
    requireRole("student"),
    registerForEvent
);



router.get(
    "/my-events",
    protect,
    requireRole("student"),
    getMyEvents
);



router.get(
    "/check/:eventId",
    protect,
    requireRole("student"),
    checkRegistration
);



router.delete(
    "/:eventId",
    protect,
    requireRole("student"),
    cancelRegistration
);


module.exports = router;