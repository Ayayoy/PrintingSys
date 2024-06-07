const Notification = require("../models/notification");
const { getAsync, setAsync, deleteAsync } = require('../utils/redisClient');

let users = {};

const invalidateNotificationCache = async (userId) => {
    await deleteAsync(`getNotifications:${userId}`);
    await deleteAsync(`getLastThreeNotifications:${userId}`);
};

const updateNotificationCache = async (userId) => {
    const notifications = await Notification.find({ user_id: userId }).sort({ createdAt: -1 }).exec();
    await setAsync(`getNotifications:${userId}`, JSON.stringify(notifications), 3600);

    const lastThreeNotifications = await Notification.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .exec();
    await setAsync(`getLastThreeNotifications:${userId}`, JSON.stringify(lastThreeNotifications), 3600);
};

const createNotification = async (userId, title, message) => {
    try {
        const notification = new Notification({
            user_id: userId,
            title,
            message
        });
        await notification.save();

        const userSocketId = users[userId];
        if (userSocketId) {
            io.to(userSocketId).emit('notification', { title, message });
        }

        await invalidateNotificationCache(userId);
        await updateNotificationCache(userId);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

const getNotifications = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const key = `getNotifications:${userId}`;
        const cachedNotifications = await getAsync(key);

        if (cachedNotifications) {
            return res.status(200).json({ message: 'Notifications fetched successfully', data: JSON.parse(cachedNotifications) });
        }

        const notifications = await Notification.find({ user_id: userId }).sort({ createdAt: -1 }).exec();
        if (!notifications || notifications.length === 0) {
            return res.status(200).json({ message: 'No notifications found.' });
        }

        await setAsync(key, JSON.stringify(notifications), 3600);
        res.status(200).json({ message: 'Notifications fetched successfully', data: notifications });
    } catch (error) {
        next(error);
    }
};

const getLastThreeNotifications = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const key = `getLastThreeNotifications:${userId}`;
        const cachedNotifications = await getAsync(key);

        if (cachedNotifications) {
            return res.status(200).json({ message: 'Notifications fetched successfully', data: JSON.parse(cachedNotifications) });
        }

        const notifications = await Notification.find({ user_id: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .exec();

        if (!notifications || notifications.length === 0) {
            return res.status(200).json({ message: 'No notifications found.' });
        }

        await setAsync(key, JSON.stringify(notifications), 3600);
        res.status(200).json({ message: 'Notifications fetched successfully', data: notifications });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createNotification,
    getNotifications,
    getLastThreeNotifications
};
