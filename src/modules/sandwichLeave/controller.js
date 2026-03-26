import sandwichLeaveService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class SandwichLeaveController {
  /**
   * Get sandwich leaves
   */
  async getSandwichLeaves(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        employeeId: req.query.employeeId,
        status: req.query.status
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await sandwichLeaveService.getSandwichLeaves(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.leaves,
        options.page,
        options.limit,
        result.pagination.total,
        'Sandwich leaves retrieved'
      );
    } catch (error) {
      logger.error('Get sandwich leaves error:', error);
      next(error);
    }
  }

  /**
   * Get sandwich leave by ID
   */
  async getSandwichLeave(req, res, next) {
    try {
      const { organizationId } = req;
      const leave = await sandwichLeaveService.getSandwichLeaveById(
        req.params.id,
        organizationId
      );

      if (!leave) {
        return notFoundResponse(res, 'Sandwich leave');
      }

      return successResponse(res, leave, 'Sandwich leave retrieved');
    } catch (error) {
      logger.error('Get sandwich leave error:', error);
      next(error);
    }
  }

  /**
   * Create sandwich leave
   */
  async createSandwichLeave(req, res, next) {
    try {
      const { organizationId, user } = req;
      const leave = await sandwichLeaveService.createSandwichLeave({
        ...req.body,
        organizationId,
        createdBy: user._id
      });

      logger.info(`Sandwich leave created: ${leave._id} for employee ${req.body.employeeId}`);

      return createdResponse(res, leave, 'Sandwich leave created successfully');
    } catch (error) {
      logger.error('Create sandwich leave error:', error);
      next(error);
    }
  }

  /**
   * Approve sandwich leave
   */
  async approveSandwichLeave(req, res, next) {
    try {
      const { organizationId, user } = req;
      const leave = await sandwichLeaveService.approveSandwichLeave(
        req.params.id,
        organizationId,
        user._id
      );

      if (!leave) {
        return notFoundResponse(res, 'Sandwich leave');
      }

      logger.info(`Sandwich leave approved: ${leave._id} by user ${user._id}`);

      return successResponse(res, leave, 'Sandwich leave approved');
    } catch (error) {
      logger.error('Approve sandwich leave error:', error);
      next(error);
    }
  }

  /**
   * Reject sandwich leave
   */
  async rejectSandwichLeave(req, res, next) {
    try {
      const { organizationId, user } = req;
      const leave = await sandwichLeaveService.rejectSandwichLeave(
        req.params.id,
        organizationId,
        user._id,
        req.body.reason
      );

      if (!leave) {
        return notFoundResponse(res, 'Sandwich leave');
      }

      logger.info(`Sandwich leave rejected: ${leave._id} by user ${user._id}`);

      return successResponse(res, leave, 'Sandwich leave rejected');
    } catch (error) {
      logger.error('Reject sandwich leave error:', error);
      next(error);
    }
  }

  /**
   * Delete sandwich leave
   */
  async deleteSandwichLeave(req, res, next) {
    try {
      const { organizationId } = req;
      const leave = await sandwichLeaveService.deleteSandwichLeave(
        req.params.id,
        organizationId
      );

      if (!leave) {
        return notFoundResponse(res, 'Sandwich leave');
      }

      return successResponse(res, null, 'Sandwich leave deleted');
    } catch (error) {
      logger.error('Delete sandwich leave error:', error);
      next(error);
    }
  }
}

export default new SandwichLeaveController();