const express = require("express");
const router = express.Router();

const {
    bookEvent,
    getMyBookings,
    cancelBooking,
} = require("../controllers/bookingController");

const {
    protect,
    attendeeOnly,
} = require("../middleware/authMiddleware");

// All booking operations require an authenticated attendee.
router.get("/my-bookings", protect, attendeeOnly, getMyBookings);

// Current frontend contract: POST /api/bookings with { eventId }.
router.post("/", protect, attendeeOnly, bookEvent);

// Backward-compatible contract: POST /api/bookings/:eventId.
router.post("/:id", protect, attendeeOnly, bookEvent);

// Current frontend contract: PATCH /api/bookings/:bookingId/cancel.
router.patch("/:id/cancel", protect, attendeeOnly, cancelBooking);

// Keep the previous backend URL working during transition.
router.put("/cancel/:id", protect, attendeeOnly, cancelBooking);

module.exports = router;
