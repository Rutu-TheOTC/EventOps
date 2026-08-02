const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
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

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to EventOps API 🚀",
    });
});

module.exports = app;