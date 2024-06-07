// controllers/chatController.js
const Chat = require("../models/chat");
const UserModel = require("../models/user");
const mongoose = require('mongoose');
const { getAsync, setAsync, deleteAsync } = require('../utils/redisClient');

const searchUser = async (req, res, next) => {
  try {
    const query = req.params.query;
    const regexQuery = new RegExp(`\\b${query}`, "i");
    const users = await UserModel.find(
      {
        $and: [
          { role: "user" },
          { $or: [{ email: { $regex: regexQuery } }, { username: { $regex: regexQuery } }] }
        ]
      },
      "username email"
    );

    if (!users.length) {
      return res.status(404).json({ message: "No user found." });
    }

    res.status(200).json({ message: "Users fetched successfully", data: users });
  } catch (error) {
    next(error);
  }
};

const getChatByReceiverOrSenderID = async (req, res, next) => {
  try {
    const { userID1, userID2 } = req.body;
    const cacheKey = `chaty:${userID1}:${userID2}`;

    let chat = await getAsync(cacheKey);

    if (!chat) {
      chat = await Chat.find({
        $or: [
          { sender: userID1, receiver: userID2 },
          { sender: userID2, receiver: userID1 }
        ]
      }, 'sender receiver content createdAt').sort({ createdAt: 1 });

      await setAsync(cacheKey, JSON.stringify(chat), 3600); // Cache for 1 hour
    } else {
      chat = JSON.parse(chat);
    }

    res.status(200).json({ message: "Chat fetched successfully", data: chat });
  } catch (error) {
    next(error);
  }
};

const getUniqueChatUsers = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const uniqueUsers = await Chat.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", new mongoose.Types.ObjectId(userId)] }, "$receiver", "$sender"]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    const uniqueUserIds = uniqueUsers.map(user => user._id);
    const users = await UserModel.find({ _id: { $in: uniqueUserIds } }, "username email");

    const filteredUsers = users.filter(user => user._id.toString() !== userId);

    const result = filteredUsers.map(user => {
      const lastMessage = uniqueUsers.find(u => u._id.toString() === user._id.toString()).lastMessage;
      let senderId;
      if (lastMessage.sender.toString() === userId) {
        senderId = userId;
      } else {
        senderId = lastMessage.sender.toString();
      }
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        lastMessage: lastMessage.content,
        senderId: senderId,
        timestamp: lastMessage.createdAt
      };
    });

    res.status(200).json({ message: "Unique chat users fetched successfully", data: result });
  } catch (error) {
    next(error);
  }
};

const updateChatCache = async (message) => {
  const { senderId, receiverId, content } = message;
  const chatKey1 = `chaty:${senderId}:${receiverId}`;
  const chatKey2 = `chaty:${receiverId}:${senderId}`;

  let chat1 = await getAsync(chatKey1);
  let chat2 = await getAsync(chatKey2);

  const newMessage = {
    sender: senderId,
    receiver: receiverId,
    content: content,
    createdAt: new Date()
  };

  if (chat1) {
    chat1 = JSON.parse(chat1);
    chat1.push(newMessage);
    await setAsync(chatKey1, JSON.stringify(chat1), 3600);
  }

  if (chat2) {
    chat2 = JSON.parse(chat2);
    chat2.push(newMessage);
    await setAsync(chatKey2, JSON.stringify(chat2), 3600);
  }
};

module.exports = {
  searchUser,
  getChatByReceiverOrSenderID,
  getUniqueChatUsers,
  updateChatCache
};
