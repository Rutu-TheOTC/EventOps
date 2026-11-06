const jwt = require("jsonwebtoken");
const User = require("../models/User");

/*
|--------------------------------------------------------------------------
| Authentication Middleware
|--------------------------------------------------------------------------
| Verifies the Bearer token, reloads the account from MongoDB, and attaches
| the current user to req.user. Reloading the account means role changes and
| deleted accounts take effect without waiting for the JWT to expire.
*/

const protect = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. A Bearer token is required.",
            });
        }

        const token = authorization.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token not provided.",
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");
            return res.status(500).json({
                success: false,
                message: "Authentication service is not configured.",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
            });
        }

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "The account associated with this token no longer exists.",
            });
        }

        req.user = user;
        return next();
    } catch (error) {
        if (error.name !== "JsonWebTokenError" && error.name !== "TokenExpiredError") {
            console.error("Authentication Error:", error.message);
        }

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Role Authorization
|--------------------------------------------------------------------------
*/

const organizerOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "organizer") {
        return res.status(403).json({
            success: false,
            message: "Organizer access is required for this action.",
        });
    }

    return next();
};

const attendeeOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "attendee") {
        return res.status(403).json({
            success: false,
            message: "Attendee access is required for this action.",
        });
    }

    return next();
};

module.exports = {
    protect,
    organizerOnly,
    attendeeOnly,
};
