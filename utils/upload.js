const cloudinary = require("./cloudinary");

const upload = async (file, options = {}) => {
    try {

        const result = await cloudinary.uploader.upload(file.path, options);
        
        return result.secure_url; // Return the secure URL of the uploaded file
    } catch (error) {
        throw error;
    }
};

module.exports = upload;
