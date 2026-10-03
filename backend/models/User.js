const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(

    {

        name: {
            type: String,
            required: true,
            trim: true
        },


        collegeId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },


        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },


        phone: {
            type: String,
            required: true,
            trim: true
        },


        department: {
            type: String,
            required: true,
            trim: true
        },


        year: {
            type: String,
            required: function () {
                return this.role === "student";
            }
        },

        designation: {
            type: String,
            trim: true,
            default: ""
        },

        organizerType: {
            type: String,
            enum: [
                "faculty-coordinator",
                "staff-coordinator",
                "club-coordinator",
                "student-club-representative",
                null
            ],
            default: null
        },

        clubName: {
            type: String,
            trim: true,
            default: ""
        },

        facultyCoordinatorName: {
            type: String,
            trim: true,
            default: ""
        },

        responsibilityDescription: {
            type: String,
            trim: true,
            default: ""
        },

        accessRequestReason: {
            type: String,
            trim: true,
            default: ""
        },

        termsAcceptedAt: {
            type: Date,
            default: null
        },


        password: {
            type: String,
            required: true
        },


        role: {
            type: String,
            enum: [
                "student",
                "organizer",
                "admin"
            ],
            default: "student"
        },

        organizerApprovalStatus: {
            type: String,
            enum: ["pending", "approved", "rejected", null],
            default: null
        },


        isActive: {
            type: Boolean,
            default: true
        }

    },

    {
        timestamps: true
    }

);


module.exports =
    mongoose.model("User", userSchema);

