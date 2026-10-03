const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Notification = require("../models/Notification");

const registerOrganizerRequest = async (req, res) => {
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
                message: "Please fill all required organizer fields."
            });
        }

        if (termsAccepted !== true) {
            return res.status(400).json({
                success: false,
                message: "Please accept the Terms and Privacy Policy."
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

        if (await User.findOne({ email: normalizedEmail })) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });
        }

        if (await User.findOne({ collegeId: normalizedCollegeId })) {
            return res.status(409).json({
                success: false,
                message: "College ID or Employee ID is already registered."
            });
        }

        const organizer = await User.create({
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
            password: await bcrypt.hash(password, 10),
            role: "organizer",
            organizerApprovalStatus: "pending",
            isActive: false
        });

        try {
            const admins = await User.find({ role: "admin", isActive: true })
                .select("_id")
                .lean();

            if (admins.length) {
                await Notification.insertMany(admins.map(admin => ({
                    user: admin._id,
                    title: "Organizer access request",
                    message: `${organizer.name} submitted an organizer access request.`,
                    type: "approval"
                })));
            }
        } catch (notificationError) {
            console.error("Organizer Request Notification Error:", notificationError.message);
        }

        return res.status(201).json({
            success: true,
            message: "Organizer request submitted. Your account will be available after Admin approval.",
            user: {
                id: organizer._id,
                name: organizer.name,
                email: organizer.email,
                collegeId: organizer.collegeId,
                role: organizer.role,
                organizerApprovalStatus: organizer.organizerApprovalStatus
            }
        });
    } catch (error) {
        console.error("Organizer Request Error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email or College ID is already registered."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Organizer request details are invalid."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error while submitting organizer request."
        });
    }
};

const registerUser = async (req, res) => {
    try {
        const { name, collegeId, email, phone, department, year, password } = req.body;

        if (!name || !collegeId || !email || !phone || !department || !year || !password) {
            return res.status(400).json({ success: false, message: "Please fill all required fields." });
        }

        if (
            typeof name !== "string" ||
            typeof collegeId !== "string" ||
            typeof email !== "string" ||
            typeof phone !== "string" ||
            typeof department !== "string" ||
            typeof password !== "string" ||
            password.length < 6 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid registration details and a password of at least 6 characters."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedCollegeId = collegeId.trim();

        if (await User.findOne({ email: normalizedEmail })) {
            return res.status(409).json({ success: false, message: "Email is already registered." });
        }

        if (await User.findOne({ collegeId: normalizedCollegeId })) {
            return res.status(409).json({ success: false, message: "College ID is already registered." });
        }

        const user = await User.create({
            name: name.trim(),
            collegeId: normalizedCollegeId,
            email: normalizedEmail,
            phone: phone.trim(),
            department: department.trim(),
            year,
            password: await bcrypt.hash(password, 10),
            role: "student"
        });

        return res.status(201).json({
            success: true,
            message: "Student account created successfully.",
            user: { id: user._id, name: user.name, collegeId: user.collegeId, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Register Error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email or College ID is already registered."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Registration details are invalid."
            });
        }

        return res.status(500).json({ success: false, message: "Server error while creating account." });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, collegeId, password, role } = req.body;

        if ((!email && !collegeId) || !password) {
            return res.status(400).json({ success: false, message: "Please enter email/College ID and password." });
        }

        if (role && !["student", "organizer", "admin"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid account type." });
        }

        const identifier = (email || collegeId).trim();
        let user = await User.findOne({
            $or: [{ email: identifier.toLowerCase() }, { collegeId: identifier }]
        });

        const passwordMatches = user
            ? await bcrypt.compare(password, user.password)
            : false;

        const rejectionReason = !user
            ? "account-not-found"
            : role && user.role !== role
                ? "role-mismatch"
                : !passwordMatches
                    ? "password-mismatch"
                    : null;

        if (rejectionReason) {
            console.warn("[Auth] Login rejected", {
                reason: rejectionReason,
                requestedRole: role || null,
                storedRole: user?.role || null
            });

            return res.status(401).json({
                success: false,
                code: "INVALID_CREDENTIALS",
                message: "Invalid email/College ID or password."
            });
        }

        if (
            user.role === "organizer" &&
            user.organizerApprovalStatus === "pending"
        ) {
            return res.status(403).json({
                success: false,
                code: "ORGANIZER_PENDING",
                message: "Your organizer request is waiting for Admin approval."
            });
        }

        if (
            user.role === "organizer" &&
            user.organizerApprovalStatus === "rejected"
        ) {
            return res.status(403).json({
                success: false,
                code: "ORGANIZER_REJECTED",
                message: "Your organizer access request was not approved. Contact your college administrator."
            });
        }

        if (!user.isActive) {
            console.warn("[Auth] Login rejected", {
                reason: "inactive-account",
                requestedRole: role || null,
                storedRole: user.role
            });

            return res.status(401).json({
                success: false,
                code: "INVALID_CREDENTIALS",
                message: "Invalid email/College ID or password."
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                collegeId: user.collegeId,
                email: user.email,
                phone: user.phone,
                department: user.department,
                year: user.year,
                designation: user.designation,
                organizerType: user.organizerType,
                clubName: user.clubName,
                facultyCoordinatorName: user.facultyCoordinatorName,
                responsibilityDescription: user.responsibilityDescription,
                accessRequestReason: user.accessRequestReason,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login Error:", error.message);
        return res.status(500).json({ success: false, message: "Server error while logging in." });
    }
};

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("name collegeId email phone department year designation organizerType clubName facultyCoordinatorName responsibilityDescription accessRequestReason role isActive")
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({ success: true, user: { id: user._id, ...user } });
    } catch (error) {
        console.error("Get Profile Error:", error);
        return res.status(500).json({ success: false, message: "Failed to load profile." });
    }
};

const updateMyProfile = async (req, res) => {
    try {
        const allowedFields = ["name", "phone", "department", "year"];
        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = String(req.body[field]).trim();
            }
        });

        if (!updates.name || !updates.phone || !updates.department || !updates.year) {
            return res.status(400).json({
                success: false,
                message: "Name, phone, department and year are required."
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updates },
            { returnDocument: "after", runValidators: true }
        )
            .select("name collegeId email phone department year role isActive")
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: { id: user._id, ...user }
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        return res.status(500).json({ success: false, message: "Failed to update profile." });
    }
};

module.exports = { registerUser, registerOrganizerRequest, loginUser, getMyProfile, updateMyProfile };
