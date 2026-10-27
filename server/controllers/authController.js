const jwt = require("jsonwebtoken");
const User = require("../models/User");

function createToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });
}

// What we send back about a user (never the password)
function publicUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        hostel: user.hostel,
        role: user.role
    };
}

// POST /api/auth/register
async function register(req, res) {
    const { name, email, password, hostel } = req.body || {};

    // role is deliberately NOT read from the body, so nobody can sign up as admin
    const user = await User.create({ name, email, password, hostel });

    res.status(201).json({ token: createToken(user._id), user: publicUser(user) });
}

// POST /api/auth/login
async function login(req, res) {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ message: "Please enter email and password." });
    }

    // password has select:false, so ask for it explicitly here
    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");

    // Same message for both cases so attackers can't tell which emails exist
    if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({ token: createToken(user._id), user: publicUser(user) });
}

// GET /api/auth/me  (protected)
async function getMe(req, res) {
    res.json({ user: publicUser(req.user) });
}

module.exports = { register, login, getMe };
