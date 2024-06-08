const Product = require("../models/product");
const mongoose = require('mongoose');
const upload = require('../utils/fileUpload');
const { getAsync, setAsync, deleteAsync } = require("../utils/redisClient");

const invalidateCache = async () => {
    await deleteAsync('getAllProducts');
    await deleteAsync('getShownProducts');
    await deleteAsync('getDeletedProducts');
};

const createProduct = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Product image is required." });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`;
    
    const newProduct = await Product.create({ ...req.body, image: imageUrl });

    await invalidateCache();

    const products = await Product.find({}, "_id name description image deleted");
    await setAsync('getAllProducts', JSON.stringify(products), 3600);

    res.status(201).json({ message: "Product created successfully", data: newProduct });
  } catch (error) {
    next(error);
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const key = 'getAllProducts';
    const cachedProducts = await getAsync(key);
    if (cachedProducts) {
      return res.status(200).json({ message: 'Products fetched successfully', data: JSON.parse(cachedProducts) });
    }

    const products = await Product.find(
      {},
      "_id name description image deleted"
    );
    if (!products.length) {
      return res.status(200).json({ message: "No Products found" });
    }

    await setAsync(key, JSON.stringify(products), 3600);
    res.status(200).json({ message: "Products fetched successfully", data: products });
  } catch (error) {
    next(error);
  }
};

const getShownProducts = async (req, res, next) => {
  try {
    const key = 'getShownProducts';
    const cachedProducts = await getAsync(key);
    if (cachedProducts) {
      return res.status(200).json({ message: 'Products fetched successfully', data: JSON.parse(cachedProducts) });
    }

    const products = await Product.find(
      { deleted: false },
      "_id name description image"
    );
    if (!products.length) {
      return res.status(200).json({ message: "No Products found" });
    }

    await setAsync(key, JSON.stringify(products), 3600);
    res.status(200).json({ message: "Products fetched successfully", data: products });
  } catch (error) {
    next(error);
  }
};

const getDeletedProducts = async (req, res, next) => {
  try {
    const key = 'getDeletedProducts';
    const cachedProducts = await getAsync(key);
    if (cachedProducts) {
      return res.status(200).json({ message: 'Deleted Products fetched successfully', data: JSON.parse(cachedProducts) });
    }

    const deletedProducts = await Product.find(
      { deleted: true },
      "_id name description image"
    );
    if (!deletedProducts.length) {
      return res.status(200).json({ message: "No Deleted Products found" });
    }

    await setAsync(key, JSON.stringify(deletedProducts), 3600);
    res.status(200).json({ message: "Deleted Products fetched successfully", data: deletedProducts });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res
      .status(200)
      .json({ message: "Product fetched successfully", data: product });
  } catch (error) {
    next(error);
  }
};


const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const productData = req.body;

    const file = req.file;
    if (file) {
      productData.image = `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      productData,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    await invalidateCache();

    const products = await Product.find({}, "_id name description image deleted");
    await setAsync('getAllProducts', JSON.stringify(products), 3600);

    res.status(200).json({ message: "Product updated successfully", data: updatedProduct });
  } catch (error) {
    next(error);
  }
};

const toggleProductDeletedStatus = async (productId, deletedStatus) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { deleted: deletedStatus },
    { new: true }
  );

  if (!updatedProduct) {
    throw new Error("Product not found");
  }

  await invalidateCache();

  const products = await Product.find({}, "_id name description image deleted");
  await setAsync('getAllProducts', JSON.stringify(products), 3600);

  return updatedProduct;
};

const hideProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    await toggleProductDeletedStatus(productId, true);
    res.status(200).json({ message: "Product hidden successfully" });
  } catch (error) {
    next(error);
  }
};

const showProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    await toggleProductDeletedStatus(productId, false);
    res.status(200).json({ message: "Product shown successfully" });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;

    // Find the product by ID and delete it
    const deletedProduct = await Product.findByIdAndDelete(productId);

    // If the product doesn't exist, return 404 Not Found
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    await invalidateCache();

    const products = await Product.find({}, "_id name description image deleted");
    await setAsync('getAllProducts', JSON.stringify(products), 3600);

    // Return a success message
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const query = req.params.query;
    const regexQuery = new RegExp(`\\b${query}`, "i");
    const products = await Product.find(
      {
        $or: [{ name: { $regex: regexQuery } }],
      },
      "name description image"
    );

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found for the given query." });
    }

    res
      .status(200)
      .json({ message: "Products fetched successfully", data: products });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getShownProducts,
  getDeletedProducts,
  getProductById,
  updateProduct,
  hideProduct,
  showProduct,
  deleteProduct,
  searchProducts,
};