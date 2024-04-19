const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User ID is required."]
  },
  products: [{
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, "Product ID is required."]
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required."],
      min: [1, "Quantity must be at least 1."]
    },
    data: {
      type: Map,
      of: String,
      required: [true, "Product data is required."]
    }
  }]
}, { timestamps: true });

const CartModel = mongoose.model("Cart", cartSchema);

module.exports = CartModel;
