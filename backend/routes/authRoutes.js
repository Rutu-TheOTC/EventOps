const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const { 
    registerUser,
    loginUser,
    getMyProfile,
 } = require("../controllers/authController");

/*
----------
Authentication Routes 

Every Authentication related endpoint will remain here.
----------
*/

//Register a new user
router.post("/register", registerUser);

//Login existing user
router.post("/login", loginUser);

//Logged-in User's Profile
router.get("/me", protect, getMyProfile);

module.exports = router;