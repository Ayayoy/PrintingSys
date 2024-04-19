// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const revokedTokens = new Set();

const authenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    const tokenParts = token.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res.status(401).json({ message: "Invalid token format." });
    }

    const jwtToken = tokenParts[1];

    if (revokedTokens.has(jwtToken)) {
      return res.status(401).json({ message: "Token revoked." });
    }
    
    try {
      const decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET);
      req.userData = decodedToken;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: "Token expired." });
      } else {
        return res.status(401).json({ message: "Authentication failed." });
      }
    }
  } catch (error) {
    next(error);
  }
};

const isAdmin = (req, res, next) => {
  try {
    const decodedToken = req.userData;

    if (!decodedToken || !decodedToken.role || decodedToken.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {authenticated, isAdmin, revokedTokens };
