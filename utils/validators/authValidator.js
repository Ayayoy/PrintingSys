const { check } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const User = require("../../models/user");

exports.registerValidator = [
  check("username")
    .notEmpty().withMessage("Username required").bail()
    .trim()
    .isLength({ min: 4 }).withMessage("Username must be at least 4 characters"),

  check("email")
    .notEmpty().withMessage("Email required").bail()
    .trim()
    .isEmail().withMessage("Invalid email address")
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error("Email already in use.");
      }
    }),

  check("phoneNumber")
    .notEmpty().withMessage("Phone number required")
    .matches(/^((\+|00)20|0)?1[0-2,5]\d{8}$/).withMessage("Please enter a valid phone number"),

  check("password")
    .notEmpty().withMessage("Password required").bail()
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

  check("passwordConfirm")
    .notEmpty().withMessage("Password confirmation required").bail()
    .custom((password, { req }) => {
      if (password !== req.body.password) {
        throw new Error("Password confirmation does not match.");
      }
      return true;
    }),

  validatorMiddleware,
];

exports.loginValidator = [
  check("email")
    .notEmpty().withMessage("Email required").bail()
    .trim()
    .isEmail().withMessage("Invalid email address"),

  check("password")
    .notEmpty().withMessage("Password required").bail()
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

  validatorMiddleware,
];
