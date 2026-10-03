const mongoose = require("mongoose");

const equipmentRequestSchema = new mongoose.Schema(
    {
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        event: { type: String, required: true, trim: true },
        equipment: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        notes: { type: String, default: "", trim: true },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected", "Returned"],
            default: "Pending"
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("EquipmentRequest", equipmentRequestSchema);