const express = require("express");
const { getNotifications, getLastThreeNotifications } = require("../controllers/NotificationController");
const cacheMiddleware = require('../middleware/cacheMiddleware');
const router = express.Router();

router.get("/:userId", getNotifications);
router.get("/getLastThree/:userId", getLastThreeNotifications);

module.exports = router;
