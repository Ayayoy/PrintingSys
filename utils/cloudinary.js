const path = require("path");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;

const dirname = path.resolve();

dotenv.config({ path: path.join(dirname, 'config/config.env') });

cloudinary.config({
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
    cloud_name: process.env.cloud_name,
    secure: true
});

module.exports = cloudinary;
