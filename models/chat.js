// models/chat.js
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;