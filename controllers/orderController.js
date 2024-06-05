//controllers/OrderController
const OrderModel = require("../models/order");
const Notification = require("../models/notification");
const { generateInvoice } = require('./invoiceController');
const { sendEmailForOrderAccept, sendEmailForOrderDeny, sendEmailForOrderUpdateOrderStatus, sendAdminMessageEmail, getUserEmailById } = require("../utils/email");
const { decodeToken } = require('../utils/token');
const uploadToDrive = require('../utils/uploadToDrive');
const path = require('path');

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await OrderModel.find({ accepted: false }, '_id user_id product status accepted createdAt updatedAt').exec();
    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: 'No orders found.' });
    }
    res.status(200).json({ message: 'Orders fetched successfully', data: orders });
  } catch (error) {
    next(error);
  }
};

const getAllAcceptedOrders = async (req, res, next) => {
  try {
    const orders = await OrderModel.find({ accepted: true }, '_id user_id product status accepted createdAt updatedAt').exec();
    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: 'No accepted orders found.' });
    }
    res.status(200).json({ message: 'Accepted orders fetched successfully', data: orders });
  } catch (error) {
    next(error);
  }
};

const getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.params.user_id;
    const orders = await OrderModel.find({ user_id: userId }, '_id product status accepted adminMessages createdAt updatedAt').exec();
    
    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: 'No orders found for this user.' });
    }
    
    res.status(200).json({ message: 'Order history fetched successfully', data: orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await OrderModel.findById(orderId)
      .populate({
        path: 'user_id',
        select: 'username email phoneNumber'
      })
      .select('user_id product status accepted adminMessages createdAt updatedAt')
      .exec();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ message: 'Order fetched successfully', data: order });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { user_id, product: { product_id, quantity, notes, data } } = req.body;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'File is required' });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;

    const driveFile = await uploadToDrive.uploadFile(filePath, fileName);

    const driveFileId = driveFile.id;
    const fileLink = `https://drive.google.com/uc?id=${driveFileId}`;

    const product = { product_id, quantity, file: fileLink, notes, data };

    const newOrder = await OrderModel.create({ user_id, product });

    res.status(201).json({ message: 'Order created successfully' });
  } catch (error) {
    console.error("Error creating order:", error);
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body.product;

    const order = await OrderModel.findById(orderId);

    if (order.accepted) {
      return res.status(403).json({ error: 'Order cannot be updated because it is accepted.' });
    }

    if (req.file && req.file.path) {
      const filePath = req.file.path;
      const fileName = req.file.filename;

      const driveFile = await uploadToDrive.uploadFile(filePath, fileName);

      const driveFileId = driveFile.id;
      const fileLink = `https://drive.google.com/uc?id=${driveFileId}`;

      order.product.file = fileLink;
    }

    if (updateData) {
      if (updateData.quantity) {
        order.product.quantity = updateData.quantity;
      }

      if (updateData.notes) {
        order.product.notes = updateData.notes;
      }

      if (updateData.data) {
        updateData.data.forEach(item => {
          const index = item.index;
          if (index !== undefined && index >= 0 && index < order.product.data.length) {
            order.product.data[index].value = item.value;
          }
        });
      }
    }

    await order.save();

    res.status(200).json({ message: 'Order updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await OrderModel.findById(orderId);

    if (order.accepted) {
      return res.status(403).json({ error: 'Order cannot be deleted because it is accepted.' });
    }

    const deletedOrder = await OrderModel.findByIdAndDelete(orderId).exec();

    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

let users = {};

const createNotification = async (userId, title, message) => {
  try {
    const notification = new Notification({
      user_id: userId,
      title,
      message
    });
    await notification.save();

    const userSocketId = users[userId];
    if (userSocketId) {
      io.to(userSocketId).emit('notification', { title, message });
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const acceptOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { totalCost, paymentCode, deliveryTime } = req.body;
    
    const order = await OrderModel.findById(orderId).exec();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (!totalCost) {
      return res.status(400).json({ error: 'Total cost is required' });
    }
    
    order.accepted = true;
    await order.save();

    await generateInvoice(orderId, totalCost, paymentCode, deliveryTime);

    const userEmail = await getUserEmailById(order.user_id);
    await sendEmailForOrderAccept({ ...order.toObject(), user_email: userEmail });

    await createNotification(order.user_id, 'order_accept', `Your order ${orderId} has been accepted.`);

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

    await createNotification(deletedOrder.user_id, 'order_deny', `Your order ${orderId} has been denied.`);

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

    await createNotification(order.user_id, 'order_update_status', `Your order ${orderId} status has been updated to "${newStatus}".`);

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

    const userEmail = await getUserEmailById(order.user_id);

    await sendAdminMessageEmail({ to: userEmail, message });

    order.adminMessages.push(message);
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