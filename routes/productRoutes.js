// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticated, isAdmin } = require('../middleware/auth');
const paginateMiddleware = require("../middleware/paginateMiddleware");
const ProductModel = require("../models/product");
const upload = require('../utils/fileUpload');
const { createProductValidator, updateProductValidator } = require("../utils/validators/productValidator");

router.post('/create', isAdmin, upload.product.single('image'), createProductValidator, productController.createProduct);
router.get('/', paginateMiddleware(ProductModel), productController.getAllProducts);
router.get('/deletedProducts', isAdmin, paginateMiddleware(ProductModel), productController.getDeletedProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', isAdmin, upload.product.single('image'), updateProductValidator, productController.updateProduct);
router.put('/delete/:id', isAdmin, productController.deleteProduct);
router.put('/restore/:id', isAdmin, productController.restoreProduct);
router.get('/search/:query', productController.searchProducts);

module.exports = router;