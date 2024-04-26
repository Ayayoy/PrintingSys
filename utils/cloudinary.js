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

const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const upload = async (file, options = {}) => {
    try {
        if (!allowedFileTypes.includes(file.mimetype)) {
            throw new Error('Unsupported file type. Please upload a supported file type.');
        }
        const result = await cloudinary.uploader.upload(file.path, options);
        
        return result.secure_url; // Return the secure URL of the uploaded file
    } catch (error) {
        throw error;
    }
};

module.exports = upload;
