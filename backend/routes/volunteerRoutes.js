const express = require("express");

const router = express.Router();

const {
    getVolunteers,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer
} = require("../controllers/volunteerController");

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");


router.get("/", protect, requireRole("organizer"), getVolunteers);

router.post("/", protect, requireRole("organizer"), createVolunteer);

router.put("/:id", protect, requireRole("organizer"), updateVolunteer);

router.delete("/:id", protect, requireRole("organizer"), deleteVolunteer);


module.exports = router;