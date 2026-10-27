const express = require("express");
const {
    createRequest,
    getSentRequests,
    getReceivedRequests,
    getRequest,
    updateRequestStatus
} = require("../controllers/requestController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Every request route needs a logged-in user
router.use(protect);

router.post("/", createRequest);
router.get("/sent", getSentRequests);
router.get("/received", getReceivedRequests);
router.get("/:id", getRequest);
router.patch("/:id/status", updateRequestStatus);

module.exports = router;
