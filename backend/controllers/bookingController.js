const Booking = require("../models/Booking");
const Event = require("../models/Event");

/*
----------
Book Event Controller

Allows an authenticated attendee to book an event. 
----------
*/

const bookEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if(!event){
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }

        //Prevent Overbooking
        if(event.availableSeats <= 0){
            return res.status(400).json({
                success: false,
                message: "No seats available."
            });
        }

        //Prevent Duplicate Booking
        const existingBooking = await Booking.findOne({
            attendee: req.user._id,
            event: event._id,
            bookingStatus: "Confirmed",
        });

        if(existingBooking){
            return res.status(400).json({
                success: false,
                message: "You have already booked this event.",
            });
        }

        //Create Booking
        const booking = await Booking.create({
            attendee: req.user._id,
            event: event._id,
        });

        //Reduce Available Seats
        event.availableSeats -= 1;
        await event.save();
        res.status(201).json({
            success: true,
            message: "Event booked successfully.",
            booking,
        });
    } catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

module.exports = {
    bookEvent,
};