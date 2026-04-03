import uploadService from './service.js';
import { successResponse, errorResponse, createdResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class UploadController {
  /**
   * Upload call recording
   */
  async uploadCallRecording(req, res, next) {
    try {
      const { file } = req.body;
      const { callType, phoneNumber, leadId, customerId, notes, tags, fileName, duration } = req.body;
      const organizationId = req.organizationId;
      const userId = req.user._id;

      if (!file) {
        return errorResponse(res, 'No file provided', 400);
      }

      let fileData = file;
      if (file.startsWith('data:audio') || file.startsWith('data:video')) {
        fileData = file.split(',')[1] || file;
      }

      const metadata = {
        callType,
        phoneNumber,
        leadId,
        customerId,
        notes,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        fileName,
        duration: duration ? parseInt(duration) : undefined
      };

      const result = await uploadService.uploadCallRecording(fileData, metadata, organizationId, userId);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      logger.info(`Call recording uploaded by user ${userId}`);

      return createdResponse(res, result.recording, 'Call recording uploaded successfully');
    } catch (error) {
      logger.error('Upload call recording error:', error);
      next(error);
    }
  }

  /**
   * Get recording by ID
   */
  async getRecordingById(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId;

      const result = await uploadService.getRecordingById(id, organizationId);

      if (!result.success) {
        return errorResponse(res, result.message, 404);
      }

      return successResponse(res, result.recording, 'Recording retrieved successfully');
    } catch (error) {
      logger.error('Get recording error:', error);
      next(error);
    }
  }

  /**
   * Get all recordings (organization)
   */
  async getRecordings(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const { page, limit, callType, uploadedBy, phoneNumber, leadId, startDate, endDate } = req.query;

      const filters = {
        callType,
        uploadedBy,
        phoneNumber,
        leadId,
        startDate,
        endDate
      };

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const result = await uploadService.getRecordings(organizationId, filters, options);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return res.status(200).json({
        success: true,
        message: 'Recordings retrieved successfully',
        data: result.recordings,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get recordings error:', error);
      next(error);
    }
  }

  /**
   * Get my recordings (user's own recordings)
   */
  async getMyRecordings(req, res, next) {
    try {
      const userId = req.user._id;
      const { page, limit } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      const result = await uploadService.getRecordingsByUser(userId, options);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return res.status(200).json({
        success: true,
        message: 'Recordings retrieved successfully',
        data: result.recordings,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get my recordings error:', error);
      next(error);
    }
  }

  /**
   * Update recording metadata
   */
  async updateRecording(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId;
      const updateData = req.body;

      const result = await uploadService.updateRecording(id, organizationId, updateData);

      if (!result.success) {
        return errorResponse(res, result.message, 404);
      }

      return successResponse(res, result.recording, 'Recording updated successfully');
    } catch (error) {
      logger.error('Update recording error:', error);
      next(error);
    }
  }

  /**
   * Delete recording
   */
  async deleteRecording(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId;

      const result = await uploadService.deleteRecording(id, organizationId);

      if (!result.success) {
        return errorResponse(res, result.message, 404);
      }

      return successResponse(res, null, 'Recording deleted successfully');
    } catch (error) {
      logger.error('Delete recording error:', error);
      next(error);
    }
  }

  /**
   * Upload generic file
   */
  async uploadFile(req, res, next) {
    try {
      const { file, folder, resourceType } = req.body;

      if (!file) {
        return errorResponse(res, 'No file provided', 400);
      }

      let fileData = file;
      if (typeof file === 'string' && file.startsWith('data:')) {
        fileData = file.split(',')[1] || file;
      }

      const result = await uploadService.uploadFile(fileData, {
        folder: folder || 'telecalling/misc',
        resourceType: resourceType || 'auto'
      });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return createdResponse(res, {
        url: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType,
        format: result.format,
        size: result.size
      }, 'File uploaded successfully');
    } catch (error) {
      logger.error('Upload file error:', error);
      next(error);
    }
  }
}

export default new UploadController();