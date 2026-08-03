const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const { model } = require("mongoose");

const app = express();

//Allow requests from our React frontend.

app.use(cors());

//Parse incoming JSON request bodies.
app.use(express.json());

/*
---------
API Routes
---------
*/
app.use("/api/auth", authRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/bookings", bookingRoutes);


app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to EventOps API 🚀",
    });
});

module.exports = app;