// Load environment variables before importing modules that use process.env.
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from the backend environment.");
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from the backend environment.");
        }

        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 EventOps server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
