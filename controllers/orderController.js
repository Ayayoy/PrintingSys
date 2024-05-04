//controllers/OrderController
const OrderModel = require("../models/order");
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
    const { user_id, product: { product_id, quantity, data } } = req.body;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'File is required' });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;

    const driveFile = await uploadToDrive.uploadFile(filePath, fileName);

    const driveFileId = driveFile.id;
    const fileLink = `https://drive.google.com/uc?id=${driveFileId}`;

    const product = { product_id, quantity, file: fileLink, data };

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

    if (req.file && req.file.path) {
      // Upload file to Google Drive
      const filePath = req.file.path;
      const fileName = req.file.filename;

      const driveFile = await uploadToDrive.uploadFile(filePath, fileName);

      // Get the file ID and construct the link
      const driveFileId = driveFile.id;
      const fileLink = `https://drive.google.com/uc?id=${driveFileId}`;

      // Save file link to the database
      order.product.file = fileLink;
    }

    if (updateData) {
      if (updateData.quantity) {
        order.product.quantity = updateData.quantity;
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
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId).exec();

    // if (deletedOrder.acceptted == true){
      
    //   // add response giving error message that the order cant deleted because it is accepted by admin
    // }
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

    const userEmail = await getUserEmailById(order.user_id);
    await sendEmailForOrderAccept({ ...order.toObject(), user_email: userEmail });

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