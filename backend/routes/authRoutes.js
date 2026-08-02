const express = require("express");

const router = express.Router();

const { registerUser } = require("../controllers/authController");

/*
----------
Authentication Routes 

Every Authentication related endpoint will remain here.
----------
*/

//Register a new user
router.post("/register", registerUser);

module.exports = router;