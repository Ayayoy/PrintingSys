// middleware/cacheMiddleware.js
const createRedisClient = require('../config/caching');

const redisClient = createRedisClient();

const cacheMiddleware = (req, res, next) => {
  const cacheKey = req.originalUrl;

  redisClient.get(cacheKey, (err, data) => {
    if (err) {
      console.error('Error accessing Redis cache:', err);
      return next();
    }

    if (data !== null) {
      const cachedData = JSON.parse(data);
      return res.json({ fromCache: true, data: cachedData });
    }

    res.sendResponse = res.json;

    res.json = (body) => {
      redisClient.setex(cacheKey, 3600, JSON.stringify(body));
      res.sendResponse(body);
    };

    next();
  });
};

module.exports = cacheMiddleware;
