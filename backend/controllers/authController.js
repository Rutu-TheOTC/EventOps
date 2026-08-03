const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

/*
----------
Register User

Creates a new user account.
Password hashing is NOT done because the User model handles it
automatically using the pre("save") middleware.
----------
*/

const registerUser = async (req, res) => {
    try{
        const { fullName, email, password, role } = req.body;

        //Check if an account already exists with this email.
        const existingUser = await User.findOne({ email });

        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        //Create a new user document
        const user = await User.create({
            fullName,
            email,
            password,
            role,
        });
        
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch(error){
        console.error("Register Error:",error.message);

        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

/*
------------
Login User

Verifies email & password.
If both are correct, a JWT Token is generated and returned.
------------
*/

const loginUser = async (req, res) => {
    try{
        const { email, password } = req.body;

        //Check for empty fields
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        //Find User and explicitely include password
        //password has "select: false" in our schema.
        const user = await User.findOne({ email }).select("+password");

        if(!user){
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        //Compare entered password with hashed password.
        const isPasswordMatched = await bcrypt.compare(
            password,
            user.password
        );

        if(!isPasswordMatched){
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        //Generate JWT Token 
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login Successful.",
            token,

            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch(error){
        console.error("Login Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

/*
----------------------
Get Logged-in User Profile

Returns the profile of the currently authenticated user.
The user information comes from authMiddleware (req.user).
----------------------
*/

const getMyProfile = async (req, res) => {
    res.status(200).json({
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