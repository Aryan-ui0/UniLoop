// Promote an existing account to admin (nobody can sign up as admin).
// Usage: npm run make-admin -- someone@example.com
require("dotenv").config({ quiet: true, path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function main() {
    const email = (process.argv[2] || "").toLowerCase();
    if (!email) {
        console.error("Usage: npm run make-admin -- <email>");
        process.exit(1);
    }

    await connectDB(process.env.MONGO_URI);
    const user = await User.findOneAndUpdate({ email: email }, { role: "admin" }, { new: true });
    console.log(user ? user.email + " is now an admin." : "No user with email " + email);
    await mongoose.disconnect();
}

main();
