const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/eventController");

const { protect, organizerOnly } = require("../middleware/authMiddleware");

// Public event discovery routes.
router.get("/", getAllEvents);
router.get("/search", searchEvents);
router.get("/filter", filterEventsByCategory);
router.get("/paginate", getPaginatedEvents);

// Specific organizer routes must be registered before the /:id route.
router.get("/my-events", protect, organizerOnly, getMyEvents);
router.get("/stats", protect, organizerOnly, getOrganizerStats);

// Public single-event route comes after the named routes.
router.get("/:id", getSingleEvent);

// Organizer-only write routes.
router.post("/", protect, organizerOnly, createEvent);
router.put("/:id", protect, organizerOnly, updateEvent);
router.delete("/:id", protect, organizerOnly, deleteEvent);

module.exports = router;
