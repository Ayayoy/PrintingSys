const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // Use fs promises for asynchronous file operations

// Define upload paths
const uploadPaths = {
  product: path.join('uploads/products/'),
  order: path.join('uploads/orders/')
};

// Ensure directories exist or create them asynchronously
const ensureDirectoryExistence = async (filePath) => {
  try {
    const dirname = path.dirname(filePath);
    await fs.mkdir(dirname, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to ensure directory existence: ${error.message}`);
  }
};

// Generate unique filename with original filename and timestamp
const generateUniqueFilename = (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  return uniqueSuffix + '-' + file.originalname;
};

// Define multer storage for products and orders
const storage = {
  product: multer.diskStorage({
    destination: async function (req, file, cb) {
      await ensureDirectoryExistence(uploadPaths.product);
      cb(null, uploadPaths.product);
    },
    filename: function (req, file, cb) {
      cb(null, generateUniqueFilename(file));
    }
  }),
  order: multer.diskStorage({
    destination: async function (req, file, cb) {
      await ensureDirectoryExistence(uploadPaths.order);
      cb(null, uploadPaths.order);
    },
    filename: function (req, file, cb) {
      cb(null, generateUniqueFilename(file));
    }
  })
};

// Define file filters for products and orders
const fileFilters = {
  product: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type for product.');
      error.status = 400;
      return cb(error);
    }
  },
  order: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type for order.');
      error.status = 400;
      return cb(error);
    }
  }
};

// Initialize multer instances for products and orders
const upload = {
  product: multer({
    storage: storage.product,
    fileFilter: fileFilters.product,
    limits: {
      fileSize: 1024 * 1024 * 5 // 5 MB
    }
  }),
  order: multer({
    storage: storage.order,
    fileFilter: fileFilters.order,
    limits: {
      fileSize: 1024 * 1024 * 5 // 5 MB
    }
  })
};

module.exports = upload;
