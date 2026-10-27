const mongoose = require("mongoose");

// If the connection string doesn't name a database (nothing after ".net/"),
// MongoDB silently uses one called "test". Default to "uniloop" instead,
// so the server and the scripts always share the same database.
function connectOptions(uri) {
    try {
        const dbInUri = new URL(uri).pathname.replace("/", "");
        return dbInUri ? {} : { dbName: "uniloop" };
    } catch {
        return {};
    }
}

// Connect to MongoDB (Atlas in our case). Stops the server if it fails,
// because the API is useless without a database.
async function connectDB(uri) {
    try {
        const conn = await mongoose.connect(uri, connectOptions(uri));
        console.log("MongoDB connected: " + conn.connection.host + " (database: " + conn.connection.name + ")");
    } catch (error) {
        console.error("MongoDB connection failed: " + error.message);
        process.exit(1);
    }
}

module.exports = connectDB;
