import recruitmentService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class RecruitmentController {
  /**
   * Apply for position (public route)
   */
  async apply(req, res, next) {
    try {
      const candidateData = {
        ...req.body,
        resumeUrl: req.file ? `/uploads/resumes/${req.file.filename}` : null
      };

      const candidate = await recruitmentService.applyForPosition(candidateData);

      logger.info(`New candidate applied: ${candidate.email} for ${candidate.position}`);

      return createdResponse(res, candidate, 'Application submitted successfully');
    } catch (error) {
      logger.error('Application error:', error);
      next(error);
    }
  }

  /**
   * Get all candidates (HR)
   */
  async getCandidates(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status,
        department: req.query.department,
        position: req.query.position,
        search: req.query.search
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'appliedAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await recruitmentService.getCandidates(organizationId, filters, options);

      return successResponse(res, result.candidates, 'Candidates retrieved successfully')
        .json({
          ...result.candidates,
          pagination: result.pagination
        });
    } catch (error) {
      logger.error('Get candidates error:', error);
      next(error);
    }
  }

  /**
   * Get candidate by ID
   */
  async getCandidate(req, res, next) {
    try {
      const { organizationId } = req;
      const candidate = await recruitmentService.getCandidateById(req.params.id, organizationId);

      if (!candidate) {
        return notFoundResponse(res, 'Candidate');
      }

      return successResponse(res, candidate, 'Candidate retrieved successfully');
    } catch (error) {
      logger.error('Get candidate error:', error);
      next(error);
    }
  }

  /**
   * Get pipeline statistics
   */
  async getPipelineStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await recruitmentService.getPipelineStatistics(organizationId);

      return successResponse(res, stats, 'Pipeline statistics retrieved successfully');
    } catch (error) {
      logger.error('Get pipeline stats error:', error);
      next(error);
    }
  }

  /**
   * Shortlist candidate
   */
  async shortlistCandidate(req, res, next) {
    try {
      const { organizationId, user } = req;
      const candidate = await recruitmentService.updateStatus(
        req.params.id,
        organizationId,
        'shortlisted',
        user._id
      );

      if (!candidate) {
        return notFoundResponse(res, 'Candidate');
      }

      return successResponse(res, candidate, 'Candidate shortlisted successfully');
    } catch (error) {
      logger.error('Shortlist candidate error:', error);
      next(error);
    }
  }

  /**
   * Add screening notes
   */
  async addScreeningNotes(req, res, next) {
    try {
      const { organizationId, user } = req;
      const candidate = await recruitmentService.addScreeningNote(
        req.params.id,
        organizationId,
        req.body.note,
        user._id
      );

      if (!candidate) {
        return notFoundResponse(res, 'Candidate');
      }

      return successResponse(res, candidate, 'Screening note added successfully');
    } catch (error) {
      logger.error('Add screening note error:', error);
      next(error);
    }
  }

  /**
   * Schedule interview
   */
  async scheduleInterview(req, res, next) {
    try {
      const { organizationId, user } = req;
      const interviewData = {
        scheduledAt: req.body.scheduledAt,
        interviewer: req.body.interviewer,
        location: req.body.location,
        notes: req.body.notes
      };

      const candidate = await recruitmentService.scheduleInterview(
        req.params.id,
        organizationId,
        interviewData,
        user._id
      );

      if (!candidate) {
        return notFoundResponse(res, 'Candidate');
      }

      return successResponse(res, candidate, 'Interview scheduled successfully');
    } catch (error) {
      logger.error('Schedule interview error:', error);
      next(error);
    }
  }

  /**
   * Select candidate
   */
  async selectCandidate(req, res, next) {
    try {
      const { organizationId, user } = req;
      const candidate = await recruitmentService.updateStatus(
        req.params.id,
        organizationId,
        'selected',
        user._id,
        req.body.notes
      );

      if (!candidate) {
        return notFoundResponse(res, 'Candidate');
      }

      return successResponse(res, candidate, 'Candidate selected successfully');
    } catch (error) {
      logger.error('Select candidate error:', error);
      next(error);
    }
  }

  /**
   * Start training
   */
  async startTraining(req, res, next) {
    try {
      const { organizationId, user } = req;
      const trainingData = {
        startDate: req.body.startDate,
        days: req.body.days,
        notes: req.body.notes
      };

      const candidate = await recruitmentService.startTraining(
        req.params.id,
        organizationId,
        trainingData,
        user._id
      );

      if (!candidate) {
        return notFoundResponse(res, 'Candidate');
      }

      return successResponse(res, candidate, 'Training started successfully');
    } catch (error) {
      logger.error('Start training error:', error);
      next(error);
    }
  }

  /**
   * Complete training
   */
  async completeTraining(req, res, next) {
    try {
      const { organizationId, user } = req;
      const candidate = await recruitmentService.completeTraining(
        req.params.id,
        organizationId,
        req.body.notes,
        user._id
      );

      if (!candidate) {
        return notFoundResponse(res, 'Candidate');
      }

      return successResponse(res, candidate, 'Training completed successfully');
    } catch (error) {
      logger.error('Complete training error:', error);
      next(error);
    }
  }

  /**
   * Send offer letter
   */
  async sendOfferLetter(req, res, next) {
    try {
      const { organizationId, user } = req;
      const offerData = {
        position: req.body.position,
        department: req.body.department,
        salary: req.body.salary,
        joiningDate: req.body.joiningDate,
        probationPeriod: req.body.probationPeriod
      };

      const result = await recruitmentService.sendOfferLetter(
        req.params.id,
        organizationId,
        offerData,
        user._id
      );

      if (!result) {
        return notFoundResponse(res, 'Candidate');
      }

      return successResponse(res, result, 'Offer letter sent successfully');
    } catch (error) {
      logger.error('Send offer letter error:', error);
      next(error);
    }
  }

  /**
   * Reject candidate
   */
  async rejectCandidate(req, res, next) {
    try {
      const { organizationId, user } = req;
      const candidate = await recruitmentService.rejectCandidate(
        req.params.id,
        organizationId,
        req.body.reason,
        user._id
      );

      if (!candidate) {
        return notFoundResponse(res, 'Candidate');
      }

      return successResponse(res, candidate, 'Candidate rejected');
    } catch (error) {
      logger.error('Reject candidate error:', error);
      next(error);
    }
  }

  /**
   * Get offer letter for candidate
   */
  async getOfferLetter(req, res, next) {
    try {
      const { organizationId } = req;
      const offerLetter = await recruitmentService.getOfferLetterByCandidate(
        req.params.id,
        organizationId
      );

      if (!offerLetter) {
        return notFoundResponse(res, 'Offer letter');
      }

      return successResponse(res, offerLetter, 'Offer letter retrieved successfully');
    } catch (error) {
      logger.error('Get offer letter error:', error);
      next(error);
    }
  }
}

export default new RecruitmentController();