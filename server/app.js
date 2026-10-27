const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const requestRoutes = require("./routes/requestRoutes");
const { UPLOAD_DIR } = require("./middleware/upload");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Allow the React dev server to call this API
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

// Parse JSON request bodies into req.body
app.use(express.json());

app.get("/api/health", function (req, res) {
    res.json({ status: "ok" });
});

// Images saved by Multer, e.g. http://localhost:5000/uploads/123-456.jpg
app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/requests", requestRoutes);

// These two must stay last
app.use(notFound);
app.use(errorHandler);

module.exports = app;
