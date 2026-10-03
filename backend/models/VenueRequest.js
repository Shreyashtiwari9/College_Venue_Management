const mongoose = require("mongoose");

const venueRequestSchema = new mongoose.Schema(
	{
		organizer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true
		},
		event: {
			type: String,
			required: true,
			trim: true
		},
		venue: {
			type: String,
			required: true,
			trim: true
		},
		participants: {
			type: Number,
			required: true,
			min: 1
		},
		date: {
			type: Date,
			required: true
		},
		start: {
			type: String,
			required: true
		},
		end: {
			type: String,
			required: true
		},
		purpose: {
			type: String,
			default: "",
			trim: true
		},
		status: {
			type: String,
			enum: ["Pending", "Approved", "Rejected"],
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

module.exports = mongoose.model("VenueRequest", venueRequestSchema);
