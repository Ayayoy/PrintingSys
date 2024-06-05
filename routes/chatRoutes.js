const express = require("express");
const { 
  searchUser, 
  getChatByReceiverOrSenderID, 
  userSendMessageToAdmins,
  getUniqueChatUsers,
} = require("../controllers/chatController");

const router = express.Router();

router.get("/searchUser/:query", searchUser);
router.post("/getChatByReceiverOrSenderID", getChatByReceiverOrSenderID);
router.post("/user/sendMessageToAdmins", userSendMessageToAdmins);
router.get("/getUniqueChatUsers/:userId", getUniqueChatUsers);

module.exports = router;

// router.get("/messages/:userId/:adminId", getMessagesBetweenUserAndAdmin);
// router.get("/getChatsForSpecificUser/:userID", getChatsForSpecificUser);
// router.get("/admin/:adminId", getAllChatsForAdmin);