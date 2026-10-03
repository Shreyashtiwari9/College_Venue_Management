const express = require("express");

const router = express.Router();

const {
	getUsers,
	reviewOrganizerRequest,
	updateUserStatus,
	updateUser,
	deleteUser
} = require("../controllers/adminController");

const {
	protect,
	requireRole
} = require("../middleware/authMiddleware");

router.get(
	"/users",
	protect,
	requireRole("admin"),
	getUsers
);

router.patch(
	"/users/:id/status",
	protect,
	requireRole("admin"),
	updateUserStatus
);

router.patch(
	"/users/:id/organizer-review",
	protect,
	requireRole("admin"),
	reviewOrganizerRequest
);

router.patch(
	"/users/:id",
	protect,
	requireRole("admin"),
	updateUser
);

router.delete(
	"/users/:id",
	protect,
	requireRole("admin"),
	deleteUser
);

module.exports = router;
