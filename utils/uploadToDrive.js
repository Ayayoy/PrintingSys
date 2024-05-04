const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { google } = require('googleapis');
const apikeys = require('../DriveAPIKey.json');
const SCOPE = ['https://www.googleapis.com/auth/drive'];

async function authorize() {
    const jwtClient = new google.auth.JWT(
        apikeys.client_email,
        null,
        apikeys.private_key,
        SCOPE
    );

    await jwtClient.authorize();

    return jwtClient;
}

async function uploadFile(filePath, fileName) {
    console.log("Starting file upload...");
    try {
        // Detecting authClient
        const authClient = await authorize(); // Assuming authorize function is accessible within the scope

        // Detecting folderId
        const folderId = '1lY_PeSwah9Ssl8_zq0HaNBX18vQfQ7su'; // Or you can detect it from somewhere else

        // Detecting mimeType
        const mimeType = detectMimeType(filePath); // Function to detect MIME type based on file extension

        const drive = google.drive({ version: 'v3', auth: authClient });

        const fileMetaData = {
            name: fileName,
            parents: [folderId],
            mimeType: mimeType // Assuming mimeType is always detected
        };

        console.log("Uploading file metadata...");
        const response = await drive.files.create({
            resource: fileMetaData,
            media: {
                body: fs.createReadStream(filePath),
                mimeType: mimeType
            },
            fields: 'id'
        });

        console.log("File upload successful. File ID:", response.data.id);
        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

function detectMimeType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    // Get MIME type based on file extension
    const mimeType = mime.lookup(extension) || 'application/octet-stream'; // Default to application/octet-stream if MIME type is not found
    return mimeType;
}

module.exports = {
    authorize,
    uploadFile
};
