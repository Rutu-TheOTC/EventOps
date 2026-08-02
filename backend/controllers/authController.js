const User = require("../models/User");

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

module.exports = {
    registerUser,
};