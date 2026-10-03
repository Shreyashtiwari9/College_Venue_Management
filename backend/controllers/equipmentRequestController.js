const EquipmentRequest = require("../models/EquipmentRequest");
const Notification = require("../models/Notification");

const createEquipmentRequest = async (req, res) => {
    try {
        const {
            event,
            equipment,
            quantity,
            date,
            time,
            notes
        } = req.body;

        if (!event || !equipment || !quantity || !date || !time) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required equipment fields."
            });
        }

        const request = await EquipmentRequest.create({
            organizer: req.user.userId,
            event: event.trim(),
            equipment: equipment.trim(),
            quantity: Number(quantity),
            date,
            time,
            notes: notes ? notes.trim() : ""
        });

        return res.status(201).json({
            success: true,
            message: "Equipment request submitted successfully.",
            request
        });
    } catch (error) {
        console.error("Create Equipment Request Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit equipment request."
        });
    }
};

const getMyEquipmentRequests = async (req, res) => {
    try {
        const requests = await EquipmentRequest.find({
            organizer: req.user.userId
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error("Get Equipment Requests Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load equipment requests."
        });
    }
};

const getAllEquipmentRequests = async (req, res) => {
    try {
        const requests = await EquipmentRequest.find()
            .populate("organizer", "name email collegeId")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error("Get All Equipment Requests Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load equipment requests."
        });
    }
};

const updateEquipmentRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["Approved", "Rejected", "Returned"].includes(status)) {
            return res.status(400).json({
                success: false,
            message: "Status must be Approved, Rejected or Returned."
            });
        }

        const request = await EquipmentRequest.findByIdAndUpdate(
            req.params.id,
            { status, reviewedBy: req.user.userId },
            { returnDocument: "after", runValidators: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Equipment request not found."
            });
        }

        try {
            await Notification.create({
                user: request.organizer,
                title: `Equipment Request ${status}`,
                message: `Your request for ${request.equipment} was ${status.toLowerCase()}.`,
                type: "equipment"
            });
        } catch (notificationError) {
            console.error("Equipment Request Notification Error:", notificationError);
        }

        return res.status(200).json({
            success: true,
            message: `Equipment request ${status.toLowerCase()}.`,
            request
        });
    } catch (error) {
        console.error("Update Equipment Request Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update equipment request."
        });
    }
};

module.exports = {
    createEquipmentRequest,
    getMyEquipmentRequests,
    getAllEquipmentRequests,
    updateEquipmentRequestStatus
};