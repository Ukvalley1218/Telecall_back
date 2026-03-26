import interiorDesignerService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class InteriorDesignerController {
  /**
   * Get available designers (employees with design-related designations)
   */
  async getDesigners(req, res, next) {
    try {
      const { organizationId } = req;
      const designers = await interiorDesignerService.getDesigners(organizationId);

      return successResponse(res, designers, 'Designers retrieved successfully');
    } catch (error) {
      logger.error('Get designers error:', error);
      next(error);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await interiorDesignerService.getDashboardStats(organizationId);

      return successResponse(res, stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      next(error);
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(req, res, next) {
    try {
      const { organizationId } = req;
      const limit = parseInt(req.query.limit) || 10;
      const activities = await interiorDesignerService.getRecentActivities(organizationId, limit);

      return successResponse(res, activities, 'Recent activities retrieved successfully');
    } catch (error) {
      logger.error('Get recent activities error:', error);
      next(error);
    }
  }

  /**
   * Get all projects
   */
  async getProjects(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        stage: req.query.stage,
        status: req.query.status,
        priority: req.query.priority,
        assignedTo: req.query.assignedTo,
        search: req.query.search
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await interiorDesignerService.getProjects(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.projects,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Projects retrieved successfully'
      );
    } catch (error) {
      logger.error('Get projects error:', error);
      next(error);
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(req, res, next) {
    try {
      const { organizationId } = req;
      const project = await interiorDesignerService.getProjectById(req.params.id, organizationId);

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Project retrieved successfully');
    } catch (error) {
      logger.error('Get project error:', error);
      next(error);
    }
  }

  /**
   * Create project
   */
  async createProject(req, res, next) {
    try {
      const { organizationId, user } = req;
      const project = await interiorDesignerService.createProject(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Design project created: ${project.id} by user ${user._id}`);

      return createdResponse(res, project, 'Project created successfully');
    } catch (error) {
      logger.error('Create project error:', error);
      next(error);
    }
  }

  /**
   * Update project
   */
  async updateProject(req, res, next) {
    try {
      const { organizationId, user } = req;
      const project = await interiorDesignerService.updateProject(
        req.params.id,
        organizationId,
        req.body,
        user._id
      );

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Project updated successfully');
    } catch (error) {
      logger.error('Update project error:', error);
      next(error);
    }
  }

  /**
   * Update project stage
   */
  async updateProjectStage(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { stage } = req.body;

      const validStages = [
        'New Request',
        'Assigned',
        'Design In Progress',
        'Pending Review',
        'Client Review',
        'Revision',
        'Approved',
        'Completed'
      ];

      if (!validStages.includes(stage)) {
        return errorResponse(res, 'Invalid stage', 400);
      }

      const project = await interiorDesignerService.updateProjectStage(
        req.params.id,
        organizationId,
        stage,
        user._id
      );

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Project stage updated successfully');
    } catch (error) {
      logger.error('Update project stage error:', error);
      next(error);
    }
  }

  /**
   * Assign project to designer
   */
  async assignProject(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { designerId, designerName } = req.body;

      if (!designerId || !designerName) {
        return errorResponse(res, 'Designer ID and name are required', 400);
      }

      const project = await interiorDesignerService.assignProject(
        req.params.id,
        organizationId,
        designerId,
        designerName,
        user._id
      );

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Project assigned successfully');
    } catch (error) {
      logger.error('Assign project error:', error);
      next(error);
    }
  }

  /**
   * Delete project (soft delete)
   */
  async deleteProject(req, res, next) {
    try {
      const { organizationId } = req;
      const project = await interiorDesignerService.deleteProject(req.params.id, organizationId);

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Project cancelled successfully');
    } catch (error) {
      logger.error('Delete project error:', error);
      next(error);
    }
  }

  /**
   * Hard delete project
   */
  async hardDeleteProject(req, res, next) {
    try {
      const { organizationId } = req;
      const project = await interiorDesignerService.hardDeleteProject(req.params.id, organizationId);

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, null, 'Project deleted permanently');
    } catch (error) {
      logger.error('Hard delete project error:', error);
      next(error);
    }
  }

  /**
   * Get projects by designer
   */
  async getProjectsByDesigner(req, res, next) {
    try {
      const { organizationId } = req;
      const { designerId } = req.params;

      const projects = await interiorDesignerService.getProjectsByDesigner(organizationId, designerId);

      return successResponse(res, projects, 'Designer projects retrieved successfully');
    } catch (error) {
      logger.error('Get designer projects error:', error);
      next(error);
    }
  }

  /**
   * Get project statistics
   */
  async getProjectStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await interiorDesignerService.getProjectStats(organizationId);

      return successResponse(res, stats, 'Project stats retrieved successfully');
    } catch (error) {
      logger.error('Get project stats error:', error);
      next(error);
    }
  }

  /**
   * Get new project requests
   */
  async getNewProjectRequests(req, res, next) {
    try {
      const { organizationId } = req;
      const projects = await interiorDesignerService.getNewProjectRequests(organizationId);

      return successResponse(res, projects, 'New project requests retrieved successfully');
    } catch (error) {
      logger.error('Get new project requests error:', error);
      next(error);
    }
  }

  /**
   * Get design review projects (projects in Pending Review or Client Review stage)
   */
  async getDesignReviewProjects(req, res, next) {
    try {
      const { organizationId } = req;
      const { status } = req.query;

      const filters = { status };
      const projects = await interiorDesignerService.getDesignReviewProjects(organizationId, filters);

      return successResponse(res, projects, 'Design review projects retrieved successfully');
    } catch (error) {
      logger.error('Get design review projects error:', error);
      next(error);
    }
  }

  /**
   * Approve design (move to Approved stage)
   */
  async approveDesign(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { notes } = req.body;

      const project = await interiorDesignerService.approveDesign(
        id,
        organizationId,
        user._id,
        notes
      );

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Design approved successfully');
    } catch (error) {
      logger.error('Approve design error:', error);
      next(error);
    }
  }

  /**
   * Request redesign (move to Revision stage with feedback)
   */
  async requestRedesign(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { feedback, attachmentUrl } = req.body;

      if (!feedback) {
        return errorResponse(res, 'Feedback is required', 400);
      }

      const project = await interiorDesignerService.requestRedesign(
        id,
        organizationId,
        user._id,
        feedback,
        attachmentUrl
      );

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Redesign requested successfully');
    } catch (error) {
      logger.error('Request redesign error:', error);
      next(error);
    }
  }

  /**
   * Get projects for client approval (Pending Review stage - ready to send to client)
   */
  async getClientApprovalProjects(req, res, next) {
    try {
      const { organizationId } = req;
      const projects = await interiorDesignerService.getClientApprovalProjects(organizationId);

      return successResponse(res, projects, 'Client approval projects retrieved successfully');
    } catch (error) {
      logger.error('Get client approval projects error:', error);
      next(error);
    }
  }

  /**
   * Send design to client (move from Pending Review to Client Review)
   */
  async sendToClient(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { message } = req.body;

      const project = await interiorDesignerService.sendToClient(
        id,
        organizationId,
        user._id,
        message
      );

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Design sent to client successfully');
    } catch (error) {
      logger.error('Send to client error:', error);
      next(error);
    }
  }

  /**
   * Upload design PDF (for client approval)
   */
  async uploadDesignPdf(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { name, url } = req.body;

      if (!url) {
        return errorResponse(res, 'PDF URL is required', 400);
      }

      const project = await interiorDesignerService.uploadDesignPdf(
        id,
        organizationId,
        { name, url },
        user._id
      );

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Design PDF uploaded successfully');
    } catch (error) {
      logger.error('Upload design PDF error:', error);
      next(error);
    }
  }

  /**
   * Upload final PDF (with measurements, after client approval)
   */
  async uploadFinalPdf(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { name, url } = req.body;

      if (!url) {
        return errorResponse(res, 'PDF URL is required', 400);
      }

      const project = await interiorDesignerService.uploadFinalPdf(
        id,
        organizationId,
        { name, url },
        user._id
      );

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Final PDF uploaded successfully');
    } catch (error) {
      logger.error('Upload final PDF error:', error);
      next(error);
    }
  }

  /**
   * Client approve design (HOD approves on behalf of client)
   */
  async clientApprove(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { notes } = req.body;

      const project = await interiorDesignerService.clientApprove(
        id,
        organizationId,
        user._id,
        notes
      );

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Design approved by client successfully');
    } catch (error) {
      logger.error('Client approve error:', error);
      next(error);
    }
  }

  /**
   * Reject design (client rejects)
   */
  async clientReject(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return errorResponse(res, 'Rejection reason is required', 400);
      }

      const project = await interiorDesignerService.clientReject(
        id,
        organizationId,
        user._id,
        reason
      );

      if (!project) {
        return notFoundResponse(res, 'Project');
      }

      return successResponse(res, project, 'Design rejected successfully');
    } catch (error) {
      logger.error('Client reject error:', error);
      next(error);
    }
  }
}

export default new InteriorDesignerController();