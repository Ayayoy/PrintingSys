// routes/setupRoutes.js
const { errorHandler, notFoundHandler } = require("../middleware/errorMiddleware");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");

function setupRoutes(app) {

  app.use("/auth", authRoutes);
  app.use("/products", productRoutes);
  app.use("/orders", orderRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
}

module.exports = { setupRoutes };
