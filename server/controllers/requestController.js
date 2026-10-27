const Item = require("../models/Item");
const Request = require("../models/Request");
const { isOwner, isOwnerOrAdmin } = require("../utils/permissions");

// Who is allowed to move a request into each status.
//   owner     = the student who listed the item
//   requester = the student who asked to borrow it
const ALLOWED_BY = {
    approved: "owner",   // owner accepts
    rejected: "owner",   // owner declines
    active: "owner",     // owner handed the item over
    completed: "owner",  // owner got the item back
    cancelled: "requester"
};

// Statuses that hold the item for those dates
const BOOKED = ["approved", "active"];

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// Confirmed bookings of this item whose dates overlap start..end
function findOverlap(itemId, start, end, excludeId) {
    const query = {
        item: itemId,
        status: { $in: BOOKED },
        startDate: { $lte: end },
        endDate: { $gte: start }
    };
    if (excludeId) query._id = { $ne: excludeId };
    return Request.findOne(query);
}

// Keep the item's availability in step with its bookings.
// "unavailable" is the owner's manual switch, so we leave it alone.
async function syncAvailability(itemId) {
    const item = await Item.findById(itemId);
    if (!item || item.availability === "unavailable") return;

    const hasBooking = await Request.exists({ item: itemId, status: { $in: BOOKED } });
    item.availability = hasBooking ? "reserved" : "available";
    await item.save();
}

function populateRequest(query) {
    return query
        .populate("item", "name imageUrl pricePerDay availability")
        .populate("requester", "name email hostel")
        .populate("owner", "name email hostel");
}

// POST /api/requests  { itemId, startDate, endDate, message }  (protected)
async function createRequest(req, res) {
    const { itemId, startDate, endDate, message } = req.body || {};

    if (!itemId || !startDate || !endDate) {
        return res.status(400).json({ message: "Item, start date and end date are required." });
    }

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found." });

    if (isOwner(req.user, item.owner)) {
        return res.status(400).json({ message: "You cannot request your own item." });
    }
    if (item.availability === "unavailable") {
        return res.status(409).json({ message: "This item is not available for borrowing right now." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ message: "Please enter valid dates." });
    }
    if (start < startOfToday()) {
        return res.status(400).json({ message: "Start date cannot be in the past." });
    }

    const clash = await findOverlap(item._id, start, end);
    if (clash) {
        return res.status(409).json({ message: "This item is already booked for some of those dates." });
    }

    const duplicate = await Request.exists({ item: item._id, requester: req.user._id, status: "pending" });
    if (duplicate) {
        return res.status(409).json({ message: "You already have a pending request for this item." });
    }

    const request = await Request.create({
        item: item._id,
        requester: req.user._id,
        owner: item.owner,
        startDate: start,
        endDate: end,
        message: message
    });

    res.status(201).json({ request: await populateRequest(Request.findById(request._id)) });
}

// GET /api/requests/sent?status=   - requests I made (protected)
async function getSentRequests(req, res) {
    const filter = { requester: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const requests = await populateRequest(Request.find(filter)).sort({ createdAt: -1 });
    res.json({ count: requests.length, requests: requests });
}

// GET /api/requests/received?status=   - requests for my items (protected)
async function getReceivedRequests(req, res) {
    const filter = { owner: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const requests = await populateRequest(Request.find(filter)).sort({ createdAt: -1 });
    res.json({ count: requests.length, requests: requests });
}

// GET /api/requests/:id   - only the two people involved, or an admin
async function getRequest(req, res) {
    const request = await populateRequest(Request.findById(req.params.id));
    if (!request) return res.status(404).json({ message: "Request not found." });

    if (!isOwnerOrAdmin(req.user, request.owner) && !isOwner(req.user, request.requester)) {
        return res.status(403).json({ message: "You cannot view this request." });
    }

    res.json({ request: request });
}

// PATCH /api/requests/:id/status  { status }  (protected)
async function updateRequestStatus(req, res) {
    const newStatus = (req.body || {}).status;

    if (!ALLOWED_BY[newStatus]) {
        return res.status(400).json({ message: "Status must be one of: " + Object.keys(ALLOWED_BY).join(", ") + "." });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });

    // AUTHORIZATION: the right person for this action
    const actorId = ALLOWED_BY[newStatus] === "owner" ? request.owner : request.requester;
    if (!isOwner(req.user, actorId)) {
        const who = ALLOWED_BY[newStatus] === "owner" ? "item owner" : "student who made the request";
        return res.status(403).json({ message: "Only the " + who + " can mark this request " + newStatus + "." });
    }

    // Workflow rule from the Request model, e.g. rejected -> active is not allowed
    if (!request.canMoveTo(newStatus)) {
        return res.status(409).json({ message: "Cannot change a " + request.status + " request to " + newStatus + "." });
    }

    if (newStatus === "approved") {
        const clash = await findOverlap(request.item, request.startDate, request.endDate, request._id);
        if (clash) {
            return res.status(409).json({ message: "Another booking already covers some of these dates." });
        }
    }

    request.status = newStatus;
    await request.save();

    // Once approved, other pending requests for the same dates can't happen
    if (newStatus === "approved") {
        await Request.updateMany(
            {
                _id: { $ne: request._id },
                item: request.item,
                status: "pending",
                startDate: { $lte: request.endDate },
                endDate: { $gte: request.startDate }
            },
            { status: "rejected" }
        );
    }

    await syncAvailability(request.item);

    res.json({ request: await populateRequest(Request.findById(request._id)) });
}

module.exports = { createRequest, getSentRequests, getReceivedRequests, getRequest, updateRequestStatus };
