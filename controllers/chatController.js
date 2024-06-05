const Chat = require("../models/chat");
const UserModel = require("../models/user");
const mongoose = require('mongoose');

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
  
      const chat = await Chat.find({
        $or: [
          { sender: userID1, receiver: userID2 },
          { sender: userID2, receiver: userID1 }
        ]
      }, 'sender receiver content timestamp')
      .sort({ timestamp: 1 });
  
      res.status(200).json({ message: "Chat fetched successfully", data: chat });
    } catch (error) {
      next(error);
    }
};
   
const userSendMessageToAdmins = async (req, res, next) => {
  try {
    const { userId, content } = req.body;
    const admins = await UserModel.find({ role: 'admin' });

    const chatMessages = admins.map(admin => ({
      sender: userId,
      receiver: admin._id,
      content,
    }));

    await Chat.insertMany(chatMessages);
    
    res.status(200).json({ message: "Message sent to all admins successfully" });
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
        $sort: { timestamp: -1 }
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
        timestamp: lastMessage.timestamp
      };
    });

    res.status(200).json({ message: "Unique chat users fetched successfully", data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchUser,
  getChatByReceiverOrSenderID,
  userSendMessageToAdmins,
  getUniqueChatUsers
};

//   // Get chats for specific user (admin or user)
//   const getChatsForSpecificUser = async (req, res, next) => {
//       try {
//           const userID = req.params.userID;
  
  
//           //implement
          
//           res.status(200).json({ message: "Chats fetched successfully", data: uniqueChats });
//       } catch (error) {
//           next(error);
//       }
//   };
  
  
//   // Get all chats for an admin
//   const getAllChatsForAdmin = async (req, res, next) => {
//     try {
//       const adminId = req.params.adminId;
  
//       const chats = await Chat.find({ receiver: adminId })
//         .populate('sender', 'username email')
//         .populate('receiver', 'username email')
//         .sort({ timestamp: 1 });

//       res.status(200).json({ message: "Chats fetched successfully", data: chats });
//     } catch (error) {
//       next(error);
//     }
//   };
    // // Fetch messages between user and admin
    // const getMessagesBetweenUserAndAdmin = async (req, res, next) => {
    //     try {
    //     const { userId, adminId } = req.params;
    
    //     const chats = await Chat.find({
    //       $or: [
    //         { sender: userId, receiver: adminId },
    //         { sender: adminId, receiver: userId }
    //       ]
    //     })
    //     .populate('sender', 'username email')
    //     .populate('receiver', 'username email')
    //     .sort({ timestamp: 1 });
        
    //     res.status(200).json({ message: "Messages fetched successfully", data: chats });
    // } catch (error) {
    //     next(error);
    //   }
    // };