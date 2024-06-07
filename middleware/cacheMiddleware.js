// middleware/cacheMiddleware.js
const { getAsync, setAsync } = require('../utils/redisClient');

const cacheMiddleware = async (req, res, next) => {
    const key = req.originalUrl || req.url;

    const cachedData = await getAsync(key);
    if (cachedData) {
        return res.send(JSON.parse(cachedData));
    }

    res.sendResponse = res.send;
    res.send = async (body) => {
        await setAsync(key, JSON.stringify(body), 3600);
        res.sendResponse(body);
    };
    next();
};

module.exports = cacheMiddleware;