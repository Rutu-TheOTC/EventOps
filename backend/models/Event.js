const mongoose = require("mongoose");

/*
----------
Event Schema

Represents an event created by an organizer.
Every event belongs to exactly one organizer.
-----------
*/

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            required: true,
            trim: true,
        }, 

        venue: {
            type: String,
            required: true,
            trim: true,
        },

        date: {
            type: Date,
            required: true,
        },

        totalSeats: {
            type: Number,
            required: true,
        },

        availableSeats: {
            type: Number,
            required: true,
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

module.exports = mongoose.model("Event", eventSchema);