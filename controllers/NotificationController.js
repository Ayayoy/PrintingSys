const Notification = require("../models/notification");

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const notifications = await Notification.find({ user_id: userId }).sort({ createdAt: -1 }).exec();

    res.status(200).json({ message: 'Notifications fetched successfully', data: notifications });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications
};
