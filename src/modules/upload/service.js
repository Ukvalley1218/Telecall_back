import { uploadToCloudinary, deleteFromCloudinary, getCloudinaryFileDetails } from '../../config/cloudinary.js';
import CallRecording from '../../models/CallRecording.js';
import logger from '../../utils/logger.js';

class UploadService {
  /**
   * Upload call recording to Cloudinary
   * @param {Object} fileData - File data (base64 or buffer)
   * @param {Object} metadata - Recording metadata
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID who is uploading
   * @returns {Promise<Object>} Upload result
   */
  async uploadCallRecording(fileData, metadata, organizationId, userId) {
    try {
      // Determine folder based on organization
      const folder = `telecalling/${organizationId}/recordings`;

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(fileData, {
        folder,
        resource_type: 'video', // Cloudinary treats audio as video
        use_filename: true,
        unique_filename: true
      });

      if (!uploadResult.success) {
        return {
          success: false,
          message: uploadResult.message || 'Failed to upload file'
        };
      }

      // Save recording metadata to database
      const recording = new CallRecording({
        organizationId,
        uploadedBy: userId,
        fileUrl: uploadResult.url,
        publicId: uploadResult.public_id,
        fileName: metadata.fileName || uploadResult.public_id.split('/').pop(),
        fileSize: uploadResult.size,
        format: uploadResult.format,
        callType: metadata.callType || 'outgoing',
        phoneNumber: metadata.phoneNumber,
        leadId: metadata.leadId,
        customerId: metadata.customerId,
        notes: metadata.notes,
        tags: metadata.tags || [],
        duration: metadata.duration
      });

      await recording.save();

      logger.info(`Call recording uploaded: ${recording._id} by user ${userId}`);

      return {
        success: true,
        recording: recording.toPublicJSON(),
        url: uploadResult.url,
        publicId: uploadResult.public_id
      };
    } catch (error) {
      logger.error('Upload call recording error:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload call recording'
      };
    }
  }

  /**
   * Get call recording by ID
   * @param {string} recordingId - Recording ID
   * @param {string} organizationId - Organization ID for security
   * @returns {Promise<Object>} Recording data
   */
  async getRecordingById(recordingId, organizationId) {
    try {
      const recording = await CallRecording.findOne({
        _id: recordingId,
        organizationId,
        isActive: true
      }).populate('uploadedBy', 'profile.firstName profile.lastName email');

      if (!recording) {
        return {
          success: false,
          message: 'Recording not found'
        };
      }

      return {
        success: true,
        recording: recording.toPublicJSON()
      };
    } catch (error) {
      logger.error('Get recording error:', error);
      return {
        success: false,
        message: 'Failed to get recording'
      };
    }
  }

  /**
   * Get all recordings for organization
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Filter options
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Recordings list with pagination
   */
  async getRecordings(organizationId, filters = {}, options = {}) {
    try {
      const query = { organizationId, isActive: true };

      if (filters.callType) {
        query.callType = filters.callType;
      }
      if (filters.uploadedBy) {
        query.uploadedBy = filters.uploadedBy;
      }
      if (filters.phoneNumber) {
        query.phoneNumber = new RegExp(filters.phoneNumber, 'i');
      }
      if (filters.leadId) {
        query.leadId = filters.leadId;
      }
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const [recordings, total] = await Promise.all([
        CallRecording.find(query)
          .populate('uploadedBy', 'profile.firstName profile.lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        CallRecording.countDocuments(query)
      ]);

      return {
        success: true,
        recordings: recordings.map(r => r.toPublicJSON()),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get recordings error:', error);
      return {
        success: false,
        message: 'Failed to get recordings'
      };
    }
  }

  /**
   * Get recordings by user
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Recordings list
   */
  async getRecordingsByUser(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const [recordings, total] = await Promise.all([
        CallRecording.find({ uploadedBy: userId, isActive: true })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        CallRecording.countDocuments({ uploadedBy: userId, isActive: true })
      ]);

      return {
        success: true,
        recordings: recordings.map(r => r.toPublicJSON()),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get user recordings error:', error);
      return {
        success: false,
        message: 'Failed to get recordings'
      };
    }
  }

  /**
   * Update recording metadata
   * @param {string} recordingId - Recording ID
   * @param {string} organizationId - Organization ID for security
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated recording
   */
  async updateRecording(recordingId, organizationId, updateData) {
    try {
      const allowedUpdates = ['notes', 'tags', 'phoneNumber', 'leadId', 'customerId', 'callType'];
      const update = {};

      for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
          update[key] = updateData[key];
        }
      }

      const recording = await CallRecording.findOneAndUpdate(
        { _id: recordingId, organizationId, isActive: true },
        { $set: update },
        { new: true }
      ).populate('uploadedBy', 'profile.firstName profile.lastName email');

      if (!recording) {
        return {
          success: false,
          message: 'Recording not found'
        };
      }

      logger.info(`Recording updated: ${recordingId}`);

      return {
        success: true,
        recording: recording.toPublicJSON()
      };
    } catch (error) {
      logger.error('Update recording error:', error);
      return {
        success: false,
        message: 'Failed to update recording'
      };
    }
  }

  /**
   * Delete recording (soft delete + remove from Cloudinary)
   * @param {string} recordingId - Recording ID
   * @param {string} organizationId - Organization ID for security
   * @returns {Promise<Object>} Delete result
   */
  async deleteRecording(recordingId, organizationId) {
    try {
      const recording = await CallRecording.findOne({
        _id: recordingId,
        organizationId,
        isActive: true
      });

      if (!recording) {
        return {
          success: false,
          message: 'Recording not found'
        };
      }

      // Delete from Cloudinary
      await deleteFromCloudinary(recording.publicId, 'video');

      // Soft delete in database
      recording.isActive = false;
      await recording.save();

      logger.info(`Recording deleted: ${recordingId}`);

      return {
        success: true,
        message: 'Recording deleted successfully'
      };
    } catch (error) {
      logger.error('Delete recording error:', error);
      return {
        success: false,
        message: 'Failed to delete recording'
      };
    }
  }

  /**
   * Upload any file to Cloudinary (generic)
   * @param {string} fileData - Base64 encoded file
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(fileData, options = {}) {
    try {
      const folder = options.folder || 'telecalling/misc';

      const result = await uploadToCloudinary(fileData, {
        folder,
        resource_type: options.resourceType || 'auto',
        use_filename: true,
        unique_filename: true
      });

      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Failed to upload file'
        };
      }

      logger.info(`File uploaded: ${result.public_id}`);

      return {
        success: true,
        url: result.url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        size: result.size
      };
    } catch (error) {
      logger.error('Upload file error:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload file'
      };
    }
  }
}

export default new UploadService();