//models/dbMethods/orderMethods.js
const ProductModel = require("../product");

const getProductName = async (productId, next) => {
  try {
    const product = await ProductModel.findById(productId);
    return product ? product.name : null;
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductName
};