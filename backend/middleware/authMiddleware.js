const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required. Please login."
            });
        }

        const token =
            authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication token missing."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId)
            .select("_id role isActive")
            .lean();

        if (!user || user.isActive === false) {
            return res.status(401).json({
                success: false,
                message: "This account is unavailable. Please login again."
            });
        }

        req.user = {
            userId: user._id,
            role: user.role
        };

        next();

    } catch (error) {
        console.error(
            "Auth Middleware Error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired authentication token."
        });
    }
};

const optionalProtect = async (req, res, next) => {
    if (!req.headers.authorization) {
        return next();
    }

    return protect(req, res, next);
};

const requireRole = function (...allowedRoles) {
    return function (req, res, next) {
        if (
            !req.user ||
            !allowedRoles.includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to perform this action."
            });
        }

        next();
    };
};

module.exports = {
    protect,
    optionalProtect,
    requireRole
};
