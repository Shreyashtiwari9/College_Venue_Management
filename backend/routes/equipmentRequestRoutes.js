const express = require("express");

const router = express.Router();

const {
    createEquipmentRequest,
    getMyEquipmentRequests,
    getAllEquipmentRequests,
    updateEquipmentRequestStatus
} = require("../controllers/equipmentRequestController");

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");

router.post("/", protect, requireRole("organizer"), createEquipmentRequest);
router.get("/mine", protect, requireRole("organizer"), getMyEquipmentRequests);
router.get("/", protect, requireRole("admin"), getAllEquipmentRequests);
router.patch(
    "/:id/status",
    protect,
    requireRole("admin"),
    updateEquipmentRequestStatus
);

module.exports = router;