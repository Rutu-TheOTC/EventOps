const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Event = require("../models/Event");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/*
|--------------------------------------------------------------------------
| Book Event
|--------------------------------------------------------------------------
| The event seat decrement and booking insert run in one transaction.
| The event update itself is conditional, so the last seat cannot be sold
| twice by simultaneous requests.
*/

const bookEvent = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const eventId = req.params.id || req.body.eventId;

    if (!eventId || !isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid eventId is required.",
      });
    }

    let outcome = "created";
    let createdBooking = null;

    await session.withTransaction(async () => {
      const existingBooking = await Booking.findOne({
        attendee: req.user._id,
        event: eventId,
        bookingStatus: "Confirmed",
      }).session(session);

      if (existingBooking) {
        outcome = "duplicate";
        return;
      }

      const event = await Event.findOneAndUpdate(
        {
          _id: eventId,
          date: { $gt: new Date() },
          availableSeats: { $gt: 0 },
        },
        {
          $inc: { availableSeats: -1 },
        },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!event) {
        const existingEvent = await Event.findById(eventId).session(session);

        if (!existingEvent) {
          outcome = "event-not-found";
        } else if (existingEvent.date <= new Date()) {
          outcome = "event-closed";
        } else {
          outcome = "sold-out";
        }

        return;
      }

      const bookings = await Booking.create(
        [
          {
            attendee: req.user._id,
            event: event._id,
            bookingStatus: "Confirmed",
          },
        ],
        { session },
      );

      createdBooking = bookings[0];
    });

    if (outcome === "duplicate") {
      return res.status(409).json({
        success: false,
        message: "You have already booked this event.",
      });
    }

    if (outcome === "event-not-found") {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (outcome === "event-closed") {
      return res.status(400).json({
        success: false,
        message: "This event is no longer open for booking.",
      });
    }

    if (outcome === "sold-out") {
      return res.status(409).json({
        success: false,
        message: "No seats are available for this event.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Event booked successfully.",
      booking: createdBooking,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already have a confirmed booking for this event.",
      });
    }

    console.error("Book Event Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to complete the booking. Please try again.",
    });
  } finally {
    await session.endSession();
  }
};

/*
|--------------------------------------------------------------------------
| Get My Bookings
|--------------------------------------------------------------------------
| Returns the attendee's complete booking history, including both
| Confirmed and Cancelled bookings.
*/

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      attendee: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate("event");

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get My Bookings Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server Error.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Cancel Booking
|--------------------------------------------------------------------------
| The booking status change and seat restoration are one transaction.
| The status condition prevents a repeated cancellation from restoring
| another seat.
*/

const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Booking ID.",
      });
    }

    let outcome = "cancelled";

    await session.withTransaction(async () => {
      const booking = await Booking.findOneAndUpdate(
        {
          _id: req.params.id,
          attendee: req.user._id,
          bookingStatus: "Confirmed",
        },
        {
          $set: { bookingStatus: "Cancelled" },
        },
        {
          new: true,
          session,
        },
      );

      if (!booking) {
        const existingBooking = await Booking.findById(req.params.id).session(
          session,
        );

        if (!existingBooking) {
          outcome = "not-found";
        } else if (
          existingBooking.attendee.toString() !== req.user._id.toString()
        ) {
          outcome = "forbidden";
        } else {
          outcome = "already-cancelled";
        }

        return;
      }

      const event = await Event.findOneAndUpdate(
        {
          _id: booking.event,
          $expr: { $lt: ["$availableSeats", "$totalSeats"] },
        },
        {
          $inc: { availableSeats: 1 },
        },
        {
          new: true,
          session,
        },
      );

      if (!event) {
        throw new Error(
          "The event could not be found or its seat capacity is inconsistent.",
        );
      }
    });

    if (outcome === "not-found") {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (outcome === "forbidden") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking.",
      });
    }

    if (outcome === "already-cancelled") {
      return res.status(409).json({
        success: false,
        message: "This booking has already been cancelled.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error.message);

    return res.status(500).json({
      success: false,
      message:
        "Unable to cancel the booking. No booking or seat changes were committed.",
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  bookEvent,
  getMyBookings,
  cancelBooking,
};
