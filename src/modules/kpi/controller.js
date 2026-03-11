import kpiService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class KPIController {
  /**
   * Get all KPIs
   */
  async getKPIs(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        group: req.query.group,
        isActive: req.query.isActive
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await kpiService.getKPIs(organizationId, filters, options);

      return successResponse(res, result.kpis, 'KPIs retrieved successfully')
        .json({
          success: true,
          data: result.kpis,
          pagination: result.pagination
        });
    } catch (error) {
      logger.error('Get KPIs error:', error);
      next(error);
    }
  }

  /**
   * Get KPI by ID
   */
  async getKPI(req, res, next) {
    try {
      const { organizationId } = req;
      const kpi = await kpiService.getKPIById(req.params.id, organizationId);

      if (!kpi) {
        return notFoundResponse(res, 'KPI');
      }

      return successResponse(res, kpi, 'KPI retrieved successfully');
    } catch (error) {
      logger.error('Get KPI error:', error);
      next(error);
    }
  }

  /**
   * Create KPI
   */
  async createKPI(req, res, next) {
    try {
      const { organizationId, user } = req;
      const kpi = await kpiService.createKPI({
        ...req.body,
        organizationId,
        createdBy: user._id
      });

      logger.info(`KPI created: ${kpi.kpiId} by user ${user._id}`);

      return createdResponse(res, kpi, 'KPI created successfully');
    } catch (error) {
      logger.error('Create KPI error:', error);
      next(error);
    }
  }

  /**
   * Update KPI
   */
  async updateKPI(req, res, next) {
    try {
      const { organizationId, user } = req;
      const kpi = await kpiService.updateKPI(
        req.params.id,
        organizationId,
        {
          ...req.body,
          updatedBy: user._id
        }
      );

      if (!kpi) {
        return notFoundResponse(res, 'KPI');
      }

      return successResponse(res, kpi, 'KPI updated successfully');
    } catch (error) {
      logger.error('Update KPI error:', error);
      next(error);
    }
  }

  /**
   * Deactivate KPI
   */
  async deactivateKPI(req, res, next) {
    try {
      const { organizationId } = req;
      const kpi = await kpiService.deactivateKPI(req.params.id, organizationId);

      if (!kpi) {
        return notFoundResponse(res, 'KPI');
      }

      return successResponse(res, kpi, 'KPI deactivated successfully');
    } catch (error) {
      logger.error('Deactivate KPI error:', error);
      next(error);
    }
  }

  /**
   * Get KPI groups
   */
  async getKPIGroups(req, res, next) {
    try {
      const { organizationId } = req;
      const groups = await kpiService.getKPIGroups(organizationId);

      return successResponse(res, groups, 'KPI groups retrieved successfully');
    } catch (error) {
      logger.error('Get KPI groups error:', error);
      next(error);
    }
  }
}

export default new KPIController();