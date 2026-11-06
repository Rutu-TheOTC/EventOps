const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

/*
|--------------------------------------------------------------------------
| Register User
|--------------------------------------------------------------------------
| Public registration always creates an attendee. The role sent by a client
| is deliberately ignored so a visitor cannot register as an organizer/admin.
*/

const registerUser = async (req, res) => {
    try {
        const fullName = typeof req.body.fullName === "string"
            ? req.body.fullName.trim()
            : "";
        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";
        const password = typeof req.body.password === "string"
            ? req.body.password
            : "";

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email and password are required.",
            });
        }

        if (fullName.length < 2 || fullName.length > 80) {
            return res.status(400).json({
                success: false,
                message: "Full name must be between 2 and 80 characters.",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters.",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        const user = await User.create({
            fullName,
            email,
            password,
            role: "attendee",
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Register Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Login User
|--------------------------------------------------------------------------
*/

const loginUser = async (req, res) => {
    try {
        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";
        const password = typeof req.body.password === "string"
            ? req.body.password
            : "";

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if (!isPasswordMatched) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get Logged-in User Profile
|--------------------------------------------------------------------------
*/

const getMyProfile = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Profile fetched successfully.",
        user: req.user,
    });
};

module.exports = {
    registerUser,
    loginUser,
    getMyProfile,
};
