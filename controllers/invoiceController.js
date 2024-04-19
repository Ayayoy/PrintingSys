//controllers/invoiceController
const Invoice = require('../models/invoice');

const generateInvoice = async (orderId, totalCost, paymentCode, next) => { 
  try {
    const invoice = new Invoice({
      order: orderId,
      totalCost, 
      paymentCode
    });

    await invoice.save();

    return invoice;
  } catch (error) {
    next(error);
  }
};

const getInvoiceByOrderId = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const invoice = await Invoice.findOne({ order: orderId }).exec();

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    next(error);
  }
};

module.exports = { generateInvoice, getInvoiceByOrderId };
