import salesService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class SalesController {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req, res, next) {
    try {
      const { organizationId } = req;
      const { startDate, endDate, department } = req.query;

      const stats = await salesService.getDashboardStats(organizationId, {
        startDate,
        endDate,
        department
      });

      return successResponse(res, stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      next(error);
    }
  }

  /**
   * Get pipeline data (leads by stage)
   */
  async getPipeline(req, res, next) {
    try {
      const { organizationId } = req;
      const pipeline = await salesService.getLeadsByStage(organizationId);

      return successResponse(res, pipeline, 'Pipeline data retrieved successfully');
    } catch (error) {
      logger.error('Get pipeline error:', error);
      next(error);
    }
  }

  /**
   * Get all leads
   */
  async getLeads(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        stage: req.query.stage,
        leadType: req.query.leadType,
        status: req.query.status,
        search: req.query.search,
        assignedTo: req.query.assignedTo
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await salesService.getLeads(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.leads,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Leads retrieved successfully'
      );
    } catch (error) {
      logger.error('Get leads error:', error);
      next(error);
    }
  }

  /**
   * Get lead by ID
   */
  async getLeadById(req, res, next) {
    try {
      const { organizationId } = req;
      const lead = await salesService.getLeadById(req.params.id, organizationId);

      if (!lead) {
        return notFoundResponse(res, 'Lead');
      }

      return successResponse(res, lead, 'Lead retrieved successfully');
    } catch (error) {
      logger.error('Get lead error:', error);
      next(error);
    }
  }

  /**
   * Create lead
   */
  async createLead(req, res, next) {
    try {
      const { organizationId, user } = req;
      const lead = await salesService.createLead(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Lead created: ${lead._id} by user ${user._id}`);

      return createdResponse(res, lead, 'Lead created successfully');
    } catch (error) {
      logger.error('Create lead error:', error);
      next(error);
    }
  }

  /**
   * Update lead
   */
  async updateLead(req, res, next) {
    try {
      const { organizationId } = req;
      const lead = await salesService.updateLead(
        req.params.id,
        organizationId,
        req.body
      );

      if (!lead) {
        return notFoundResponse(res, 'Lead');
      }

      return successResponse(res, lead, 'Lead updated successfully');
    } catch (error) {
      logger.error('Update lead error:', error);
      next(error);
    }
  }

  /**
   * Move lead to different stage
   */
  async moveLeadStage(req, res, next) {
    try {
      const { organizationId } = req;
      const { stage } = req.body;

      if (!stage) {
        return errorResponse(res, 'Stage is required', 400);
      }

      const lead = await salesService.moveLeadStage(
        req.params.id,
        organizationId,
        stage
      );

      if (!lead) {
        return notFoundResponse(res, 'Lead');
      }

      return successResponse(res, lead, 'Lead stage updated successfully');
    } catch (error) {
      logger.error('Move lead stage error:', error);
      next(error);
    }
  }

  /**
   * Toggle lead type
   */
  async toggleLeadType(req, res, next) {
    try {
      const { organizationId } = req;
      const lead = await salesService.toggleLeadType(
        req.params.id,
        organizationId
      );

      if (!lead) {
        return notFoundResponse(res, 'Lead');
      }

      return successResponse(res, lead, 'Lead type updated successfully');
    } catch (error) {
      logger.error('Toggle lead type error:', error);
      next(error);
    }
  }

  /**
   * Delete lead (archive)
   */
  async deleteLead(req, res, next) {
    try {
      const { organizationId } = req;
      const lead = await salesService.deleteLead(req.params.id, organizationId);

      if (!lead) {
        return notFoundResponse(res, 'Lead');
      }

      return successResponse(res, lead, 'Lead archived successfully');
    } catch (error) {
      logger.error('Delete lead error:', error);
      next(error);
    }
  }

  /**
   * Hard delete lead
   */
  async hardDeleteLead(req, res, next) {
    try {
      const { organizationId } = req;
      const lead = await salesService.hardDeleteLead(req.params.id, organizationId);

      if (!lead) {
        return notFoundResponse(res, 'Lead');
      }

      return successResponse(res, null, 'Lead deleted permanently');
    } catch (error) {
      logger.error('Hard delete lead error:', error);
      next(error);
    }
  }

  /**
   * Get quotations
   */
  async getQuotations(req, res, next) {
    try {
      const { organizationId } = req;
      // Normalize status filter to handle case-insensitive input
      const statusMap = {
        'draft': 'Draft',
        'sent': 'Sent',
        'pending': 'Pending',
        'negotiation': 'Negotiation',
        'accepted': 'Accepted',
        'rejected': 'Rejected',
        'expired': 'Expired'
      };
      const status = req.query.status;
      const normalizedStatus = status && status !== 'all'
        ? (statusMap[status.toLowerCase()] || status)
        : status;

      const filters = {
        status: normalizedStatus,
        search: req.query.search
      };

      const quotations = await salesService.getQuotations(organizationId, filters);

      return successResponse(res, quotations, 'Quotations retrieved successfully');
    } catch (error) {
      logger.error('Get quotations error:', error);
      next(error);
    }
  }

  /**
   * Get quotation by ID
   */
  async getQuotationById(req, res, next) {
    try {
      const { organizationId } = req;
      const quotation = await salesService.getQuotationById(req.params.id, organizationId);

      if (!quotation) {
        return notFoundResponse(res, 'Quotation');
      }

      return successResponse(res, quotation, 'Quotation retrieved successfully');
    } catch (error) {
      logger.error('Get quotation error:', error);
      next(error);
    }
  }

  /**
   * Create quotation
   */
  async createQuotation(req, res, next) {
    try {
      const { organizationId, user } = req;
      const quotation = await salesService.createQuotation(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Quotation created: ${quotation.id} by user ${user._id}`);

      return createdResponse(res, quotation, 'Quotation created successfully');
    } catch (error) {
      logger.error('Create quotation error:', error);
      next(error);
    }
  }

  /**
   * Update quotation
   */
  async updateQuotation(req, res, next) {
    try {
      const { organizationId, user } = req;
      const quotation = await salesService.updateQuotation(
        req.params.id,
        organizationId,
        req.body,
        user._id
      );

      if (!quotation) {
        return notFoundResponse(res, 'Quotation');
      }

      return successResponse(res, quotation, 'Quotation updated successfully');
    } catch (error) {
      logger.error('Update quotation error:', error);
      next(error);
    }
  }

  /**
   * Update quotation status
   */
  async updateQuotationStatus(req, res, next) {
    try {
      const { organizationId } = req;
      const { status, notes } = req.body;

      const validStatuses = ['Draft', 'Sent', 'Pending', 'Negotiation', 'Accepted', 'Rejected', 'Expired'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 'Invalid status', 400);
      }

      const quotation = await salesService.updateQuotationStatus(
        req.params.id,
        organizationId,
        status,
        notes
      );

      if (!quotation) {
        return notFoundResponse(res, 'Quotation');
      }

      return successResponse(res, quotation, 'Quotation status updated successfully');
    } catch (error) {
      logger.error('Update quotation status error:', error);
      next(error);
    }
  }

  /**
   * Delete quotation
   */
  async deleteQuotation(req, res, next) {
    try {
      const { organizationId } = req;
      const quotation = await salesService.deleteQuotation(req.params.id, organizationId);

      if (!quotation) {
        return notFoundResponse(res, 'Quotation');
      }

      return successResponse(res, null, 'Quotation deleted successfully');
    } catch (error) {
      logger.error('Delete quotation error:', error);
      next(error);
    }
  }

  /**
   * Get quotation statistics
   */
  async getQuotationStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await salesService.getQuotationStats(organizationId);

      return successResponse(res, stats, 'Quotation stats retrieved successfully');
    } catch (error) {
      logger.error('Get quotation stats error:', error);
      next(error);
    }
  }

  /**
   * Get client milestones
   */
  async getClientMilestones(req, res, next) {
    try {
      const { organizationId } = req;
      const milestones = await salesService.getClientMilestones(organizationId);

      return successResponse(res, milestones, 'Client milestones retrieved successfully');
    } catch (error) {
      logger.error('Get client milestones error:', error);
      next(error);
    }
  }

  /**
   * Get critical alerts
   */
  async getCriticalAlerts(req, res, next) {
    try {
      const { organizationId } = req;
      const alerts = await salesService.getCriticalAlerts(organizationId);

      return successResponse(res, alerts, 'Critical alerts retrieved successfully');
    } catch (error) {
      logger.error('Get critical alerts error:', error);
      next(error);
    }
  }

  // ==================== MILESTONE ENDPOINTS ====================

  /**
   * Get all milestones
   */
  async getMilestones(req, res, next) {
    try {
      const { organizationId } = req;
      const { salesLeadId } = req.query;

      const milestones = await salesService.getMilestones(organizationId, salesLeadId);

      return successResponse(res, milestones, 'Milestones retrieved successfully');
    } catch (error) {
      logger.error('Get milestones error:', error);
      next(error);
    }
  }

  /**
   * Get milestone by ID
   */
  async getMilestoneById(req, res, next) {
    try {
      const { organizationId } = req;
      const milestone = await salesService.getMilestoneById(req.params.id, organizationId);

      if (!milestone) {
        return notFoundResponse(res, 'Milestone');
      }

      return successResponse(res, milestone, 'Milestone retrieved successfully');
    } catch (error) {
      logger.error('Get milestone error:', error);
      next(error);
    }
  }

  /**
   * Create milestone
   */
  async createMilestone(req, res, next) {
    try {
      const { organizationId, user } = req;
      const milestone = await salesService.createMilestone(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Milestone created: ${milestone.id} by user ${user._id}`);

      return createdResponse(res, milestone, 'Milestone created successfully');
    } catch (error) {
      logger.error('Create milestone error:', error);
      next(error);
    }
  }

  /**
   * Update milestone
   */
  async updateMilestone(req, res, next) {
    try {
      const { organizationId } = req;
      const milestone = await salesService.updateMilestone(
        req.params.id,
        organizationId,
        req.body
      );

      if (!milestone) {
        return notFoundResponse(res, 'Milestone');
      }

      return successResponse(res, milestone, 'Milestone updated successfully');
    } catch (error) {
      logger.error('Update milestone error:', error);
      next(error);
    }
  }

  /**
   * Update milestone status
   */
  async updateMilestoneStatus(req, res, next) {
    try {
      const { organizationId } = req;
      const { status, paymentStatus } = req.body;

      const milestone = await salesService.updateMilestoneStatus(
        req.params.id,
        organizationId,
        status,
        paymentStatus
      );

      if (!milestone) {
        return notFoundResponse(res, 'Milestone');
      }

      return successResponse(res, milestone, 'Milestone status updated successfully');
    } catch (error) {
      logger.error('Update milestone status error:', error);
      next(error);
    }
  }

  /**
   * Delete milestone
   */
  async deleteMilestone(req, res, next) {
    try {
      const { organizationId } = req;
      const milestone = await salesService.deleteMilestone(req.params.id, organizationId);

      if (!milestone) {
        return notFoundResponse(res, 'Milestone');
      }

      return successResponse(res, null, 'Milestone deleted successfully');
    } catch (error) {
      logger.error('Delete milestone error:', error);
      next(error);
    }
  }

  /**
   * Get milestones for won deals
   */
  async getWonDealMilestones(req, res, next) {
    try {
      const { organizationId } = req;
      const milestones = await salesService.getWonDealMilestones(organizationId);

      return successResponse(res, milestones, 'Won deal milestones retrieved successfully');
    } catch (error) {
      logger.error('Get won deal milestones error:', error);
      next(error);
    }
  }

  /**
   * Get milestone statistics
   */
  async getMilestoneStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await salesService.getMilestoneStats(organizationId);

      return successResponse(res, stats, 'Milestone stats retrieved successfully');
    } catch (error) {
      logger.error('Get milestone stats error:', error);
      next(error);
    }
  }

  /**
   * Get sales report
   */
  async getSalesReport(req, res, next) {
    try {
      const { organizationId } = req;
      const { period } = req.query;

      const report = await salesService.getSalesReport(organizationId, period);

      return successResponse(res, report, 'Sales report retrieved successfully');
    } catch (error) {
      logger.error('Get sales report error:', error);
      next(error);
    }
  }
}

export default new SalesController();