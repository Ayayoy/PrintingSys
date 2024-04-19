const { body } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const Product = require("../../models/product");

const createProductValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required.")
    .isLength({ min: 2, max: 50 })
    .withMessage("Product name must be between 2 and 50 characters.")
    .custom(async (value) => {
      const existingProduct = await Product.findOne({ name: value });
      if (existingProduct) {
        throw new Error("Product name already exists.");
      }
    }),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required."),

    body("image")
    .optional(),
  
  body("requiredData")
    .isArray({ min: 1 })
    .withMessage("At least one required data field is required."),

  body("requiredData.*.name")
    .trim()
    .notEmpty()
    .withMessage("Required data name is required."),

  validatorMiddleware
];

const updateProductValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name is required.")
    .isLength({ min: 2, max: 50 })
    .withMessage("Product name must be between 2 and 50 characters.")
    .custom(async (value, { req }) => {
      const existingProduct = await Product.findOne({ name: value });
      if (existingProduct && existingProduct._id.toString() !== req.params.id) {
        throw new Error("Product name already exists.");
      }
    }),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product description is required."),

  body("image")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product image is required."),

  body("requiredData")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one required data field is required."),

  body("requiredData.*.name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Required data name is required."),

  validatorMiddleware
];

module.exports = { createProductValidator, updateProductValidator };