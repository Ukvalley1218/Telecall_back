import jobOpeningService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class JobOpeningController {
  /**
   * Get public job openings (no auth required)
   */
  async getPublicJobOpenings(req, res, next) {
    try {
      const { organizationId } = req.query;

      if (!organizationId) {
        return errorResponse(res, 'Organization ID is required', 400);
      }

      const filters = {
        department: req.query.department,
        location: req.query.location,
        type: req.query.type,
        search: req.query.search
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await jobOpeningService.getPublicJobOpenings(organizationId, filters, options);

      return successResponse(res, result, 'Job openings retrieved successfully');
    } catch (error) {
      logger.error('Get public job openings error:', error);
      next(error);
    }
  }

  /**
   * Get single public job opening
   */
  async getPublicJobOpening(req, res, next) {
    try {
      const jobOpening = await jobOpeningService.getPublicJobOpeningById(req.params.id);

      if (!jobOpening) {
        return notFoundResponse(res, 'Job opening');
      }

      return successResponse(res, jobOpening, 'Job opening retrieved successfully');
    } catch (error) {
      logger.error('Get public job opening error:', error);
      next(error);
    }
  }

  /**
   * Get all job openings (HR/Admin)
   */
  async getJobOpenings(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status,
        department: req.query.department,
        location: req.query.location,
        search: req.query.search
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await jobOpeningService.getJobOpenings(organizationId, filters, options);

      return successResponse(res, result, 'Job openings retrieved successfully');
    } catch (error) {
      logger.error('Get job openings error:', error);
      next(error);
    }
  }

  /**
   * Get job opening by ID
   */
  async getJobOpening(req, res, next) {
    try {
      const { organizationId } = req;
      const jobOpening = await jobOpeningService.getJobOpeningById(req.params.id, organizationId);

      if (!jobOpening) {
        return notFoundResponse(res, 'Job opening');
      }

      return successResponse(res, jobOpening, 'Job opening retrieved successfully');
    } catch (error) {
      logger.error('Get job opening error:', error);
      next(error);
    }
  }

  /**
   * Get job opening statistics
   */
  async getJobOpeningStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await jobOpeningService.getJobOpeningStatistics(organizationId);

      return successResponse(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      logger.error('Get job opening stats error:', error);
      next(error);
    }
  }

  /**
   * Create new job opening
   */
  async createJobOpening(req, res, next) {
    try {
      const { organizationId, user } = req;
      const jobOpeningData = {
        ...req.body,
        organizationId,
        postedBy: user._id
      };

      const jobOpening = await jobOpeningService.createJobOpening(jobOpeningData);

      logger.info(`Job opening created: ${jobOpening.title} by ${user._id}`);

      return createdResponse(res, jobOpening, 'Job opening created successfully');
    } catch (error) {
      logger.error('Create job opening error:', error);
      next(error);
    }
  }

  /**
   * Update job opening
   */
  async updateJobOpening(req, res, next) {
    try {
      const { organizationId } = req;
      const jobOpening = await jobOpeningService.updateJobOpening(
        req.params.id,
        organizationId,
        req.body
      );

      if (!jobOpening) {
        return notFoundResponse(res, 'Job opening');
      }

      return successResponse(res, jobOpening, 'Job opening updated successfully');
    } catch (error) {
      logger.error('Update job opening error:', error);
      next(error);
    }
  }

  /**
   * Activate job opening
   */
  async activateJobOpening(req, res, next) {
    try {
      const { organizationId } = req;
      const jobOpening = await jobOpeningService.updateStatus(
        req.params.id,
        organizationId,
        'active'
      );

      if (!jobOpening) {
        return notFoundResponse(res, 'Job opening');
      }

      return successResponse(res, jobOpening, 'Job opening activated successfully');
    } catch (error) {
      logger.error('Activate job opening error:', error);
      next(error);
    }
  }

  /**
   * Close job opening
   */
  async closeJobOpening(req, res, next) {
    try {
      const { organizationId } = req;
      const jobOpening = await jobOpeningService.updateStatus(
        req.params.id,
        organizationId,
        'closed'
      );

      if (!jobOpening) {
        return notFoundResponse(res, 'Job opening');
      }

      return successResponse(res, jobOpening, 'Job opening closed successfully');
    } catch (error) {
      logger.error('Close job opening error:', error);
      next(error);
    }
  }

  /**
   * Put job opening on hold
   */
  async holdJobOpening(req, res, next) {
    try {
      const { organizationId } = req;
      const jobOpening = await jobOpeningService.updateStatus(
        req.params.id,
        organizationId,
        'on_hold'
      );

      if (!jobOpening) {
        return notFoundResponse(res, 'Job opening');
      }

      return successResponse(res, jobOpening, 'Job opening put on hold successfully');
    } catch (error) {
      logger.error('Hold job opening error:', error);
      next(error);
    }
  }

  /**
   * Delete job opening
   */
  async deleteJobOpening(req, res, next) {
    try {
      const { organizationId } = req;
      const result = await jobOpeningService.deleteJobOpening(req.params.id, organizationId);

      if (!result) {
        return notFoundResponse(res, 'Job opening');
      }

      return successResponse(res, null, 'Job opening deleted successfully');
    } catch (error) {
      logger.error('Delete job opening error:', error);
      next(error);
    }
  }

  /**
   * Get applications for a job opening
   */
  async getJobApplications(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await jobOpeningService.getApplicationsForJob(
        req.params.id,
        organizationId,
        filters,
        options
      );

      return successResponse(res, result, 'Applications retrieved successfully');
    } catch (error) {
      logger.error('Get job applications error:', error);
      next(error);
    }
  }
}

export default new JobOpeningController();