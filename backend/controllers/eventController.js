const mongoose = require("mongoose");
const Event = require("../models/Event");

/*
------------
Create Event Controller

Creates a new event for the currently logged-in organizer.
------------
*/

const createEvent = async (req, res) => {
    try{
        const{
            title,
            description,
            category,
            venue,
            date,
            totalSeats,
        } = req.body;

        //Check whether all required fields are present.
        if(
            !title ||
            !description || 
            !category ||
            !venue ||
            !date || 
            !totalSeats
        ){
            return res.status(400).json({
                success: false,
                message: "All Fields are required.",
            });
        }

        //Create the event 
        const event = await Event.create({
            title,
            description,
            category,
            venue,
            date,
            totalSeats,

            //Initially all seats are available
            availableSeats: totalSeats,

            //Logged-in organizer
            organizer: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: "Event Created Successfully",
            event,
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
----------
Get All Events Controller

Returns all events available in the database.
----------
*/

const getAllEvents = async (req, res) => {
    try{
        const events = await Event.find()
            .select("title category venue date availableSeats organizer")
            .sort({ createdAt: -1 })
            .populate("organizer","fullName email");

        res.status(200).json({
            success: true,
            count: events.length,
            events,
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
-------------
Search Events Controller

Allow users to search events by title or category.
-------------
*/

const searchEvents = async (req, res) => {
    try {
        const { keyword } = req.query;

        const events = await Event.find({
            $or: [
                {
                    title: {
                        $regex: keyword || "",
                        $options: "i",
                    },
                },

                {
                    category: {
                        $regex: keyword || "",
                        $options: "i",    
                    },
                },
            ],
        })
        .sort({ createdAt: -1 })
        .populate("organizer", "fullName email");

        res.status(200).json({
            success: true,
            count: events.length,
            events,
        });
    } catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

/*
------------
Filter Events By Category Controller

Returns all events belonging to a specific category.
------------
*/

const filterEventsByCategory = async (req, res) => {
    try {
        const { category } = req.query;

        const events = await Event.find({
            category,
        })
        .sort({ createdAt: -1 })
        .populate("organizer", "fullName email");

        res.status(200).json({
            success: true,
            count: events.length,
            events,
        });
    } catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

/*
------------
Get Paginated Events Controller

Returns events page by page. 
-------------
*/

const getPaginatedEvents = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const totalEvents = await Event.countDocuments();

        const events = await Event.find()
            .select("title category venue availableSeats organizer")
            .sort({ createdAt: -1 })
            .populate("organizer", "fullName email")
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            page,
            totalPages: Math.ceil(totalEvents / limit),
            totalEvents,
            count: events.length,
            events,
        });
    } catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

/*
------------
Get Single Event Controller

Returns details of one event using its ID.
------------
*/

const getSingleEvent = async (req, res) => {
    try {
        //Check whether the Event ID is valid
        if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Event ID.",
            });
        }

        const event = await Event.findById(req.params.id)
            .populate("organizer", "fullName email");

        if(!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        res.status(200).json({
            success: true,
            event,
        });
    } catch(error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

/*
-------------
Get My Events Controller 

Return all events created by the logged-in organizer.
--------------
*/

const getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({
            organizer: req.user._id,
        }).sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            count: events.length,
            events,
        });
    } catch(error){
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

/*
-------------
Organizer Statistics Controller

Returns dashboard statistics for the logged-in organizer.
-------------
*/

const getOrganizerStats = async (req, res) => {
    try {
        const events = await Event.find({
            organizer: req.user._id,
        });

        const totalEvents = events.length;

        const totalSeats = events.reduce(
            (sum, event) => sum + event.totalSeats,
            0
        );

        const availableSeats = events.reduce(
            (sum, event) => sum + event.availableSeats,
            0
        );

        res.status(200).json({
            success: true,
            totalEvents,
            totalSeats,
            availableSeats,
        });
    } catch(error){
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};


/*
----------
Update Event Controller

Allows the organizer to update an existing event.
----------
*/

const updateEvent = async (req, res) => {
    try{
        const event = await Event.findById(req.params.id);

        if(!event){
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        //Only the organizer who created the event is allowed to update it.
        if(event.organizer.toString() !== req.user._id.toString()){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this event.",
            });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,

            req.body,

            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            message: "Event updated successfully.",
            event: updatedEvent,
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
----------
Delete Event Controller

Allows the organizer to delete an event.
----------
*/

const deleteEvent = async (req, res) => {
    try{
        const event = await Event.findById(req.params.id);

        if(!event){
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }

        //Only the organizer who created this event can delete it.
        if(event.organizer.toString() !== req.user._id.toString()){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this event.",
            });
        }

        await event.deleteOne();

        res.status(200).json({
            success: true,
            message: "Event deleted successfully.",
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