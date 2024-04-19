//controllers/OrderController
const OrderModel = require("../models/order");
const {
  sendEmailForOrderAccept,
  sendEmailForOrderDeny,
  sendEmailForOrderUpdateOrderStatus,
  sendAdminMessageEmail,
  getUserEmailById
} = require("../utils/email");
const { generateInvoice } = require('./invoiceController');


const getAllOrders = async (req, res, next) => {
  try {
    const orders = await OrderModel.find({ accepted: false }).select('user_id product status createdAt updatedAt').exec();
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found.' });
    }
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

const getAllAcceptedOrders = async (req, res, next) => {
  try {
    const orders = await OrderModel.find({ accepted: true }).select('user_id product status createdAt updatedAt').exec();
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No accepted orders found.' });
    }
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.params.user_id;
    const orders = await OrderModel.find({ user_id: userId }).select('product status createdAt updatedAt').exec();
    
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user.' });
    }
    
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await OrderModel.findById(orderId)
      .select('user_id product status adminMessage createdAt updatedAt')
      .populate('product', 'name')
      .exec();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const adminMessage = order.adminMessage || 'Not found';

    const orderWithAdminMessage = { ...order._doc, adminMessage };

    res.status(200).json(orderWithAdminMessage);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    let { user_id, product: { product_id, quantity, data } } = req.body;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'File is required' });
    }
    const filePath = req.file.path;

    const product = { product_id, quantity, File: filePath, data };

    const newOrder = await OrderModel.create({ user_id, product });
    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.product || !Array.isArray(order.product.data)) {
      return res.status(400).json({ error: 'Product data is missing or invalid' });
    }

    if (updateData.product && updateData.product.data && updateData.product.data.length > 0) {
      const { data } = updateData.product;
      const { index, value } = data[0] || {};
      
      if (index === undefined || index < 0 || index >= order.product.data.length) {
        return res.status(400).json({ error: 'Invalid data index' });
      }

      order.product.data[index].value = value;
    }
    
    if (req.file) {
      order.product.File = req.file.path;
    }

    if (updateData.product && updateData.product.quantity) {
      order.product.quantity = updateData.product.quantity;
    }

    const updatedOrder = await order.save();

    res.status(200).json({ message: 'Order updated successfully'});
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId).exec();
    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const acceptOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { totalCost, paymentCode } = req.body;
    
    const order = await OrderModel.findById(orderId).exec();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (!totalCost ) {
      return res.status(400).json({ error: 'Total cost is required' });
    }
    
    order.accepted = true;
        
    await order.save();

    await generateInvoice(orderId, totalCost, paymentCode);

    res.status(200).json({ message: 'Order accepted successfully' });
  } catch (error) {
    next(error);
  }
};

const denyOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId).exec();
    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const userEmail = await getUserEmailById(deletedOrder.user_id);
    await sendEmailForOrderDeny({ ...deletedOrder.toObject(), user_email: userEmail });
    return res.status(200).json({ message: 'Order denied successfully' });
  } catch (error) {
    next(error);
  }
};

const UpdateOrderStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;

    if (!newStatus) {
      return res.status(400).json({ error: 'please enter the current status' });
    }
    const order = await OrderModel.findById(orderId).exec();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    order.status = newStatus;
    await order.save();


    const userEmail = await getUserEmailById(order.user_id);
    await sendEmailForOrderUpdateOrderStatus({ ...order.toObject(), user_email: userEmail });

    res.status(200).json({ message: `The status changed successfully to "${newStatus}"` });
  } catch (error) {
    next(error);
  }
};

const sendAdminMessage = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const order = await OrderModel.findById(orderId).exec();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get user email associated with the order
    const userEmail = await getUserEmailById(order.user_id);

    // Send admin message email
    await sendAdminMessageEmail({ to: userEmail, message });

    // Update admin message in the order model
    order.adminMessage = message;
    await order.save();

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getAllAcceptedOrders,
  getOrderHistory,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  acceptOrder,
  denyOrder,
  UpdateOrderStatus,
  sendAdminMessage
};
