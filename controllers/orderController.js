const OrderModel = require("../models/order");
const Notification = require("../models/notification");
const { generateInvoice } = require('./invoiceController');
const { sendEmailForOrderAccept, sendEmailForOrderDeny, sendEmailForOrderUpdateOrderStatus, sendAdminMessageEmail, getUserEmailById } = require("../utils/email");
const { decodeToken } = require('../utils/token');
const uploadToDrive = require('../utils/uploadToDrive');
const path = require('path');
const { getAsync, setAsync, deleteAsync } = require('../utils/redisClient');
const { createNotification } = require('./NotificationController');

const invalidateCache = async () => {
    await deleteAsync('getAllOrders');
    await deleteAsync('getAllAcceptedOrders');
};

const updateOrderCache = async () => {
  const orders = await OrderModel.find({accepted: false}, '_id user_id product status accepted createdAt updatedAt').exec();
  await setAsync('getAllOrders', JSON.stringify(orders), 3600);

  const acceptedOrders = await OrderModel.find({ accepted: true }, '_id user_id product status accepted createdAt updatedAt').exec();
  await setAsync('getAllAcceptedOrders', JSON.stringify(acceptedOrders), 3600);

  const users = await OrderModel.distinct('user_id');
  for (const userId of users) {
      const key = `getOrderHistory:${userId}`;
      const orders = await OrderModel.find({ user_id: userId }, '_id product status accepted adminMessages createdAt updatedAt').exec();
      await setAsync(key, JSON.stringify(orders), 3600);
  }

  for (const order of orders) {
    const key = `getOrderById:${order._id}`;
    await setAsync(key, JSON.stringify(order), 3600);
}
};

const getAllOrders = async (req, res, next) => {
    try {
        const key = 'getAllOrders';
        const cachedOrders = await getAsync(key);
        if (cachedOrders) {
            return res.status(200).json({ message: 'Orders fetched successfully', data: JSON.parse(cachedOrders) });
        }

        const orders = await OrderModel.find({ accepted: false }, '_id user_id product status accepted createdAt updatedAt').exec();
        if (!orders || orders.length === 0) {
            return res.status(200).json({ message: 'No orders found.' });
        }

        await setAsync(key, JSON.stringify(orders), 3600);
        res.status(200).json({ message: 'Orders fetched successfully', data: orders });
    } catch (error) {
        next(error);
    }
};

const getAllAcceptedOrders = async (req, res, next) => {
    try {
        const key = 'getAllAcceptedOrders';
        const cachedOrders = await getAsync(key);
        if (cachedOrders) {
            return res.status(200).json({ message: 'Accepted orders fetched successfully', data: JSON.parse(cachedOrders) });
        }

        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        const orders = await OrderModel.find({ accepted: true }, '_id user_id product status accepted createdAt updatedAt')
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .exec();

        if (!orders || orders.length === 0) {
            return res.status(200).json({ message: 'No accepted orders found.' });
        }

        const totalOrders = await OrderModel.countDocuments({ accepted: true });

        const data = {
            message: 'Accepted orders fetched successfully',
            data: orders,
            currentPage: pageNum,
            totalPages: Math.ceil(totalOrders / limitNum),
            totalOrders
        };

        await setAsync(key, JSON.stringify(data), 3600);
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

const getOrderHistory = async (req, res, next) => {
    try {
        const userId = req.params.user_id;
        const key = `getOrderHistory:${userId}`;
        const cachedOrderHistory = await getAsync(key);
        if (cachedOrderHistory) {
            return res.status(200).json({ message: 'Order history fetched successfully', data: JSON.parse(cachedOrderHistory) });
        }

        const orders = await OrderModel.find({ user_id: userId }, '_id product status accepted adminMessages createdAt updatedAt').exec();

        if (!orders || orders.length === 0) {
            return res.status(200).json({ message: 'No orders found for this user.' });
        }

        await setAsync(key, JSON.stringify(orders), 3600);
        res.status(200).json({ message: 'Order history fetched successfully', data: orders });
    } catch (error) {
        next(error);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const key = `getOrderById:${orderId}`;
        const cachedOrder = await getAsync(key);
        if (cachedOrder) {
            return res.status(200).json({ message: 'Order fetched successfully', data: JSON.parse(cachedOrder) });
        }

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

        await setAsync(key, JSON.stringify(order), 3600);
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

        const fileLink = `${req.protocol}://${req.get('host')}/uploads/orders/${fileName}`;

        const product = { product_id, quantity, file: fileLink, notes, data };

        const newOrder = await OrderModel.create({ user_id, product });

        await invalidateCache();
        await updateOrderCache();

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

            const fileLink = `${req.protocol}://${req.get('host')}/uploads/orders/${fileName}`;

            updateData.file = fileLink;
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

        await invalidateCache();
        await updateOrderCache();

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

        await invalidateCache();
        await updateOrderCache();

        return res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        next(error);
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
      await deleteAsync(`getOrderById:${orderId}`);
      await deleteAsync('getAllOrders');
  
      await generateInvoice(orderId, totalCost, paymentCode, deliveryTime);
  
      await createNotification(order.user_id, 'order_accept', `Your order ${orderId} has been accepted.`);
  
      await invalidateCache();
      await updateOrderCache();
  
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
        await deleteAsync(`getOrderById:${orderId}`);
        await deleteAsync('getAllOrders');

        await createNotification(deletedOrder.user_id, 'order_deny', `Your order ${orderId} has been denied.`);

        await invalidateCache();
        await updateOrderCache();

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
        await deleteAsync(`getOrderById:${orderId}`);

        await createNotification(order.user_id, 'order_update_status', `Your order ${orderId} status has been updated to "${newStatus}".`);

        await invalidateCache();
        await updateOrderCache();

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
        
        await invalidateCache();
        await updateOrderCache();

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
