const cloudinary = require("./cloudinary");

const upload = async (file, options = {}) => {
    try {

        const result = await cloudinary.uploader.upload(file.path, options);
        
        return result.secure_url;
    } catch (error) {
        throw error;
    }
};

module.exports = upload;
