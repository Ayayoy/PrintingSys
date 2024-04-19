const { body } = require("express-validator");
const validatorMiddleware = require("../../middleware/validatorMiddleware");
const Product = require("../../models/product");

const createOrderValidator = [
  body('user_id').notEmpty().withMessage('User ID is required.'),
  body('product.product_id').notEmpty().withMessage('Product ID is required.'),
  body('product.quantity').notEmpty().withMessage('Quantity is required.').isInt({ min: 1 }).withMessage('Quantity must be at least 1.'),
  body('product.File').optional(),
  body('product.data'),
  body('product.data.*.field_name').notEmpty().withMessage('Field name is required for each element in product data.'),
  body('product.data.*.value').custom(async (value, { req }) => {
    const field_name = req.body.product.data.find(item => item.value === value)?.field_name;
    const productId = req.body.product?.product_id;
    if (!productId) {
      throw new Error('Product ID is required');
    }
    const product = await Product.findById(productId).exec();
    if (!product) {
      throw new Error('Product not found');
    }
    const field = product.requiredData.find(field => field.name === field_name);
    if (!field) {
      throw new Error(`Field "${field_name}" is not found in product's requiredData`);
    }
    if (field.hasChoices) {
      if (!field.required && !value) {
        return true;
      }
      if (field.hasChoices && !field.choices.includes(value)) {
        throw new Error(`Value "${value}" for field "${field_name}" is not from the provided choices`);
      }
      if (field.required && !value) {
        throw new Error(`Value for field "${field_name}" is required.`);
      }
    } else {
      if (!value) {
        throw new Error(`Value for field "${field_name}" is required.`);
      }
    }
    return true;
  }),
  validatorMiddleware
];



const updateOrderValidator = [
  body('product.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1.'),
  body('product.File').optional().notEmpty().withMessage('File is required.'),
  validatorMiddleware
];

module.exports = {
  createOrderValidator,
  updateOrderValidator
};
