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
    try {
        const authClient = await authorize();
        const folderId = '1lY_PeSwah9Ssl8_zq0HaNBX18vQfQ7su';
        const mimeType = detectMimeType(filePath); 
        const drive = google.drive({ version: 'v3', auth: authClient });

        const fileMetaData = {
            name: fileName,
            parents: [folderId],
            mimeType: mimeType
        };

        const response = await drive.files.create({
            resource: fileMetaData,
            media: {
                body: fs.createReadStream(filePath),
                mimeType: mimeType
            },
            fields: 'id'
        });

        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

function detectMimeType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const mimeType = mime.lookup(extension) || 'application/octet-stream';
    return mimeType;
}

module.exports = {
    authorize,
    uploadFile
};
