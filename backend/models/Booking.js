const mongoose = require("mongoose");

/*
-------------
Booking Schema 

Store bookings made by attendees for events.
-------------
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
            enum: ["Confirmed","Cancelled"],
            default: "Confirmed",
        },
    }, 

    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Booking", bookingSchema);