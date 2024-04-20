//utils/token.js
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign({ 
    userId: user._id,
    username: user.username,
    email: user.email,
    role: user.role 
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION_TIME,
  });
};

const generateRandomCode = () => {
  const length = 6; 
  const characters = '0123456789';
  let OTP = '';

  for (let i = 0; i < length; i++) {
    OTP += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return OTP;
};


const decodeToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, generateRandomCode, decodeToken };
