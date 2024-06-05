const { errorHandler, notFoundHandler } = require("../middleware/errorMiddleware");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");
const chatRoutes = require("./chatRoutes");
const notificationRoutes = require("./notificationRoutes");

async function setupRoutes(app) {
  app.use("/auth", authRoutes);

  app.use("/products", productRoutes);

  app.use("/orders", orderRoutes);

  app.use("/chats", chatRoutes);
  
  app.use("/notifications", notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
}

module.exports = { setupRoutes };