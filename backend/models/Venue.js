const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            default: "",
            trim: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        description: {
            type: String,
            default: ""
        },

        facilities: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ["available", "occupied", "maintenance"],
            default: "available"
        },

        image: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Venue", venueSchema);
