const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif"
};

// Where and under what name Multer saves each uploaded file.
// We build the name ourselves (time + random number + safe extension)
// instead of trusting the name the user's computer sent.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + ALLOWED_TYPES[file.mimetype]);
    }
});

// Only accept images
function fileFilter(req, file, cb) {
    if (ALLOWED_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        const error = new Error("Only JPG, PNG, WEBP or GIF images are allowed.");
        error.statusCode = 400;
        cb(error);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

// Delete a previously uploaded image, e.g. when an item is deleted
// or its picture is replaced. imageUrl looks like "/uploads/123-456.jpg".
function removeUpload(imageUrl) {
    if (!imageUrl) return;
    const filePath = path.join(UPLOAD_DIR, path.basename(imageUrl));
    fs.unlink(filePath, function () {}); // ignore "file not found"
}

module.exports = { upload, removeUpload, UPLOAD_DIR };
