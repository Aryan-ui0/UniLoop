const express = require("express");
const {
    getItems,
    getItemOptions,
    getMyItems,
    getItem,
    createItem,
    updateItem,
    deleteItem
} = require("../controllers/itemController");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const router = express.Router();

// Public
router.get("/", getItems);
router.get("/meta", getItemOptions);

// Logged in (must come before "/:id" so "mine" isn't treated as an id)
router.get("/mine", protect, getMyItems);

router.get("/:id", getItem);

// upload.single("image") = Multer reads one file from the form field "image"
router.post("/", protect, upload.single("image"), createItem);
router.put("/:id", protect, upload.single("image"), updateItem);
router.delete("/:id", protect, deleteItem);

module.exports = router;
