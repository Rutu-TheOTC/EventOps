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

/*
---------------
Get My Bookings Controller

Returns all bookings of the logged-in attendee.
---------------
*/

const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            attendee: req.user._id,
            bookingStatus: "Confirmed",
        }).populate("event");

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings,
        });
    } catch(error){
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

/*
---------------
Cancel Booking Controller

Allows an attendee to cancel their booking and restores the seat.
---------------
*/

const cancelBooking = async (req, res) => {
    try{
        const booking = await Booking.findById(req.params.id);

        if(!booking){
            return res.status(404).json({
                success: false,
                message: "Booking not found.",
            });
        }

        //Ensure the logged-in attendee owns this booking.
        if(booking.attendee.toString() !== req.user._id.toString()){
            return res.status(403).json({
                success: false,
                message: "You are not authorzed to cancel this booking",
            });
        }

        //Restore one available seat.

        const event = await Event.findById(booking.event);

        if(event){
            event.availableSeats += 1;
            await event.save();
        }

        //Mark the booking as cancelled.
        booking.bookingStatus = "Cancelled";

        await booking.save();

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully.",
        });
    } catch(error){
        console.error(error);
        return res.status(500),json({
            success: false,
            message: "Server Error",
        });
    }
};

module.exports = {
    bookEvent,
    getMyBookings,
    cancelBooking,
};