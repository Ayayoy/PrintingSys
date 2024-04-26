const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require("../utils/cloudinary");


// Define upload paths
const productUploadPath = path.join('uploads/products/');
const orderUploadPath = path.join('uploads/orders/');

// Ensure directories exist or create them
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

ensureDirectoryExistence(productUploadPath);
ensureDirectoryExistence(orderUploadPath);

// Define multer storage for products
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureDirectoryExistence(productUploadPath); // Ensure directory exists before saving file
    cb(null, productUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

// Define multer storage for orders
const orderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureDirectoryExistence(orderUploadPath); // Ensure directory exists before saving file
    cb(null, orderUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

// Define file filter for products
const productFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type for product.');
    error.status = 400;
    return cb(error);
  }
};

// Define file filter for orders
const orderFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type for order.');
    error.status = 400;
    return cb(error);
  }
};


// Initialize multer instances for products and orders
const productUpload = multer({
  storage: productStorage,
  fileFilter: productFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB
  }
});

const orderUpload = multer({
  storage: orderStorage,
  fileFilter: orderFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB
  }
});

module.exports = {
  productUpload,
  orderUpload
};
