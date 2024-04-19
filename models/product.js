//models/product.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      minlength: [2, "Product name must be at least 2 characters long."],
      maxlength: [50, "Product name cannot exceed 50 characters."],
      index: { unique: true, dropDups: true },
    },
    description: {
      type: String,
      required: [true, "Product description is required."],
    },
    image: {
      type: String,
      required: [true, "Product image is required."],
    },
    requiredData: [
      {
        name: {
          type: String,
          required: [true, "Required data name is required."],
        },
        required: {
          type: Boolean,
          default: false,
        },
        hasChoices: {
          type: Boolean,
          default: false,
        },
        choices: {
          type: [String],
        },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

productSchema.plugin(mongoosePaginate);

const ProductModel = mongoose.model("Product", productSchema);

module.exports = ProductModel;
