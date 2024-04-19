// middleware/validatorMiddleware.js
const { validationResult } = require("express-validator");

const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(error => error.msg);
    return res.status(400).json({ ValidationError: errorMsg });
  }
  next();
};

module.exports = validatorMiddleware;
