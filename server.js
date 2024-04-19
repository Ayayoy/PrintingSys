// server.js
const express = require("express");
const dotenv = require("dotenv");
const dbConnection = require("./config/database");
const { setupMiddleware } = require("./middleware/setupMiddleware");
const { setupRoutes } = require("./routes/setupRoutes");
dotenv.config({ path: "config/config.env" });

const app = express();

app.use('/uploads', express.static('uploads'));

setupMiddleware(app);
setupRoutes(app);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await dbConnection();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
