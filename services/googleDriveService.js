// tulunad-backend/services/googleDriveService.js

const { google } = require('googleapis');
const fs = require('fs');
const { drive } = require('../googleDriveConfig'); // Import your drive instance

// Function to upload a file to Google Drive
const uploadFile = async (filePath, fileName, mimeType) => {
    try {
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: mimeType,
                // If you want to upload to a specific folder, uncomment and set 'parents':
                // parents: ['YOUR_GOOGLE_DRIVE_FOLDER_ID'],
            },
            media: {
                mimeType: mimeType,
                body: fs.createReadStream(filePath),
            },
            fields: 'id, name, webContentLink, webViewLink', // Request useful fields back
        });

        // Set permission to 'anyone with the link can view'
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Delete the temporary file from the 'uploads' directory after successful upload
        fs.unlinkSync(filePath);

        return response.data; // Returns file ID, name, etc.
    } catch (error) {
        console.error('Error uploading file to Google Drive:', error.message);
        // Clean up temporary file in case of error during upload or permission setting
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw new Error('Failed to upload image to Google Drive. Check permissions and API keys.');
    }
};

// Optional: Function to delete a file from Google Drive (useful when updating or deleting products)
const deleteFile = async (fileId) => {
    try {
        if (!fileId) {
            return; // No fileId to delete
        }
        await drive.files.delete({ fileId: fileId });
        console.log(`File with ID ${fileId} deleted from Google Drive.`);
    } catch (error) {
        console.error(`Error deleting file ${fileId} from Google Drive:`, error.message);
        // Don't rethrow, as the product update/deletion might still succeed even if image deletion fails.
    }
};

module.exports = { uploadFile, deleteFile };