// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const revokedTokens = new Set();

const verifyToken = async (token) => {
  try {
    if (!token) {
      throw new Error("No token provided.");
    }

    // const tokenParts = token.split(" ");
    // if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    //   throw new Error("Invalid token format.");
    // }

    // const jwtToken = tokenParts[1];

    if (revokedTokens.has(jwtToken)) {
      throw new Error("Token revoked.");
    }

    const decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET);
    return decodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired.");
    } else {
      throw new Error("Authentication failed.");
    }
  }
};

const authenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const decodedToken = await verifyToken(token);
    req.userData = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const decodedToken = await verifyToken(token);

    if (!decodedToken || !decodedToken.role || decodedToken.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }

    req.userData = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

module.exports = { authenticated, isAdmin, revokedTokens };
