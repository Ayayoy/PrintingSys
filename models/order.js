const mongoose = require("mongoose");
const { getProductName } = require("./dbMethods/orderMethods");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  product: {
  
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, "Product ID is required."]
    },
    product_name:{
      type: String
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required."],
      min: [1, "Quantity must be at least 1."]
    },
    file: {
      type: String,
      //  required: [true, "File is required."]
    },
    notes: {
      type: String,
      default: ''
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
    type: Number,
    // enum: [-1, 0, 1, 2, 3],
    default: -1
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

orderSchema.pre('save', async function(next) {
  try {
    
    this.product.product_name = await getProductName(this.product.product_id);
      
    next();
  } catch (error) {
    next(error);
  }
});

const OrderModel = mongoose.model("Order", orderSchema);

module.exports = OrderModel;
