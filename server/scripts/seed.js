// Adds demo students and items so the app isn't empty during a demo.
// Safe to run more than once: it only creates what is missing and
// never deletes anything.
// Usage: npm run seed
require("dotenv").config({ quiet: true, path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Item = require("../models/Item");

const DEMO_PASSWORD = "password123";

const DEMO_USERS = [
    {
        name: "Aarav Sharma",
        email: "aarav@uniloop.test",
        hostel: "Block A",
        items: [
            { name: "Badminton Racket", description: "Yonex racket in good condition, comes with a cover.", category: "Sports", condition: "Good", pricePerDay: 30, pickupLocation: "Block A, Room 112" },
            { name: "Scientific Calculator", description: "Casio fx-991EX, perfect for exams.", category: "Stationery", condition: "Good", pricePerDay: 0, pickupLocation: "Block A, Room 112" }
        ]
    },
    {
        name: "Priya Nair",
        email: "priya@uniloop.test",
        hostel: "Block B",
        items: [
            { name: "Electric Iron", description: "Philips dry iron, works perfectly.", category: "Appliances", condition: "Good", pricePerDay: 20, pickupLocation: "Block B common room" },
            { name: "Wireless Mouse", description: "Logitech USB wireless mouse, batteries included.", category: "Electronics", condition: "New", pricePerDay: 15, pickupLocation: "Block B, Room 7" }
        ]
    },
    {
        name: "Rohan Mehta",
        email: "rohan@uniloop.test",
        hostel: "Block C",
        items: [
            { name: "Data Structures Textbook", description: "Cormen (CLRS), 3rd edition. A few highlighted pages.", category: "Books", condition: "Fair", pricePerDay: 10, pickupLocation: "Library entrance" },
            { name: "Formal Blazer", description: "Navy blazer, size M. Great for interviews and fests.", category: "Clothing", condition: "Good", pricePerDay: 50, pickupLocation: "Block C, Room 301" }
        ]
    }
];

async function main() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is missing. Fill in server/.env first.");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    for (const demo of DEMO_USERS) {
        let user = await User.findOne({ email: demo.email });
        if (!user) {
            user = await User.create({ name: demo.name, email: demo.email, hostel: demo.hostel, password: DEMO_PASSWORD });
            console.log("Created user " + demo.email);
        }

        for (const itemData of demo.items) {
            const exists = await Item.exists({ owner: user._id, name: itemData.name });
            if (!exists) {
                await Item.create({ ...itemData, owner: user._id });
                console.log("  + " + itemData.name);
            }
        }
    }

    console.log("\nDone. Demo logins use password: " + DEMO_PASSWORD);
    await mongoose.disconnect();
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
