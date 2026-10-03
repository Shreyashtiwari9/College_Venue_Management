const express = require("express");
const bcrypt = require("bcryptjs");

const {
    registerUser,
    registerOrganizerRequest,
    loginUser,
    getMyProfile,
    updateMyProfile
} = require("../controllers/authController");

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");

const User = require("../models/User");

const router = express.Router();

router.post(
    "/register",
    registerUser
);

router.post(
    "/register-organizer",
    registerOrganizerRequest
);

router.post(
    "/login",
    loginUser
);

router.get(
    "/me",
    protect,
    getMyProfile
);

router.patch(
    "/me",
    protect,
    updateMyProfile
);

router.get(
    "/test",
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Auth routes are working correctly."
        });
    }
);

router.get(
    "/check-user",
    protect,
    requireRole("admin"),
    async (req, res) => {
        try {
            const email = req.query.email;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: "Email is required."
                });
            }

            const user = await User.findOne({
                email: email.toLowerCase().trim()
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    exists: false,
                    message: "User not found in MongoDB."
                });
            }

            return res.status(200).json({
                success: true,
                exists: true,
                user: {
                    id: user._id,
                    name: user.name,
                    collegeId: user.collegeId,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive
                }
            });

        } catch (error) {
            console.error(
                "Check User Error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message: "Server error."
            });
        }
    }
);

router.post(
    "/create-organizer",
    protect,
    requireRole("admin"),
    async (req, res) => {
        try {
            const {
                name,
                collegeId,
                email,
                phone,
                department,
                designation,
                organizerType,
                clubName,
                facultyCoordinatorName,
                responsibilityDescription,
                accessRequestReason,
                termsAccepted,
                password
            } = req.body;

            const requiredFields = {
                name,
                collegeId,
                email,
                phone,
                department,
                designation,
                organizerType,
                responsibilityDescription,
                accessRequestReason,
                password
            };

            if (Object.values(requiredFields).some(value => typeof value !== "string" || !value.trim())) {
                return res.status(400).json({
                    success: false,
                    message: "Please fill all required fields."
                });
            }

            if (termsAccepted !== true) {
                return res.status(400).json({
                    success: false,
                    message: "Organizer terms acceptance must be confirmed before creating the account."
                });
            }

            const normalizedEmail = email.trim().toLowerCase();
            const normalizedCollegeId = collegeId.trim();
            const normalizedPhone = phone.trim();
            const validOrganizerTypes = [
                "faculty-coordinator",
                "staff-coordinator",
                "club-coordinator",
                "student-club-representative"
            ];

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid college email address."
                });
            }

            const phoneDigits = normalizedPhone.replace(/\D/g, "");
            if (!/^\+?[\d\s().-]+$/.test(normalizedPhone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid contact number."
                });
            }

            if (!validOrganizerTypes.includes(organizerType)) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a valid organizer type."
                });
            }

            if (
                ["club-coordinator", "student-club-representative"].includes(organizerType) &&
                (typeof clubName !== "string" || !clubName.trim())
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Club or society name is required for this organizer type."
                });
            }

            if (
                organizerType === "student-club-representative" &&
                (typeof facultyCoordinatorName !== "string" || !facultyCoordinatorName.trim())
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Faculty coordinator name is required for student club representatives."
                });
            }

            if (
                password.length < 8 ||
                !/[a-z]/.test(password) ||
                !/[A-Z]/.test(password) ||
                !/\d/.test(password)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 8 characters and include uppercase, lowercase, and numeric characters."
                });
            }

            const existingEmail =
                await User.findOne({
                    email: normalizedEmail
                });

            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Email is already registered."
                });
            }

            const existingCollegeId =
                await User.findOne({
                    collegeId: normalizedCollegeId
                });

            if (existingCollegeId) {
                return res.status(409).json({
                    success: false,
                    message:
                        "College ID is already registered."
                });
            }

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );

            const organizer =
                await User.create({
                    name: name.trim(),
                    collegeId: normalizedCollegeId,
                    email: normalizedEmail,
                    phone: normalizedPhone,
                    department: department.trim(),
                    designation: designation.trim(),
                    organizerType,
                    clubName: typeof clubName === "string" ? clubName.trim() : "",
                    facultyCoordinatorName: typeof facultyCoordinatorName === "string"
                        ? facultyCoordinatorName.trim()
                        : "",
                    responsibilityDescription: responsibilityDescription.trim(),
                    accessRequestReason: accessRequestReason.trim(),
                    termsAcceptedAt: new Date(),
                    password: hashedPassword,
                    role: "organizer",
                    isActive: true
                });

            return res.status(201).json({
                success: true,
                message:
                    "Organizer account created successfully.",
                user: {
                    id: organizer._id,
                    name: organizer.name,
                    collegeId: organizer.collegeId,
                    email: organizer.email,
                    phone: organizer.phone,
                    department: organizer.department,
                    designation: organizer.designation,
                    organizerType: organizer.organizerType,
                    clubName: organizer.clubName,
                    facultyCoordinatorName: organizer.facultyCoordinatorName,
                    responsibilityDescription: organizer.responsibilityDescription,
                    accessRequestReason: organizer.accessRequestReason,
                    role: organizer.role,
                    isActive: organizer.isActive
                }
            });

        } catch (error) {
            console.error(
                "Create Organizer Error:",
                error.message
            );

            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "Email or College ID is already registered."
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Server error while creating organizer account."
            });
        }
    }
);

router.post(
    "/reset-password",
    protect,
    async (req, res) => {
        try {
            const {
                currentPassword,
                newPassword
            } = req.body;

            if (
                !currentPassword ||
                !newPassword
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Current password and new password are required."
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message:
                        "New password must be at least 6 characters."
                });
            }

            const user =
                await User.findById(
                    req.user.userId
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }

            const isCurrentPasswordValid =
                await bcrypt.compare(
                    currentPassword,
                    user.password
                );

            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Current password is incorrect."
                });
            }

            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    10
                );

            user.password =
                hashedPassword;

            await user.save();

            const passwordVerified =
                await bcrypt.compare(
                    newPassword,
                    user.password
                );

            if (!passwordVerified) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Password update verification failed."
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Password changed successfully."
            });

        } catch (error) {
            console.error(
                "Reset Password Error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server error while resetting password."
            });
        }
    }
);

module.exports = router;