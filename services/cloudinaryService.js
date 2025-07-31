// backend/services/cloudinaryService.js

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary using environment variables from your .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Ensures that image URLs are served over HTTPS
});

/**
 * Uploads an image file to Cloudinary.
 * @param {string} filePath - The path to the temporary file on the server (e.g., 'uploads/image.png').
 * @param {string} originalFileName - The original name of the file, used to create a public_id.
 * @returns {Promise<object>} A promise that resolves to an object containing the secure URL and public_id of the uploaded image.
 */
const uploadImage = async (filePath, originalFileName) => {
  try {
    // Upload the image to a specific folder in Cloudinary for better organization.
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'tulunad-store-products',
      // Use the original file name (without extension) as the public ID for easier identification.
      public_id: originalFileName.split('.')[0],
      overwrite: true, // Overwrite if a file with the same public_id already exists.
      resource_type: 'image', // Specify that we are uploading an image.
    });

    // IMPORTANT: Clean up the temporary file from the local 'uploads' directory after a successful upload.
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.log('Image uploaded to Cloudinary successfully:', result.secure_url);
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Also clean up the temporary file if the upload fails.
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

/**
 * Deletes an image from Cloudinary using its public_id.
 * @param {string} publicId - The public_id of the image to delete.
 * @returns {Promise<boolean>} A promise that resolves to true if deletion was successful, false otherwise.
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'
    });
    
    if (result.result !== 'ok') {
      console.warn(`Cloudinary deletion warning for public_id ${publicId}:`, result);
      return false;
    }

    console.log(`Image deleted from Cloudinary successfully: ${publicId}`);
    return true;
  } catch (error) {
    console.error(`Cloudinary deletion error for public_id ${publicId}:`, error);
    // We don't re-throw the error here because a failed image deletion shouldn't
    // necessarily stop a product from being deleted from the database.
    return false;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};
