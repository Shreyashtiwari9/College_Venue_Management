const Volunteer = require("../models/Volunteer");

const getVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find({
            organizerId: req.user.userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: volunteers.length,
            volunteers
        });
    } catch (error) {
        console.error("Get Volunteers Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load volunteers",
            error: error.message
        });
    }
};


const createVolunteer = async (req, res) => {
    try {
        const { name, role } = req.body;

        if (!name || !role) {
            return res.status(400).json({
                success: false,
                message: "Name and role are required"
            });
        }

        const volunteer = await Volunteer.create({
            name: name.trim(),
            role: role.trim(),
            organizerId: req.user.userId,
            status: "active"
        });

        res.status(201).json({
            success: true,
            message: "Volunteer added successfully",
            volunteer
        });
    } catch (error) {
        console.error("Create Volunteer Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add volunteer",
            error: error.message
        });
    }
};


const updateVolunteer = async (req, res) => {
    try {
        const {
            name,
            role,
            status
        } = req.body;

        const volunteer = await Volunteer.findOneAndUpdate(
            {
                _id: req.params.id,
                organizerId: req.user.userId
            },
            {
                ...(name !== undefined && { name: name.trim() }),
                ...(role !== undefined && { role: role.trim() }),
                ...(status !== undefined && { status })
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Volunteer updated successfully",
            volunteer
        });
    } catch (error) {
        console.error("Update Volunteer Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update volunteer",
            error: error.message
        });
    }
};


const deleteVolunteer = async (req, res) => {
    try {
        const volunteer = await Volunteer.findOneAndDelete({
            _id: req.params.id,
            organizerId: req.user.userId
        });

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Volunteer removed successfully"
        });
    } catch (error) {
        console.error("Delete Volunteer Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to remove volunteer",
            error: error.message
        });
    }
};


module.exports = {
    getVolunteers,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer
};