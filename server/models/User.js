const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: 50
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
        },
        // Never stored as plain text: hashed by the pre-save hook below.
        // select: false means queries leave it out unless we ask for it.
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false
        },
        hostel: {
            type: String,
            trim: true,
            default: ""
        },
        // Used for authorization: admins can moderate any listing.
        role: {
            type: String,
            enum: ["student", "admin"],
            default: "student"
        }
    },
    { timestamps: true }
);

// Hash the password whenever it is created or changed.
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare a login attempt with the stored hash.
userSchema.methods.matchPassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
