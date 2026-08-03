const express = require("express");
const router = express.Router();
const { bookEvent } = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");
const { route } = require("./authRoutes");

/*
--------------
Booking Routes

All booking-related endpoints are defined here.
--------------
*/

//Book an event
router.post("/:id", protect, bookEvent);

module.exports = router;