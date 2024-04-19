//models//invoice
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' , index: true },
  totalCost: { type: Number },
  paymentCode: { type: String },
  paid: { type: Boolean, default: false }
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
