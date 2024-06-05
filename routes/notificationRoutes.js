const express = require("express");
const { getNotifications } = require("../controllers/NotificationController");
const router = express.Router();

router.get("/:userId", getNotifications);

module.exports = router;
