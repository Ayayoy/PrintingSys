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