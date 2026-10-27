const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
    {
        // The student who listed the item. Used for ownership checks.
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: [true, "Item name is required"],
            trim: true,
            maxlength: 60
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: 500
        },
        category: {
            type: String,
            enum: ["Sports", "Electronics", "Appliances", "Books", "Stationery", "Clothing", "Other"],
            default: "Other"
        },
        condition: {
            type: String,
            enum: ["New", "Good", "Fair", "Worn"],
            default: "Good"
        },
        // Rupees per day. 0 means free to borrow.
        pricePerDay: {
            type: Number,
            required: [true, "Price per day is required"],
            min: [0, "Price cannot be negative"]
        },
        // Path of the image saved by Multer, e.g. "/uploads/170000-racket.jpg"
        imageUrl: {
            type: String,
            default: ""
        },
        pickupLocation: {
            type: String,
            trim: true,
            default: ""
        },
        availability: {
            type: String,
            enum: ["available", "reserved", "unavailable"],
            default: "available"
        }
    },
    { timestamps: true }
);

itemSchema.statics.CATEGORIES = itemSchema.path("category").enumValues;
itemSchema.statics.CONDITIONS = itemSchema.path("condition").enumValues;

module.exports = mongoose.model("Item", itemSchema);
