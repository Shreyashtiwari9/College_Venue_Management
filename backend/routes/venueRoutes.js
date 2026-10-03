
const express = require("express");

const router = express.Router();

const {
    getVenues,
    getVenueById,
    getVenueAvailability,
    createVenue,
    updateVenue,
    deleteVenue
} = require("../controllers/venueController");

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");




router.get(
    "/",
    getVenues
);




router.get(
    "/:id",
    getVenueById
);

router.get(
    "/:id/availability",
    getVenueAvailability
);




router.post(
    "/",
    protect,
    requireRole("admin"),
    createVenue
);




router.put(
    "/:id",
    protect,
    requireRole("admin"),
    updateVenue
);




router.delete(
    "/:id",
    protect,
    requireRole("admin"),
    deleteVenue
);


module.exports = router;
