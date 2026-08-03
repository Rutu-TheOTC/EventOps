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
        const events = await Event.find().populate("organizer","fullName email");

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

        await Event.deleteOne();

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
    updateEvent,
    deleteEvent,
};