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

    // Malformed JSON body
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON in request body." });
    }

    console.error(err);
    res.status(err.statusCode || 500).json({ message: err.message || "Server error" });
}

module.exports = { notFound, errorHandler };
