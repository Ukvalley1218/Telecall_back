import employeeSelfService from './service.js';
import { successResponse, errorResponse, notFoundResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class EmployeeSelfServiceController {
  /**
   * Get employee dashboard summary
   */
  async getDashboardSummary(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const summary = await employeeSelfService.getDashboardSummary(userId, organizationId);
      return successResponse(res, summary, 'Dashboard summary retrieved');
    } catch (error) {
      logger.error('Get dashboard summary error:', error);
      next(error);
    }
  }

  /**
   * Get my permissions
   */
  async getMyPermissions(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const permissions = await employeeSelfService.getOrCreatePermissions(
        userId,
        organizationId,
        req.user.role
      );
      return successResponse(res, permissions, 'Permissions retrieved');
    } catch (error) {
      logger.error('Get permissions error:', error);
      next(error);
    }
  }

  /**
   * Get my profile
   */
  async getMyProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { employee, user } = await employeeSelfService.getMyProfile(userId, organizationId);

      if (!employee && !user) {
        return notFoundResponse(res, 'Profile');
      }

      return successResponse(res, { employee, user }, 'Profile retrieved successfully');
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  /**
   * Update my profile
   */
  async updateMyProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const profile = await employeeSelfService.updateMyProfile(userId, organizationId, req.body);
      return successResponse(res, profile, 'Profile updated successfully');
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }

  /**
   * Get my attendance
   */
  async getMyAttendance(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { startDate, endDate } = req.query;
      const result = await employeeSelfService.getMyAttendance(userId, organizationId, startDate, endDate);
      return successResponse(res, result, 'Attendance retrieved successfully');
    } catch (error) {
      logger.error('Get attendance error:', error);
      next(error);
    }
  }

  /**
   * Get today's attendance
   */
  async getTodayAttendance(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const result = await employeeSelfService.getTodayAttendance(userId, organizationId);
      return successResponse(res, result, "Today's attendance retrieved");
    } catch (error) {
      logger.error('Get today attendance error:', error);
      next(error);
    }
  }

  /**
   * Get my leave balance
   */
  async getMyLeaveBalance(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const balance = await employeeSelfService.getMyLeaveBalance(userId, organizationId);
      return successResponse(res, balance, 'Leave balance retrieved');
    } catch (error) {
      logger.error('Get leave balance error:', error);
      next(error);
    }
  }

  /**
   * Get my leave requests
   */
  async getMyLeaveRequests(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { status, page = 1, limit = 20 } = req.query;
      const result = await employeeSelfService.getMyLeaveRequests(userId, organizationId, status, page, limit);
      return paginatedResponse(
        res,
        result.leaves,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Leave requests retrieved'
      );
    } catch (error) {
      logger.error('Get leave requests error:', error);
      next(error);
    }
  }

  /**
   * Apply for leave
   */
  async applyLeave(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const leaveRequest = await employeeSelfService.applyLeave(userId, organizationId, req.body);
      return successResponse(res, leaveRequest, 'Leave request submitted successfully', 201);
    } catch (error) {
      logger.error('Apply leave error:', error);
      next(error);
    }
  }

  /**
   * Get my payslips
   */
  async getMyPayslips(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { page = 1, limit = 12 } = req.query;
      const result = await employeeSelfService.getMyPayslips(userId, organizationId, page, limit);
      return paginatedResponse(
        res,
        result.payslips,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Payslips retrieved'
      );
    } catch (error) {
      logger.error('Get payslips error:', error);
      next(error);
    }
  }

  /**
   * Get my performance records
   */
  async getMyPerformance(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { page = 1, limit = 10 } = req.query;
      const result = await employeeSelfService.getMyPerformance(userId, organizationId, page, limit);
      return paginatedResponse(
        res,
        result.records,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Performance records retrieved'
      );
    } catch (error) {
      logger.error('Get performance error:', error);
      next(error);
    }
  }

  /**
   * Get my incentives
   */
  async getMyIncentives(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const { page = 1, limit = 20 } = req.query;
      const result = await employeeSelfService.getMyIncentives(userId, organizationId, page, limit);
      return successResponse(res, result, 'Incentives retrieved');
    } catch (error) {
      logger.error('Get incentives error:', error);
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return errorResponse(res, 'Current password and new password are required', 400);
      }

      if (newPassword.length < 6) {
        return errorResponse(res, 'New password must be at least 6 characters', 400);
      }

      const result = await employeeSelfService.changePassword(userId, currentPassword, newPassword);
      return successResponse(res, result, 'Password changed successfully');
    } catch (error) {
      logger.error('Change password error:', error);
      next(error);
    }
  }

  /**
   * Update user permissions (Admin/HR only)
   */
  async updatePermissions(req, res, next) {
    try {
      const adminId = req.user._id;
      const organizationId = req.organizationId;
      const { userId } = req.params;
      const permissions = req.body;

      const result = await employeeSelfService.updatePermissions(
        userId,
        organizationId,
        permissions,
        adminId
      );

      return successResponse(res, result, 'Permissions updated successfully');
    } catch (error) {
      logger.error('Update permissions error:', error);
      next(error);
    }
  }
}

export default new EmployeeSelfServiceController();