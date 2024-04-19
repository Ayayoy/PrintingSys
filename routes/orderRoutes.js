// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const invoiceController = require('../controllers/invoiceController'); 
const { authenticated, isAdmin } = require('../middleware/auth');
const { createOrderValidator, updateOrderValidator } = require('../utils/validators/orderValidator');
const upload = require('../utils/fileUpload');

router.get('/', authenticated, orderController.getAllOrders);
router.get('/acceptedOrders', authenticated, orderController.getAllAcceptedOrders);
router.get('/orderHistory/:user_id', authenticated, orderController.getOrderHistory);
router.get('/:id', authenticated, orderController.getOrderById);
router.post('/create', authenticated, upload.single('product[File]'), createOrderValidator, orderController.createOrder);
router.put('/:id', authenticated, upload.single('product[File]'), updateOrderValidator, orderController.updateOrder);
router.delete('/:id', authenticated, orderController.deleteOrder);
router.put('/:id/accept', isAdmin, orderController.acceptOrder);
router.delete('/:id/deny', isAdmin, orderController.denyOrder);
router.put('/:id/status', isAdmin, orderController.UpdateOrderStatus);
router.post('/:id/sendMessage', isAdmin, orderController.sendAdminMessage);
router.get('/:id/invoice', authenticated, invoiceController.getInvoiceByOrderId);

module.exports = router;
