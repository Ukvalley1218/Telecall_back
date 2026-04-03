import { v2 as cloudinary } from 'cloudinary';

/**
 * Configure Cloudinary with environment variables
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {string} file - Base64 encoded file or file path
 * @param {Object} options - Upload options
 * @param {string} options.folder - Folder name in Cloudinary
 * @param {string} options.resource_type - Resource type (image, video, raw, auto)
 * @returns {Promise<Object>} Upload result
 */
export const uploadToCloudinary = async (file, options = {}) => {
  try {
    const defaultOptions = {
      folder: options.folder || 'telecalling',
      resource_type: options.resource_type || 'auto',
      use_filename: true,
      unique_filename: true
    };

    const result = await cloudinary.uploader.upload(file, {
      ...defaultOptions,
      ...options
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      size: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      message: error.message || 'Failed to upload file'
    };
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>} Delete result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'video') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    return {
      success: result.result === 'ok',
      message: result.result === 'ok' ? 'File deleted successfully' : 'File not found'
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete file'
    };
  }
};

/**
 * Get file details from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @returns {Promise<Object>} File details
 */
export const getCloudinaryFileDetails = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      size: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Cloudinary get details error:', error);
    return {
      success: false,
      message: error.message || 'Failed to get file details'
    };
  }
};

export default cloudinary;