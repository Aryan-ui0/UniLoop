const jwt = require("jsonwebtoken");
const User = require("../models/User");

// AUTHENTICATION: who are you?
// Reads "Authorization: Bearer <token>", verifies it, and puts the
// logged-in user on req.user for the route handlers that follow.
async function protect(req, res, next) {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not logged in. Please log in first." });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "This account no longer exists." });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }
}

// AUTHORIZATION: are you allowed to do this?
// Use after protect, e.g. router.delete("/:id", protect, authorize("admin"), handler)
function authorize(...roles) {
    return function (req, res, next) {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "You do not have permission to do this." });
        }
        next();
    };
}

module.exports = { protect, authorize };
