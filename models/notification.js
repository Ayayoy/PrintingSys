const mongoose = require("mongoose");
const moment = require("moment");

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.virtual('timeAgo').get(function() {
  return moment(this.createdAt).fromNow();
});

notificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.__v;
    delete ret.id;
    return ret;
  }
});

notificationSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.__v;
    delete ret.id;
    return ret;
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
