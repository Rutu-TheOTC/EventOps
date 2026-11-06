const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Event Schema
|--------------------------------------------------------------------------
| Every event belongs to one organizer. Seat counts are stored on the event
| so reservations can decrement capacity atomically.
*/

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 120,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },

        category: {
            type: String,
            required: true,
            trim: true,
            maxlength: 60,
        },

        venue: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        date: {
            type: Date,
            required: true,
            validate: {
                validator: (value) => !Number.isNaN(new Date(value).getTime()),
                message: "Please provide a valid event date.",
            },
        },

        totalSeats: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Total seats must be a whole number.",
            },
        },

        availableSeats: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: "Available seats must be a whole number.",
            },
        },

        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

eventSchema.pre("validate", function () {
    if (this.availableSeats > this.totalSeats) {
        this.invalidate(
            "availableSeats",
            "Available seats cannot exceed total seats."
        );
    }
});

module.exports = mongoose.model("Event", eventSchema);
