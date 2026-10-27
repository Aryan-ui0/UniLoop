// Unknown routes
function notFound(req, res) {
    res.status(404).json({ message: "Route not found: " + req.originalUrl });
}

// One place that turns errors into clean JSON responses.
// Express 5 sends errors thrown in async handlers here automatically.
function errorHandler(err, req, res, next) {
    // Mongoose schema validation (missing fields, too long, bad enum...)
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map(function (e) {
            return e.message;
        });
        return res.status(400).json({ message: messages.join(", ") });
    }

    // Duplicate unique field, e.g. an email that is already registered
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ message: "That " + field + " is already in use." });
    }

    // Malformed MongoDB id in the URL
    if (err.name === "CastError") {
        return res.status(400).json({ message: "Invalid id." });
    }

    // Upload problems reported by Multer (file too big, wrong field name...)
    if (err.name === "MulterError") {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? "Image must be 2 MB or smaller."
            : "Upload error: " + err.message;
        return res.status(400).json({ message: message });
    }

    // Malformed JSON body
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON in request body." });
    }

    const status = err.statusCode || 500;
    if (status >= 500) console.error(err); // only log real server bugs
    res.status(status).json({ message: err.message || "Server error" });
}

module.exports = { notFound, errorHandler };
