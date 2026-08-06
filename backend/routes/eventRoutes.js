const express = require("express");

const router = express.Router();

const { 
    createEvent, 
    getAllEvents,
    searchEvents,
    filterEventsByCategory,
    getPaginatedEvents,
    getMyEvents,
    getOrganizerStats,
    updateEvent,
    deleteEvent,
} = require("../controllers/eventController");

const { protect } = require("../middleware/authMiddleware");

//Get all events
router.get("/", getAllEvents);

//Search events by title or category
router.get("/search", searchEvents);

//Filter events by category
router.get("/filter", filterEventsByCategory);

//Get paginated events
router.get("/paginate", getPaginatedEvents);

//Get all events created by the logged-in organizer
router.get("/my-events", protect, getMyEvents);

//Organizer Dashboard Statistics
router.get("/stats", protect, getOrganizerStats);

/*
---------
Event Routes

All event-related endpoints are defined here.
---------
*/

//Create a new event (Only authenticated users)
router.post("/", protect, createEvent);

//Update an event
router.put("/:id", protect, updateEvent);

//Delete an event
router.delete("/:id", protect, deleteEvent);

module.exports = router;