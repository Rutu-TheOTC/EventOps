const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

// Shared middleware is configured once, here.
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Welcome to EventOps API 🚀",
    });
});

// Unknown API paths receive a consistent JSON response.
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "Route not found.",
    });
});

module.exports = app;
