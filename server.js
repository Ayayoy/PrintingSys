const express = require("express");
const dotenv = require("dotenv");
const dbConnection = require("./config/database");
const { setupMiddleware } = require("./middleware/setupMiddleware");
const { setupRoutes } = require("./routes/setupRoutes");

dotenv.config({ path: "config/config.env" });

const app = express();

app.use(express.static('uploads'));

const startServer = async () => {
  try {
    await dbConnection();

    setupMiddleware(app);

    setupRoutes(app);

    const PORT = process.env.PORT || 4000;

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    // Gracefully handle errors
    process.exit(1); // Exit with non-zero status code to indicate failure
  }
};

startServer();
