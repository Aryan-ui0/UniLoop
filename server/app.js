const fs = require("fs");
const path = require("path");
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

// In production, serve the built React app (client/dist) from this same
// server. Any non-API URL returns index.html so React Router can handle it.
const CLIENT_DIST = path.join(__dirname, "..", "client", "dist");
if (process.env.NODE_ENV === "production" && fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get(/^\/(?!api\/|uploads\/).*/, function (req, res) {
        res.sendFile(path.join(CLIENT_DIST, "index.html"));
    });
}

// These two must stay last
app.use(notFound);
app.use(errorHandler);

module.exports = app;
