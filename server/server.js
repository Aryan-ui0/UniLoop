require("dotenv").config({ quiet: true });

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("Missing MONGO_URI or JWT_SECRET. Copy server/.env.example to server/.env and fill it in.");
    process.exit(1);
}

connectDB(process.env.MONGO_URI).then(function () {
    app.listen(PORT, function () {
        console.log("UniLoop API running on http://localhost:" + PORT);
    });
});
