import marketingService from './service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class MarketingController {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await marketingService.getDashboardStats(organizationId);

      return successResponse(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      next(error);
    }
  }

  /**
   * Get lead generation data (for chart)
   */
  async getLeadGenerationData(req, res, next) {
    try {
      const { organizationId } = req;
      const { period = 'week', startDate, endDate } = req.query;

      const data = await marketingService.getLeadGenerationData(
        organizationId,
        period,
        startDate,
        endDate
      );

      return successResponse(res, data, 'Lead generation data retrieved successfully');
    } catch (error) {
      logger.error('Get lead generation data error:', error);
      next(error);
    }
  }

  /**
   * Get campaign ROI data (for chart)
   */
  async getCampaignROIData(req, res, next) {
    try {
      const { organizationId } = req;
      const { limit = 5 } = req.query;

      const data = await marketingService.getCampaignROIData(organizationId, parseInt(limit));

      return successResponse(res, data, 'Campaign ROI data retrieved successfully');
    } catch (error) {
      logger.error('Get campaign ROI data error:', error);
      next(error);
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(req, res, next) {
    try {
      const { organizationId } = req;
      const { limit = 5 } = req.query;

      const data = await marketingService.getRecentActivity(organizationId, parseInt(limit));

      return successResponse(res, data, 'Recent activity retrieved successfully');
    } catch (error) {
      logger.error('Get recent activity error:', error);
      next(error);
    }
  }

  /**
   * Get campaign comparison data
   */
  async getCampaignComparison(req, res, next) {
    try {
      const { organizationId } = req;
      const data = await marketingService.getCampaignComparison(organizationId);

      return successResponse(res, data, 'Campaign comparison retrieved successfully');
    } catch (error) {
      logger.error('Get campaign comparison error:', error);
      next(error);
    }
  }

  /**
   * Get source-wise lead breakdown
   */
  async getLeadsBySource(req, res, next) {
    try {
      const { organizationId } = req;
      const { startDate, endDate } = req.query;

      const data = await marketingService.getLeadsBySource(
        organizationId,
        startDate,
        endDate
      );

      return successResponse(res, data, 'Leads by source retrieved successfully');
    } catch (error) {
      logger.error('Get leads by source error:', error);
      next(error);
    }
  }
}

export default new MarketingController();