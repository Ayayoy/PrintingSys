// server.js
const dbConnection = require("./config/database");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { setupMiddleware } = require("./middleware/setupMiddleware");
const { setupRoutes } = require("./routes/setupRoutes");
const Chat = require("./models/chat");
const { updateChatCache } = require("./controllers/chatController");
dotenv.config({ path: "config/config.env" });

const app = express();
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

let users = {};

io.on("connection", (socket) => {
  console.log("A user connected with ID:", socket.id);

  socket.on("register", (userId) => {
    users[userId] = socket.id;
    console.log("User registered with ID:", userId);
  });

  socket.on("message", async (message) => {
    try {
      const chatMessage = new Chat({
        sender: message.senderId,
        receiver: message.receiverId,
        content: message.content,
      });

      await chatMessage.save();
      await updateChatCache(message);

      const receiverSocketId = users[message.receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message", message);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected with ID:", socket.id);
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }
  });
});

const startServer = async () => {
  try {
    await dbConnection();
    setupMiddleware(app);
    setupRoutes(app);
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
