const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/db");
const express = require("express");
const cors = require("cors");

// Load environment variables before using process.env
dotenv.config();

app.use(cors());
app.use(express.json());

/*
 * Establish the database connection before accepting requests.
 * If MongoDB is unavailable, connectDB() will stop the process,
 * preventing the API from running in an unusable state.
 */


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
};

startServer();

