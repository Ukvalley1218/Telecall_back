import shiftService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class ShiftController {
  /**
   * Get all shifts
   */
  async getShifts(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        isActive: req.query.isActive
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await shiftService.getShifts(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.shifts,
        options.page,
        options.limit,
        result.pagination.total,
        'Shifts retrieved successfully'
      );
    } catch (error) {
      logger.error('Get shifts error:', error);
      next(error);
    }
  }

  /**
   * Get shift by ID
   */
  async getShift(req, res, next) {
    try {
      const { organizationId } = req;
      const shift = await shiftService.getShiftById(req.params.id, organizationId);

      if (!shift) {
        return notFoundResponse(res, 'Shift');
      }

      return successResponse(res, shift, 'Shift retrieved successfully');
    } catch (error) {
      logger.error('Get shift error:', error);
      next(error);
    }
  }

  /**
   * Create shift
   */
  async createShift(req, res, next) {
    try {
      const { organizationId, user } = req;
      const shift = await shiftService.createShift({
        ...req.body,
        organizationId,
        createdBy: user._id
      });

      logger.info(`Shift created: ${shift.code} by user ${user._id}`);

      return createdResponse(res, shift, 'Shift created successfully');
    } catch (error) {
      logger.error('Create shift error:', error);
      next(error);
    }
  }

  /**
   * Update shift
   */
  async updateShift(req, res, next) {
    try {
      const { organizationId } = req;
      const shift = await shiftService.updateShift(
        req.params.id,
        organizationId,
        req.body
      );

      if (!shift) {
        return notFoundResponse(res, 'Shift');
      }

      return successResponse(res, shift, 'Shift updated successfully');
    } catch (error) {
      logger.error('Update shift error:', error);
      next(error);
    }
  }

  /**
   * Deactivate shift
   */
  async deactivateShift(req, res, next) {
    try {
      const { organizationId } = req;
      const shift = await shiftService.deactivateShift(req.params.id, organizationId);

      if (!shift) {
        return notFoundResponse(res, 'Shift');
      }

      return successResponse(res, shift, 'Shift deactivated successfully');
    } catch (error) {
      logger.error('Deactivate shift error:', error);
      next(error);
    }
  }
}

export default new ShiftController();