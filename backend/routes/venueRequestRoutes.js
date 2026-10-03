const express = require("express");

const router = express.Router();

const {
    createVenueRequest,
    getMyVenueRequests,
    getAllVenueRequests,
    updateVenueRequestStatus
} = require("../controllers/venueRequestController");

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");

router.post(
    "/",
    protect,
    requireRole("organizer"),
    createVenueRequest
);

router.get(
    "/mine",
    protect,
    requireRole("organizer"),
    getMyVenueRequests
);

router.get(
    "/",
    protect,
    requireRole("admin"),
    getAllVenueRequests
);

router.patch(
    "/:id/status",
    protect,
    requireRole("admin"),
    updateVenueRequestStatus
);

module.exports = router;