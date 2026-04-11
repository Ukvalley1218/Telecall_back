import telecallingService from './service.js';
import { successResponse, errorResponse, createdResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class TelecallingController {
  // ==================== CAMPAIGN CONTROLLERS ====================

  /**
   * Get all campaigns
   */
  async getCampaigns(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const { page, limit, status, priority, assignedTo } = req.query;

      const result = await telecallingService.getCampaigns(organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        priority,
        assignedTo
      });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return res.status(200).json({
        success: true,
        message: 'Campaigns retrieved successfully',
        data: result.campaigns,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get campaigns error:', error);
      next(error);
    }
  }

  /**
   * Get my campaigns
   */
  async getMyCampaigns(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { page, limit } = req.query;

      const result = await telecallingService.getMyCampaigns(userId, organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return res.status(200).json({
        success: true,
        message: 'My campaigns retrieved successfully',
        data: result.campaigns,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get my campaigns error:', error);
      next(error);
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId;

      const result = await telecallingService.getCampaignById(id, organizationId);

      if (!result.success) {
        return errorResponse(res, result.message, 404);
      }

      return successResponse(res, result.campaign, 'Campaign retrieved successfully');
    } catch (error) {
      logger.error('Get campaign error:', error);
      next(error);
    }
  }

  /**
   * Create campaign
   */
  async createCampaign(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user._id;

      const result = await telecallingService.createCampaign(organizationId, userId, req.body);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      logger.info(`Campaign created: ${result.campaign._id} by user ${userId}`);

      return createdResponse(res, result.campaign, 'Campaign created successfully');
    } catch (error) {
      logger.error('Create campaign error:', error);
      next(error);
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId;

      const result = await telecallingService.updateCampaign(id, organizationId, req.body);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.campaign, 'Campaign updated successfully');
    } catch (error) {
      logger.error('Update campaign error:', error);
      next(error);
    }
  }

  // ==================== LEAD CONTROLLERS ====================

  /**
   * Get leads by category
   */
  async getLeadsByCategory(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user.role === 'telecaller' ? req.user._id : null;
      const { category, page, limit } = req.query;

      const result = await telecallingService.getLeadsByCategory(organizationId, userId, category, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return res.status(200).json({
        success: true,
        message: 'Leads retrieved successfully',
        data: result.leads,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get leads error:', error);
      next(error);
    }
  }

  /**
   * Get my leads
   */
  async getMyLeads(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { page, limit, status, stage, campaignId, search } = req.query;

      const result = await telecallingService.getMyLeads(userId, organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        stage,
        campaignId,
        search
      });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return res.status(200).json({
        success: true,
        message: 'My leads retrieved successfully',
        data: result.leads,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get my leads error:', error);
      next(error);
    }
  }

  /**
   * Get lead by ID
   */
  async getLeadById(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId;

      const result = await telecallingService.getLeadById(id, organizationId);

      if (!result.success) {
        return errorResponse(res, result.message, 404);
      }

      return successResponse(res, result.lead, 'Lead retrieved successfully');
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
      const organizationId = req.organizationId;
      const userId = req.user._id;

      const result = await telecallingService.createLead(organizationId, userId, req.body);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      logger.info(`Lead created: ${result.lead._id} by user ${userId}`);

      return createdResponse(res, result.lead, 'Lead created successfully');
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
      const { id } = req.params;
      const organizationId = req.organizationId;
      const userId = req.user._id;

      const result = await telecallingService.updateLead(id, organizationId, req.body, userId);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.lead, 'Lead updated successfully');
    } catch (error) {
      logger.error('Update lead error:', error);
      next(error);
    }
  }

  /**
   * Dispose lead
   */
  async disposeLead(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.organizationId;
      const userId = req.user._id;

      const result = await telecallingService.disposeLead(id, organizationId, userId, req.body);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.lead, 'Lead disposed successfully');
    } catch (error) {
      logger.error('Dispose lead error:', error);
      next(error);
    }
  }

  /**
   * Get lead category counts
   */
  async getLeadCategoryCounts(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user.role === 'telecaller' ? req.user._id : null;

      const result = await telecallingService.getLeadCategoryCounts(organizationId, userId);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.counts, 'Lead counts retrieved successfully');
    } catch (error) {
      logger.error('Get lead counts error:', error);
      next(error);
    }
  }

  // ==================== CALL LOG CONTROLLERS ====================

  /**
   * Create call log
   */
  async createCallLog(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user._id;

      const result = await telecallingService.createCallLog(organizationId, userId, req.body);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      logger.info(`Call log created: ${result.callLog._id} by user ${userId}`);

      return createdResponse(res, result.callLog, 'Call log created successfully');
    } catch (error) {
      logger.error('Create call log error:', error);
      next(error);
    }
  }

  /**
   * Get call logs
   */
  async getCallLogs(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { page, limit, callType, status, startDate, endDate } = req.query;

      const result = await telecallingService.getCallLogs(userId, organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        callType,
        status,
        startDate,
        endDate
      });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return res.status(200).json({
        success: true,
        message: 'Call logs retrieved successfully',
        data: result.callLogs,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get call logs error:', error);
      next(error);
    }
  }

  /**
   * Get call statistics
   */
  async getCallStatistics(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user.role === 'telecaller' ? req.user._id : null;
      const { startDate, endDate } = req.query;

      const result = await telecallingService.getCallStatistics(organizationId, userId, startDate, endDate);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.stats, 'Call statistics retrieved successfully');
    } catch (error) {
      logger.error('Get call stats error:', error);
      next(error);
    }
  }

  // ==================== TASK CONTROLLERS ====================

  /**
   * Get my tasks
   */
  async getMyTasks(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { page, limit, status, type, dueToday } = req.query;

      const result = await telecallingService.getMyTasks(userId, organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        type,
        dueToday: dueToday === 'true'
      });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: result.tasks,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get tasks error:', error);
      next(error);
    }
  }

  /**
   * Get today's tasks
   */
  async getTodayTasks(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;

      const result = await telecallingService.getTodayTasks(userId, organizationId);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.tasks, 'Today tasks retrieved successfully');
    } catch (error) {
      logger.error('Get today tasks error:', error);
      next(error);
    }
  }

  /**
   * Create task
   */
  async createTask(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user._id;

      const result = await telecallingService.createTask(organizationId, userId, req.body);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      logger.info(`Task created: ${result.task._id} by user ${userId}`);

      return createdResponse(res, result.task, 'Task created successfully');
    } catch (error) {
      logger.error('Create task error:', error);
      next(error);
    }
  }

  /**
   * Complete task
   */
  async completeTask(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const { notes } = req.body;

      const result = await telecallingService.completeTask(id, userId, notes);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.task, 'Task completed successfully');
    } catch (error) {
      logger.error('Complete task error:', error);
      next(error);
    }
  }

  // ==================== FOLLOW-UP CONTROLLERS ====================

  /**
   * Create follow-up
   */
  async createFollowUp(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user._id;

      const result = await telecallingService.createFollowUp(organizationId, userId, req.body);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      logger.info(`Follow-up created: ${result.followUp._id} by user ${userId}`);

      return createdResponse(res, result.followUp, 'Follow-up created successfully');
    } catch (error) {
      logger.error('Create follow-up error:', error);
      next(error);
    }
  }

  /**
   * Get follow-ups
   */
  async getFollowUps(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { page, limit, status, startDate, endDate } = req.query;

      const result = await telecallingService.getFollowUps(userId, organizationId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        startDate,
        endDate
      });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return res.status(200).json({
        success: true,
        message: 'Follow-ups retrieved successfully',
        data: result.followUps,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get follow-ups error:', error);
      next(error);
    }
  }

  /**
   * Get today's follow-ups
   */
  async getTodayFollowUps(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;

      const result = await telecallingService.getTodayFollowUps(userId, organizationId);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.followUps, 'Today follow-ups retrieved successfully');
    } catch (error) {
      logger.error('Get today follow-ups error:', error);
      next(error);
    }
  }

  // ==================== DASHBOARD CONTROLLERS ====================

  /**
   * Get dashboard stats
   */
  async getDashboardStats(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user._id;

      const result = await telecallingService.getDashboardStats(organizationId, userId);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      next(error);
    }
  }

  /**
   * Get daily report
   */
  async getDailyReport(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user._id;
      const { date } = req.query;

      const result = await telecallingService.getDailyReport(organizationId, userId, date);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.report, 'Daily report retrieved successfully');
    } catch (error) {
      logger.error('Get daily report error:', error);
      next(error);
    }
  }

  // ==================== ATTENDANCE CONTROLLERS ====================

  /**
   * Telecaller check-in
   */
  async telecallerCheckIn(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user._id;
      const { location } = req.body;

      const result = await telecallingService.telecallerCheckIn(organizationId, userId, { location });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      logger.info(`Telecaller check-in: User ${userId} at ${result.attendance.checkIn.time}`);

      return createdResponse(res, result.attendance, 'Check-in recorded successfully');
    } catch (error) {
      logger.error('Telecaller check-in error:', error);
      next(error);
    }
  }

  /**
   * Telecaller check-out
   */
  async telecallerCheckOut(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user._id;
      const { location } = req.body;

      const result = await telecallingService.telecallerCheckOut(organizationId, userId, { location });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      logger.info(`Telecaller check-out: User ${userId} at ${result.attendance.checkOut.time}`);

      return successResponse(res, result.attendance, 'Check-out recorded successfully');
    } catch (error) {
      logger.error('Telecaller check-out error:', error);
      next(error);
    }
  }

  /**
   * Get today's attendance for telecaller
   */
  async getTelecallerTodayAttendance(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const userId = req.user._id;

      const result = await telecallingService.getTelecallerTodayAttendance(organizationId, userId);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, result.attendance, 'Today attendance retrieved successfully');
    } catch (error) {
      logger.error('Get telecaller today attendance error:', error);
      next(error);
    }
  }
}

export default new TelecallingController();