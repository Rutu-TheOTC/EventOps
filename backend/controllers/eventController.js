const mongoose = require("mongoose");
const Event = require("../models/Event");
const Booking = require("../models/Booking");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const formatDate = (value) => {
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatEvent = (event, includeDescription = true) => {
    const eventObject = event.toObject();
    delete eventObject.__v;

    if (!includeDescription) {
        delete eventObject.description;
    }

    return {
        ...eventObject,
        isBookingOpen: event.availableSeats > 0 && new Date(event.date) > new Date(),
        isSoldOut: event.availableSeats === 0,
        organizerName: event.organizer?.fullName || "Event organizer",
        bookedSeats: event.totalSeats - event.availableSeats,
        formattedDate: formatDate(event.date),
    };
};

const sendValidationError = (res, error) => {
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }

    return null;
};

/*
|--------------------------------------------------------------------------
| Create Event
|--------------------------------------------------------------------------
*/

const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            venue,
            date,
            totalSeats,
        } = req.body;

        if (
            typeof title !== "string" || !title.trim() ||
            typeof description !== "string" || !description.trim() ||
            typeof category !== "string" || !category.trim() ||
            typeof venue !== "string" || !venue.trim() ||
            !date ||
            totalSeats === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, description, category, venue, date and total seats are required.",
            });
        }

        const parsedDate = new Date(date);
        const parsedSeats = Number(totalSeats);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid event date.",
            });
        }

        if (parsedDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "An event must be scheduled for a future date.",
            });
        }

        if (!Number.isInteger(parsedSeats) || parsedSeats < 1) {
            return res.status(400).json({
                success: false,
                message: "Total seats must be a positive whole number.",
            });
        }

        const event = await Event.create({
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            venue: venue.trim(),
            date: parsedDate,
            totalSeats: parsedSeats,
            availableSeats: parsedSeats,
            organizer: req.user._id,
        });

        return res.status(201).json({
            success: true,
            message: "Event created successfully.",
            event,
        });
    } catch (error) {
        const validationResponse = sendValidationError(res, error);
        if (validationResponse) return validationResponse;

        console.error("Create Event Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Public Event Discovery
|--------------------------------------------------------------------------
*/

const getAllEvents = async (req, res) => {
    try {
        const sortOption = req.query.sort === "oldest"
            ? { createdAt: 1 }
            : req.query.sort === "newest"
                ? { createdAt: -1 }
                : { date: 1 };

        const events = await Event.find({
            date: { $gte: new Date() },
        })
            .select("title description category venue date totalSeats availableSeats organizer createdAt updatedAt")
            .sort(sortOption)
            .populate("organizer", "fullName email");

        const formattedEvents = events.map((event) => formatEvent(event));

        return res.status(200).json({
            success: true,
            count: formattedEvents.length,
            events: formattedEvents,
        });
    } catch (error) {
        console.error("Get Events Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error.",
        });
    }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchEvents = async (req, res) => {
    try {
        const keyword = typeof req.query.keyword === "string"
            ? req.query.keyword.trim()
            : "";

        if (!keyword) {
            return res.status(200).json({
                success: true,
                count: 0,
                events: [],
            });
        }

        const safeKeyword = escapeRegex(keyword);

        const events = await Event.find({
            date: { $gte: new Date() },
            $or: [
                { title: { $regex: safeKeyword, $options: "i" } },
                { category: { $regex: safeKeyword, $options: "i" } },
            ],
        })
            .sort({ date: 1 })
            .populate("organizer", "fullName email");

        const formattedEvents = events.map((event) => formatEvent(event));

        return res.status(200).json({
            success: true,
            count: formattedEvents.length,
            events: formattedEvents,
        });
    } catch (error) {
        console.error("Search Events Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error.",
        });
    }
};

const filterEventsByCategory = async (req, res) => {
    try {
        const category = typeof req.query.category === "string"
            ? req.query.category.trim()
            : "";

        if (!category) {
            return res.status(400).json({
                success: false,
                message: "A category query is required.",
            });
        }

        const events = await Event.find({
            category: { $regex: `^${escapeRegex(category)}$`, $options: "i" },
            date: { $gte: new Date() },
        })
            .sort({ date: 1 })
            .populate("organizer", "fullName email");

        const formattedEvents = events.map((event) => formatEvent(event));

        return res.status(200).json({
            success: true,
            count: formattedEvents.length,
            events: formattedEvents,
        });
    } catch (error) {
        console.error("Filter Events Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error.",
        });
    }
};

const getPaginatedEvents = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page, 10) || 1;
        const requestedLimit = Number.parseInt(req.query.limit, 10) || 5;

        if (page < 1 || requestedLimit < 1) {
            return res.status(400).json({
                success: false,
                message: "Page and limit must be positive integers.",
            });
        }

        const limit = Math.min(requestedLimit, 50);
        const skip = (page - 1) * limit;
        const filter = { date: { $gte: new Date() } };

        const [totalEvents, events] = await Promise.all([
            Event.countDocuments(filter),
            Event.find(filter)
                .select("title category venue date totalSeats availableSeats organizer createdAt")
                .sort({ date: 1 })
                .populate("organizer", "fullName email")
                .skip(skip)
                .limit(limit),
        ]);

        return res.status(200).json({
            success: true,
            page,
            totalPages: Math.ceil(totalEvents / limit),
            totalEvents,
            count: events.length,
            events: events.map((event) => formatEvent(event, false)),
        });
    } catch (error) {
        console.error("Paginated Events Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error.",
        });
    }
};

const getSingleEvent = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Event ID.",
            });
        }

        const event = await Event.findById(req.params.id)
            .populate("organizer", "fullName email");

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        return res.status(200).json({
            success: true,
            event: formatEvent(event),
        });
    } catch (error) {
        console.error("Get Single Event Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Organizer Dashboard
|--------------------------------------------------------------------------
*/

const getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({
            organizer: req.user._id,
        })
            .sort({ createdAt: -1 })
            .populate("organizer", "fullName email");

        return res.status(200).json({
            success: true,
            count: events.length,
            events: events.map((event) => formatEvent(event)),
        });
    } catch (error) {
        console.error("Get My Events Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error.",
        });
    }
};

const getOrganizerStats = async (req, res) => {
    try {
        const stats = await Event.aggregate([
            { $match: { organizer: req.user._id } },
            {
                $group: {
                    _id: null,
                    totalEvents: { $sum: 1 },
                    totalSeats: { $sum: "$totalSeats" },
                    availableSeats: { $sum: "$availableSeats" },
                },
            },
        ]);

        const result = stats[0] || {
            totalEvents: 0,
            totalSeats: 0,
            availableSeats: 0,
        };

        return res.status(200).json({
            success: true,
            totalEvents: result.totalEvents,
            totalSeats: result.totalSeats,
            availableSeats: result.availableSeats,
        });
    } catch (error) {
        console.error("Organizer Stats Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Update Event
|--------------------------------------------------------------------------
| Only editable fields are accepted. Seat capacity is recalculated from the
| number of already-booked seats, so an organizer cannot overwrite inventory.
*/

const updateEvent = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Event ID.",
            });
        }

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this event.",
            });
        }

        const editableFields = ["title", "description", "category", "venue", "date", "totalSeats"];
        const suppliedFields = editableFields.filter((field) =>
            Object.prototype.hasOwnProperty.call(req.body, field)
        );

        if (suppliedFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No editable event fields were provided.",
            });
        }

        for (const field of ["title", "description", "category", "venue"]) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                if (typeof req.body[field] !== "string" || !req.body[field].trim()) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} must be a non-empty string.`,
                    });
                }

                event[field] = req.body[field].trim();
            }
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "date")) {
            const updatedDate = new Date(req.body.date);

            if (Number.isNaN(updatedDate.getTime()) || updatedDate <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "The event date must be a valid future date.",
                });
            }

            event.date = updatedDate;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "totalSeats")) {
            const updatedTotalSeats = Number(req.body.totalSeats);
            const bookedSeats = event.totalSeats - event.availableSeats;

            if (!Number.isInteger(updatedTotalSeats) || updatedTotalSeats < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Total seats must be a positive whole number.",
                });
            }

            if (updatedTotalSeats < bookedSeats) {
                return res.status(400).json({
                    success: false,
                    message: `Total seats cannot be lower than the ${bookedSeats} seats already booked.`,
                });
            }

            event.totalSeats = updatedTotalSeats;
            event.availableSeats = updatedTotalSeats - bookedSeats;
        }

        await event.save();

        return res.status(200).json({
            success: true,
            message: "Event updated successfully.",
            event,
        });
    } catch (error) {
        const validationResponse = sendValidationError(res, error);
        if (validationResponse) return validationResponse;

        console.error("Update Event Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error.",
        });
    }
};

/*
|--------------------------------------------------------------------------
| Delete Event
|--------------------------------------------------------------------------
| Deletion is transactional and blocked while confirmed bookings exist.
| This prevents active bookings from being left without their event.
*/

const deleteEvent = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Event ID.",
            });
        }

        let outcome = "deleted";

        await session.withTransaction(async () => {
            const event = await Event.findById(req.params.id).session(session);

            if (!event) {
                outcome = "not-found";
                return;
            }

            if (event.organizer.toString() !== req.user._id.toString()) {
                outcome = "forbidden";
                return;
            }

            const confirmedBookings = await Booking.countDocuments({
                event: event._id,
                bookingStatus: "Confirmed",
            }).session(session);

            if (confirmedBookings > 0) {
                outcome = "has-bookings";
                return;
            }

            await Event.deleteOne({ _id: event._id }, { session });
        });

        if (outcome === "not-found") {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        if (outcome === "forbidden") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this event.",
            });
        }

        if (outcome === "has-bookings") {
            return res.status(409).json({
                success: false,
                message: "This event has confirmed bookings. It cannot be deleted until those bookings are cancelled.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event deleted successfully.",
        });
    } catch (error) {
        console.error("Delete Event Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error.",
        });
    } finally {
        await session.endSession();
    }
};

module.exports = {
    createEvent,
    getAllEvents,
    searchEvents,
    filterEventsByCategory,
    getPaginatedEvents,
    getSingleEvent,
    getMyEvents,
    getOrganizerStats,
    updateEvent,
    deleteEvent,
};
