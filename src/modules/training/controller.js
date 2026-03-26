import trainingService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class TrainingController {
  // ==================== Training Endpoints ====================

  async getTrainings(req, res, next) {
    try {
      const { organizationId } = req;
      const { type, status, category, isMandatory, instructor, startDate, endDate, page, limit } = req.query;

      const result = await trainingService.getTrainings(organizationId, {
        type, status, category, isMandatory, instructor, startDate, endDate
      }, { page: parseInt(page) || 1, limit: parseInt(limit) || 20 });

      return paginatedResponse(
        res,
        result.trainings,
        parseInt(page) || 1,
        parseInt(limit) || 20,
        result.pagination.total,
        'Trainings retrieved successfully'
      );
    } catch (error) {
      logger.error('Get trainings error:', error);
      next(error);
    }
  }

  async getTrainingById(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const training = await trainingService.getTrainingById(id, organizationId);

      if (!training) {
        return notFoundResponse(res, 'Training');
      }

      return successResponse(res, training, 'Training retrieved successfully');
    } catch (error) {
      logger.error('Get training error:', error);
      next(error);
    }
  }

  async createTraining(req, res, next) {
    try {
      const { organizationId, user } = req;

      const training = await trainingService.createTraining({
        ...req.body,
        organizationId,
        createdBy: user._id
      });

      logger.info(`Training created: ${training.trainingId} by user ${user._id}`);

      return createdResponse(res, training, 'Training created successfully');
    } catch (error) {
      logger.error('Create training error:', error);
      next(error);
    }
  }

  async updateTraining(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;

      const training = await trainingService.updateTraining(id, organizationId, {
        ...req.body,
        updatedBy: user._id
      });

      if (!training) {
        return notFoundResponse(res, 'Training');
      }

      return successResponse(res, training, 'Training updated successfully');
    } catch (error) {
      logger.error('Update training error:', error);
      next(error);
    }
  }

  async deleteTraining(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const training = await trainingService.deleteTraining(id, organizationId);

      if (!training) {
        return notFoundResponse(res, 'Training');
      }

      return successResponse(res, null, 'Training deleted successfully');
    } catch (error) {
      logger.error('Delete training error:', error);
      next(error);
    }
  }

  async getUpcomingTrainings(req, res, next) {
    try {
      const { organizationId } = req;
      const { limit = 10 } = req.query;

      const trainings = await trainingService.getUpcomingTrainings(organizationId, parseInt(limit));

      return successResponse(res, trainings, 'Upcoming trainings retrieved successfully');
    } catch (error) {
      logger.error('Get upcoming trainings error:', error);
      next(error);
    }
  }

  async getMandatoryTrainings(req, res, next) {
    try {
      const { organizationId } = req;

      const trainings = await trainingService.getMandatoryTrainings(organizationId);

      return successResponse(res, trainings, 'Mandatory trainings retrieved successfully');
    } catch (error) {
      logger.error('Get mandatory trainings error:', error);
      next(error);
    }
  }

  async startTraining(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const training = await trainingService.startTraining(id, organizationId);

      return successResponse(res, training, 'Training started successfully');
    } catch (error) {
      logger.error('Start training error:', error);
      next(error);
    }
  }

  async completeTraining(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const training = await trainingService.completeTraining(id, organizationId);

      return successResponse(res, training, 'Training completed successfully');
    } catch (error) {
      logger.error('Complete training error:', error);
      next(error);
    }
  }

  async cancelTraining(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;
      const { reason } = req.body;

      const training = await trainingService.cancelTraining(id, organizationId, reason);

      return successResponse(res, training, 'Training cancelled successfully');
    } catch (error) {
      logger.error('Cancel training error:', error);
      next(error);
    }
  }

  // ==================== Enrollment Endpoints ====================

  async enrollEmployee(req, res, next) {
    try {
      const { user } = req;
      const { trainingId, employeeId } = req.body;

      const enrollment = await trainingService.enrollEmployee(trainingId, employeeId, user._id);

      logger.info(`Employee ${employeeId} enrolled in training ${trainingId} by user ${user._id}`);

      return createdResponse(res, enrollment, 'Employee enrolled successfully');
    } catch (error) {
      logger.error('Enroll employee error:', error);
      next(error);
    }
  }

  async cancelEnrollment(req, res, next) {
    try {
      const { trainingId, employeeId } = req.params;
      const { reason } = req.body;

      const enrollment = await trainingService.cancelEnrollment(trainingId, employeeId, reason);

      return successResponse(res, enrollment, 'Enrollment cancelled successfully');
    } catch (error) {
      logger.error('Cancel enrollment error:', error);
      next(error);
    }
  }

  async getEmployeeEnrollments(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { status } = req.query;

      const enrollments = await trainingService.getEmployeeEnrollments(employeeId, status);

      return successResponse(res, enrollments, 'Enrollments retrieved successfully');
    } catch (error) {
      logger.error('Get employee enrollments error:', error);
      next(error);
    }
  }

  async getTrainingEnrollments(req, res, next) {
    try {
      const { trainingId } = req.params;
      const { status } = req.query;

      const enrollments = await trainingService.getTrainingEnrollments(trainingId, status);

      return successResponse(res, enrollments, 'Enrollments retrieved successfully');
    } catch (error) {
      logger.error('Get training enrollments error:', error);
      next(error);
    }
  }

  async updateProgress(req, res, next) {
    try {
      const { enrollmentId } = req.params;
      const { progress, sessionsAttended } = req.body;

      const enrollment = await trainingService.updateProgress(enrollmentId, progress, sessionsAttended);

      return successResponse(res, enrollment, 'Progress updated successfully');
    } catch (error) {
      logger.error('Update progress error:', error);
      next(error);
    }
  }

  async completeTrainingForEmployee(req, res, next) {
    try {
      const { enrollmentId } = req.params;
      const { score } = req.body;

      const enrollment = await trainingService.completeTrainingForEmployee(enrollmentId, score);

      return successResponse(res, enrollment, 'Training completed successfully');
    } catch (error) {
      logger.error('Complete training for employee error:', error);
      next(error);
    }
  }

  async submitFeedback(req, res, next) {
    try {
      const { enrollmentId } = req.params;
      const { rating, comments, content, instructor, materials, overall } = req.body;

      const enrollment = await trainingService.submitFeedback(enrollmentId, {
        rating, comments, content, instructor, materials, overall
      });

      return successResponse(res, enrollment, 'Feedback submitted successfully');
    } catch (error) {
      logger.error('Submit feedback error:', error);
      next(error);
    }
  }

  async getTrainingStats(req, res, next) {
    try {
      const { organizationId } = req;

      const stats = await trainingService.getTrainingStats(organizationId);

      return successResponse(res, stats, 'Training stats retrieved successfully');
    } catch (error) {
      logger.error('Get training stats error:', error);
      next(error);
    }
  }
}

export default new TrainingController();