const mongoose = require("mongoose");

// Connect to MongoDB (Atlas in our case). Stops the server if it fails,
// because the API is useless without a database.
async function connectDB(uri) {
    try {
        const conn = await mongoose.connect(uri);
        console.log("MongoDB connected: " + conn.connection.host);
    } catch (error) {
        console.error("MongoDB connection failed: " + error.message);
        process.exit(1);
    }
}

module.exports = connectDB;
