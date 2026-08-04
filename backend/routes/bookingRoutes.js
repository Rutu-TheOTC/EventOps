const express = require("express");
const router = express.Router();
const { 
    bookEvent, 
    getMyBookings,
    cancelBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");
const { route } = require("./authRoutes");

/*
--------------
Booking Routes

All booking-related endpoints are defined here.
--------------
*/

//View my bookings
router.get("/my-bookings", protect, getMyBookings);

//Cancel a booking
router.put("/cancel/:id", protect, cancelBooking);

//Book an event
router.post("/:id", protect, bookEvent);

module.exports = router;