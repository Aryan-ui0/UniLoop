const mongoose = require("mongoose");

// Allowed status changes. Anything not listed here is rejected,
// so a request can never jump into a contradictory state.
const STATUS_TRANSITIONS = {
    pending: ["approved", "rejected", "cancelled"],
    approved: ["active", "cancelled"],
    active: ["completed"],
    rejected: [],
    cancelled: [],
    completed: []
};

const requestSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },
        // Student asking to borrow the item
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        // Copied from the item so owners can quickly find requests sent to them
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        startDate: {
            type: Date,
            required: [true, "Start date is required"]
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"]
        },
        message: {
            type: String,
            trim: true,
            maxlength: 300,
            default: ""
        },
        status: {
            type: String,
            enum: Object.keys(STATUS_TRANSITIONS),
            default: "pending"
        }
    },
    { timestamps: true }
);

requestSchema.pre("validate", function () {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
        this.invalidate("endDate", "End date must be on or after the start date");
    }
});

requestSchema.methods.canMoveTo = function (newStatus) {
    return STATUS_TRANSITIONS[this.status].includes(newStatus);
};

requestSchema.statics.STATUS_TRANSITIONS = STATUS_TRANSITIONS;

module.exports = mongoose.model("Request", requestSchema);
