// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticated, isAdmin } = require('../middleware/auth');
const paginateMiddleware = require("../middleware/paginateMiddleware");
const ProductModel = require("../models/product");
const upload = require('../utils/fileUpload');
const { createProductValidator, updateProductValidator } = require("../utils/validators/productValidator");
const cacheMiddleware = require('../middleware/cacheMiddleware');

router.post('/create', isAdmin, upload.product.single('image'), createProductValidator, productController.createProduct);
router.get('/getAllProducts', isAdmin, paginateMiddleware(ProductModel), productController.getAllProducts);
router.get('/getShownProducts', paginateMiddleware(ProductModel), productController.getShownProducts);
// router.get('/deletedProducts', isAdmin, paginateMiddleware(ProductModel), cacheMiddleware, productController.getDeletedProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', isAdmin, upload.product.single('image'), updateProductValidator, productController.updateProduct);
router.put('/hide/:id', isAdmin, productController.hideProduct);
router.put('/show/:id', isAdmin, productController.showProduct);
router.delete('/:id', isAdmin, productController.deleteProduct);
router.get('/search/:query', productController.searchProducts);

module.exports = router;