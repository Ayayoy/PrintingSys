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

const DEFAULT_PORT = process.env.PORT || 4000;

const startServer = async () => {
  let port = DEFAULT_PORT;
  try {
    await dbConnection();
    const server = app.listen(port);
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        port++;
        server.close();
        server.listen(port);
      } else {
        console.error("Failed to start server:", error);
      }
    });
  } catch (error) {
  }
};

startServer();
