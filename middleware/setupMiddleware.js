// middleware/setupMiddleware.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: "config/config.env" });

async function setupMiddleware(app) {
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const end = Date.now();
      const duration = end - start;
      console.log(`Request ${req.method} ${req.originalUrl} took ${duration}ms`);
    });
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cors());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
  });

  app.use(limiter);
}

module.exports = { setupMiddleware };