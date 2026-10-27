const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Allow the React dev server to call this API
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

// Parse JSON request bodies into req.body
app.use(express.json());

app.get("/api/health", function (req, res) {
    res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

// These two must stay last
app.use(notFound);
app.use(errorHandler);

module.exports = app;
