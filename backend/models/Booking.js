const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Booking Schema
|--------------------------------------------------------------------------
| A user may have historical cancelled bookings and may book the same event
| again. Only one Confirmed booking per attendee/event pair is allowed.
*/

const bookingSchema = new mongoose.Schema(
    {
        attendee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },

        bookingStatus: {
            type: String,
            enum: ["Confirmed", "Cancelled"],
            default: "Confirmed",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Partial uniqueness permits a cancelled booking followed by a rebooking.
bookingSchema.index(
    { attendee: 1, event: 1 },
    {
        unique: true,
        partialFilterExpression: { bookingStatus: "Confirmed" },
        name: "one_confirmed_booking_per_attendee_event",
    }
);

module.exports = mongoose.model("Booking", bookingSchema);
