const express = require("express");
const dotenv = require("dotenv");
const dbConnection = require("./config/database");
const { setupMiddleware } = require("./middleware/setupMiddleware");
const { setupRoutes } = require("./routes/setupRoutes");
const cors = require("cors");
dotenv.config({ path: "config/config.env" });

const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
  app.use(cors(corsOptions));


app.use(express.static('uploads'));

const startServer = async () => {
  try {
    await dbConnection();

    setupMiddleware(app);

    setupRoutes(app);

    const PORT = process.env.PORT || 4000;

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
