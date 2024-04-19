const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User ID is required."],
    index: true
  },
  product: {
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
    File: {
      type: String,
      //  required: [true, "File is required."]
    },
    data: [{
      field_name: {
        type: String,
        required: [true, "Field name is required."]
      },
      value: {
        type: String,
        // required: [true, "Value is required."]
      }
    }]
  },
  status: {
    type: String,
    default: 'pending'
  },
  accepted: {
    type: Boolean,
    default: false
  },
  adminMessages: [{
    type: String,
    default: ''
  }],
  invoice: { 
    type: Schema.Types.ObjectId, 
    ref: 'Invoice' 
  }
}, { timestamps: true });

const OrderModel = mongoose.model("Order", orderSchema);

module.exports = OrderModel;
