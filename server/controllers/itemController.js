const Item = require("../models/Item");
const Request = require("../models/Request");
const { removeUpload } = require("../middleware/upload");
const { isOwnerOrAdmin } = require("../utils/permissions");

// Only these fields may be set by the user. owner, imageUrl etc. are
// controlled by the server, so they can't be faked in the request body.
const EDITABLE_FIELDS = ["name", "description", "category", "condition", "pricePerDay", "pickupLocation", "availability"];

const OWNER_FIELDS = "name hostel";

function pickFields(body) {
    const data = {};
    EDITABLE_FIELDS.forEach(function (field) {
        if (body[field] !== undefined) data[field] = body[field];
    });
    return data;
}

// Turn user text into a safe "contains" search (special regex characters escaped)
function containsRegex(text) {
    return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

const SORTS = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { pricePerDay: 1, createdAt: -1 },
    price_desc: { pricePerDay: -1, createdAt: -1 }
};

// GET /api/items?search=&category=&availability=&maxPrice=&hostel=&sort=
// Public: anyone can browse listings.
async function getItems(req, res) {
    const { search, category, availability, maxPrice, sort } = req.query;
    const filter = {};

    if (search) {
        const regex = containsRegex(String(search));
        filter.$or = [{ name: regex }, { description: regex }];
    }
    if (category) filter.category = category;
    if (availability) filter.availability = availability;
    if (maxPrice !== undefined && maxPrice !== "" && !isNaN(maxPrice)) {
        filter.pricePerDay = { $lte: Number(maxPrice) };
    }

    let items = await Item.find(filter)
        .populate("owner", OWNER_FIELDS)
        .sort(SORTS[sort] || SORTS.newest);

    // hostel lives on the owner, so filter after populating
    if (req.query.hostel) {
        const hostelRegex = containsRegex(String(req.query.hostel));
        items = items.filter(function (item) {
            return item.owner && hostelRegex.test(item.owner.hostel);
        });
    }

    res.json({ count: items.length, items: items });
}

// GET /api/items/meta  - lists for dropdowns in the React forms
function getItemOptions(req, res) {
    res.json({ categories: Item.CATEGORIES, conditions: Item.CONDITIONS });
}

// GET /api/items/mine  (protected)
async function getMyItems(req, res) {
    const items = await Item.find({ owner: req.user._id }).sort(SORTS.newest);
    res.json({ count: items.length, items: items });
}

// GET /api/items/:id
async function getItem(req, res) {
    const item = await Item.findById(req.params.id).populate("owner", OWNER_FIELDS);
    if (!item) return res.status(404).json({ message: "Item not found." });
    res.json({ item: item });
}

// POST /api/items  (protected, multipart/form-data with optional "image" file)
async function createItem(req, res) {
    const data = pickFields(req.body || {});
    data.owner = req.user._id;
    if (req.file) data.imageUrl = "/uploads/" + req.file.filename;

    try {
        const item = await Item.create(data);
        res.status(201).json({ item: item });
    } catch (error) {
        // Validation failed: don't leave an orphaned image on disk
        if (req.file) removeUpload(data.imageUrl);
        throw error;
    }
}

// PUT /api/items/:id  (protected, owner or admin)
async function updateItem(req, res) {
    const newImageUrl = req.file ? "/uploads/" + req.file.filename : null;

    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            removeUpload(newImageUrl);
            return res.status(404).json({ message: "Item not found." });
        }

        // AUTHORIZATION: only the person who listed it (or an admin)
        if (!isOwnerOrAdmin(req.user, item.owner)) {
            removeUpload(newImageUrl);
            return res.status(403).json({ message: "You can only edit your own items." });
        }

        const oldImageUrl = item.imageUrl;
        item.set(pickFields(req.body || {}));
        if (newImageUrl) item.imageUrl = newImageUrl;
        if (req.body && req.body.removeImage === "true" && !newImageUrl) item.imageUrl = "";

        await item.save();

        if (oldImageUrl && oldImageUrl !== item.imageUrl) removeUpload(oldImageUrl);

        res.json({ item: item });
    } catch (error) {
        removeUpload(newImageUrl);
        throw error;
    }
}

// DELETE /api/items/:id  (protected, owner or admin)
async function deleteItem(req, res) {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found." });

    if (!isOwnerOrAdmin(req.user, item.owner)) {
        return res.status(403).json({ message: "You can only delete your own items." });
    }

    // Someone currently has it: it must be returned first
    const activeRental = await Request.exists({ item: item._id, status: "active" });
    if (activeRental) {
        return res.status(409).json({ message: "This item is currently borrowed. Mark the rental completed before deleting it." });
    }

    // Open requests for a deleted item can never happen, so cancel them
    await Request.updateMany(
        { item: item._id, status: { $in: ["pending", "approved"] } },
        { status: "cancelled" }
    );

    await item.deleteOne();
    removeUpload(item.imageUrl);

    res.json({ message: "Item deleted." });
}

module.exports = { getItems, getItemOptions, getMyItems, getItem, createItem, updateItem, deleteItem };
