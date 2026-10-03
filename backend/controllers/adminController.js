const User = require("../models/User");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const Attendance = require("../models/Attendance");
const Feedback = require("../models/Feedback");
const Volunteer = require("../models/Volunteer");
const VenueRequest = require("../models/VenueRequest");
const EquipmentRequest = require("../models/EquipmentRequest");
const Notification = require("../models/Notification");

const ADMIN_USER_FIELDS = "name collegeId email phone department year designation organizerType organizerApprovalStatus clubName facultyCoordinatorName responsibilityDescription accessRequestReason role isActive createdAt";

const getUsers = async (req, res) => {
	try {
		const users = await User.find()
			.select(ADMIN_USER_FIELDS)
			.sort({ createdAt: -1 })
			.lean();

		return res.status(200).json({
			success: true,
			count: users.length,
			users
		});
	} catch (error) {
		console.error("Get Admin Users Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to load users."
		});
	}
};

const updateUserStatus = async (req, res) => {
	try {
		const { isActive } = req.body;

		if (typeof isActive !== "boolean") {
			return res.status(400).json({
				success: false,
				message: "isActive must be a boolean."
			});
		}

		if (String(req.params.id) === String(req.user.userId)) {
			return res.status(400).json({
				success: false,
				message: "You cannot deactivate your own account."
			});
		}

		const existingUser = await User.findById(req.params.id)
			.select("role organizerApprovalStatus")
			.lean();

		if (!existingUser) {
			return res.status(404).json({
				success: false,
				message: "User not found."
			});
		}

		if (
			isActive &&
			existingUser.role === "organizer" &&
			["pending", "rejected"].includes(existingUser.organizerApprovalStatus)
		) {
			return res.status(409).json({
				success: false,
				message: "Approve this organizer request before activating the account."
			});
		}

		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ isActive },
			{
				returnDocument: "after",
				runValidators: true
			}
		)
			.select(ADMIN_USER_FIELDS)
			.lean();

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found."
			});
		}

		return res.status(200).json({
			success: true,
			message: isActive
				? "User activated successfully."
				: "User deactivated successfully.",
			user
		});
	} catch (error) {
		console.error("Update User Status Error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to update user status."
		});
	}
};

const reviewOrganizerRequest = async (req, res) => {
	try {
		const { decision } = req.body;

		if (!["approve", "reject"].includes(decision)) {
			return res.status(400).json({
				success: false,
				message: "Decision must be approve or reject."
			});
		}

		const user = await User.findById(req.params.id);

		if (!user || user.role !== "organizer") {
			return res.status(404).json({
				success: false,
				message: "Organizer request not found."
			});
		}

		if (user.organizerApprovalStatus !== "pending") {
			return res.status(409).json({
				success: false,
				message: "This organizer request has already been reviewed."
			});
		}

		user.organizerApprovalStatus = decision === "approve" ? "approved" : "rejected";
		user.isActive = decision === "approve";
		await user.save();

		try {
			await Notification.create({
				user: user._id,
				title: decision === "approve"
					? "Organizer request approved"
					: "Organizer request rejected",
				message: decision === "approve"
					? "Your organizer account is approved and ready to use."
					: "Your organizer access request was not approved. Contact your college administrator for details.",
				type: "approval"
			});
		} catch (notificationError) {
			console.error("Organizer Decision Notification Error:", notificationError.message);
		}

		return res.status(200).json({
			success: true,
			message: decision === "approve"
				? "Organizer request approved."
				: "Organizer request rejected.",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				collegeId: user.collegeId,
				role: user.role,
				organizerApprovalStatus: user.organizerApprovalStatus,
				isActive: user.isActive
			}
		});
	} catch (error) {
		console.error("Review Organizer Request Error:", error.message);
		return res.status(error.name === "CastError" ? 400 : 500).json({
			success: false,
			message: error.name === "CastError"
				? "Invalid organizer request ID."
				: "Failed to review organizer request."
		});
	}
};

const updateUser = async (req, res) => {
	try {
		const allowedFields = [
			"name",
			"collegeId",
			"email",
			"phone",
			"department",
			"year",
			"designation",
			"organizerType",
			"clubName",
			"facultyCoordinatorName",
			"responsibilityDescription",
			"accessRequestReason"
		];
		const optionalFields = [
			"year",
			"clubName",
			"facultyCoordinatorName",
			"responsibilityDescription",
			"accessRequestReason"
		];
		const updates = {};
		const existingUser = await User.findById(req.params.id)
			.select("role organizerType clubName facultyCoordinatorName")
			.lean();

		if (!existingUser) {
			return res.status(404).json({ success: false, message: "User not found." });
		}

		for (const field of allowedFields) {
			if (req.body[field] !== undefined) {
				if (
					typeof req.body[field] !== "string" ||
					(!optionalFields.includes(field) && !req.body[field].trim())
				) {
					return res.status(400).json({
						success: false,
						message: optionalFields.includes(field)
							? `${field} must be a string.`
							: `${field} must be a non-empty string.`
					});
				}

				updates[field] = req.body[field].trim();
			}
		}

		const organizerType = updates.organizerType || existingUser.organizerType;
		const clubName = updates.clubName ?? existingUser.clubName ?? "";
		const facultyCoordinatorName =
			updates.facultyCoordinatorName ?? existingUser.facultyCoordinatorName ?? "";

		if (
			updates.organizerType &&
			![
				"faculty-coordinator",
				"staff-coordinator",
				"club-coordinator",
				"student-club-representative"
			].includes(updates.organizerType)
		) {
			return res.status(400).json({
				success: false,
				message: "Please select a valid organizer type."
			});
		}

		if (
			["club-coordinator", "student-club-representative"].includes(organizerType) &&
			!clubName.trim()
		) {
			return res.status(400).json({
				success: false,
				message: "Club or society name is required for this organizer type."
			});
		}

		if (organizerType === "student-club-representative" && !facultyCoordinatorName.trim()) {
			return res.status(400).json({
				success: false,
				message: "Faculty coordinator name is required for student club representatives."
			});
		}

		if (updates.email) {
			updates.email = updates.email.toLowerCase();
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
				return res.status(400).json({
					success: false,
					message: "Email address is invalid."
				});
			}
		}

		if (!Object.keys(updates).length) {
			return res.status(400).json({
				success: false,
				message: "At least one editable field is required."
			});
		}

		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ $set: updates },
			{ returnDocument: "after", runValidators: true }
		)
			.select(ADMIN_USER_FIELDS)
			.lean();

		if (!user) {
			return res.status(404).json({ success: false, message: "User not found." });
		}

		return res.status(200).json({
			success: true,
			message: "User updated successfully.",
			user
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({
				success: false,
				message: "Email or College ID is already in use."
			});
		}

		console.error("Update Admin User Error:", error);
		return res.status(error.name === "CastError" ? 400 : 500).json({
			success: false,
			message: error.name === "CastError" ? "Invalid user ID." : "Failed to update user."
		});
	}
};

const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		if (String(id) === String(req.user.userId)) {
			return res.status(400).json({
				success: false,
				message: "You cannot delete your own account."
			});
		}

		const user = await User.findById(id).select("_id role");

		if (!user) {
			return res.status(404).json({ success: false, message: "User not found." });
		}

		if (user.role === "admin" && await User.countDocuments({ role: "admin", isActive: true }) <= 1) {
			return res.status(409).json({
				success: false,
				message: "The last administrator account cannot be deleted."
			});
		}

		const relatedCounts = await Promise.all([
			Event.countDocuments({ organizer: id }),
			EventRegistration.countDocuments({ student: id }),
			Attendance.countDocuments({ $or: [{ student: id }, { markedBy: id }] }),
			Feedback.countDocuments({ user: id }),
			Volunteer.countDocuments({ organizerId: id }),
			VenueRequest.countDocuments({ $or: [{ organizer: id }, { reviewedBy: id }] }),
			EquipmentRequest.countDocuments({ $or: [{ organizer: id }, { reviewedBy: id }] }),
			Notification.countDocuments({ user: id })
		]);

		if (relatedCounts.some(count => count > 0)) {
			return res.status(409).json({
				success: false,
				message: "This user has linked records. Deactivate the account to preserve its history."
			});
		}

		await User.findByIdAndDelete(id);
		return res.status(200).json({ success: true, message: "User deleted successfully." });
	} catch (error) {
		console.error("Delete Admin User Error:", error);
		return res.status(error.name === "CastError" ? 400 : 500).json({
			success: false,
			message: error.name === "CastError" ? "Invalid user ID." : "Failed to delete user."
		});
	}
};

module.exports = {
	getUsers,
	reviewOrganizerRequest,
	updateUserStatus,
	updateUser,
	deleteUser
};
