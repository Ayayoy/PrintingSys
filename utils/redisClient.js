// utils/redisClient.js
const redis = require('redis');

let client;

const connectToRedis = async () => {
    client = redis.createClient({
        host: '127.0.0.1',
        port: 6379
    });

    client.on('error', (err) => {
        console.error('Redis error:', err);
    });

    client.on('connect', () => {
        console.log('Connected to Redis');
    });

    await client.connect();
};

connectToRedis();

const getAsync = async (key) => {
    return await client.get(key);
};

const setAsync = async (key, value, ttl) => {
    await client.set(key, value);
    await client.expire(key, ttl);
};

const deleteAsync = async (key) => {
    await client.del(key);
};

module.exports = { getAsync, setAsync, deleteAsync };