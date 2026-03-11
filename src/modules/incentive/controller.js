import incentiveService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';
import { ROLES } from '../../config/constants.js';

class IncentiveController {
  /**
   * Get incentives
   */
  async getIncentives(req, res, next) {
    try {
      const { organizationId, user } = req;
      const filters = {
        employeeId: req.query.employeeId,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      // If employee role, only show their incentives
      if (user.role === ROLES.EMPLOYEE) {
        filters.employeeId = user.employeeId;
      }

      const result = await incentiveService.getIncentives(organizationId, filters, options);

      return successResponse(res, result.incentives, 'Incentives retrieved')
        .json({
          success: true,
          data: result.incentives,
          pagination: result.pagination
        });
    } catch (error) {
      logger.error('Get incentives error:', error);
      next(error);
    }
  }

  /**
   * Get payable incentives
   */
  async getPayableIncentives(req, res, next) {
    try {
      const { organizationId } = req;
      const { startDate, endDate } = req.query;

      const incentives = await incentiveService.getPayableIncentives(
        organizationId,
        startDate,
        endDate
      );

      return successResponse(res, incentives, 'Payable incentives retrieved');
    } catch (error) {
      logger.error('Get payable incentives error:', error);
      next(error);
    }
  }

  /**
   * Get incentive by ID
   */
  async getIncentive(req, res, next) {
    try {
      const { organizationId, user } = req;
      const incentive = await incentiveService.getIncentiveById(
        req.params.id,
        organizationId
      );

      if (!incentive) {
        return notFoundResponse(res, 'Incentive');
      }

      // Check access rights
      if (user.role === ROLES.EMPLOYEE &&
          incentive.employeeId.toString() !== user.employeeId?.toString()) {
        return errorResponse(res, 'Access denied', 403);
      }

      return successResponse(res, incentive, 'Incentive retrieved');
    } catch (error) {
      logger.error('Get incentive error:', error);
      next(error);
    }
  }

  /**
   * Create incentive
   */
  async createIncentive(req, res, next) {
    try {
      const { organizationId, user } = req;
      const incentive = await incentiveService.createIncentive({
        ...req.body,
        organizationId,
        createdBy: user._id
      });

      logger.info(`Incentive created: ${incentive._id} for employee ${req.body.employeeId}`);

      return createdResponse(res, incentive, 'Incentive created successfully');
    } catch (error) {
      logger.error('Create incentive error:', error);
      next(error);
    }
  }

  /**
   * Update incentive
   */
  async updateIncentive(req, res, next) {
    try {
      const { organizationId } = req;
      const incentive = await incentiveService.updateIncentive(
        req.params.id,
        organizationId,
        req.body
      );

      if (!incentive) {
        return notFoundResponse(res, 'Incentive');
      }

      return successResponse(res, incentive, 'Incentive updated');
    } catch (error) {
      logger.error('Update incentive error:', error);
      next(error);
    }
  }

  /**
   * Mark incentive as paid
   */
  async markAsPaid(req, res, next) {
    try {
      const { organizationId, user } = req;
      const incentive = await incentiveService.markAsPaid(
        req.params.id,
        organizationId,
        req.body.paymentReference
      );

      if (!incentive) {
        return notFoundResponse(res, 'Incentive');
      }

      logger.info(`Incentive paid: ${incentive._id} by user ${user._id}`);

      return successResponse(res, incentive, 'Incentive marked as paid');
    } catch (error) {
      logger.error('Mark incentive as paid error:', error);
      next(error);
    }
  }

  /**
   * Cancel incentive
   */
  async cancelIncentive(req, res, next) {
    try {
      const { organizationId, user } = req;
      const incentive = await incentiveService.cancelIncentive(
        req.params.id,
        organizationId,
        req.body.reason
      );

      if (!incentive) {
        return notFoundResponse(res, 'Incentive');
      }

      logger.info(`Incentive cancelled: ${incentive._id} by user ${user._id}`);

      return successResponse(res, incentive, 'Incentive cancelled');
    } catch (error) {
      logger.error('Cancel incentive error:', error);
      next(error);
    }
  }

  /**
   * Get employee incentive summary
   */
  async getEmployeeIncentiveSummary(req, res, next) {
    try {
      const { organizationId } = req;
      const { employeeId } = req.params;

      const summary = await incentiveService.getEmployeeIncentiveSummary(
        employeeId,
        organizationId
      );

      return successResponse(res, summary, 'Employee incentive summary retrieved');
    } catch (error) {
      logger.error('Get employee incentive summary error:', error);
      next(error);
    }
  }
}

export default new IncentiveController();