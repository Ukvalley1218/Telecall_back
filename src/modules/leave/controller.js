import mongoose from 'mongoose';
import Employee from '../../models/Employee.js';
import LeaveType from '../../models/LeaveType.js';
import LeaveRequest from '../../models/LeaveRequest.js';
import LeaveBalance from '../../models/LeaveBalance.js';
import leaveService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class LeaveController {
  /**
   * Get leave types from database
   */
  async getLeaveTypes(req, res, next) {
    try {
      const { organizationId } = req;
      const leaveTypes = await leaveService.getLeaveTypes(organizationId);
      return successResponse(res, leaveTypes, 'Leave types retrieved successfully');
    } catch (error) {
      logger.error('Get leave types error:', error);
      next(error);
    }
  }

  /**
   * Get leave balance for all employees
   */
  async getLeaveBalances(req, res, next) {
    try {
      const { organizationId } = req;
      const { department, employeeId, year } = req.query;

      const filters = {};
      if (department && department !== 'all') filters.department = department;
      if (employeeId) filters.employeeId = employeeId;
      if (year) filters.year = parseInt(year);

      const balances = await leaveService.getLeaveBalances(organizationId, filters);
      return successResponse(res, balances, 'Leave balances retrieved successfully');
    } catch (error) {
      logger.error('Get leave balances error:', error);
      next(error);
    }
  }

  /**
   * Get leave applications from database
   */
  async getLeaveApplications(req, res, next) {
    try {
      const { organizationId } = req;
      const { employeeId, status, department, month, year } = req.query;

      const filters = {};
      if (employeeId) filters.employeeId = employeeId;
      if (status && status !== 'all') filters.status = status;
      if (department && department !== 'all') filters.department = department;
      if (month) filters.month = parseInt(month);
      if (year) filters.year = parseInt(year);

      const applications = await leaveService.getLeaveRequests(organizationId, filters);
      return successResponse(res, applications, 'Leave applications retrieved successfully');
    } catch (error) {
      logger.error('Get leave applications error:', error);
      next(error);
    }
  }

  /**
   * Apply for leave
   */
  async applyLeave(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { employeeId, leaveTypeId, startDate, endDate, reason, halfDay } = req.body;

      // Use employeeId from body or get from user
      const empId = employeeId || user.employeeId;

      const leaveRequest = await leaveService.createLeaveRequest({
        organizationId,
        employeeId: empId,
        leaveTypeId,
        startDate,
        endDate,
        reason,
        halfDay: halfDay || false,
        appliedBy: user._id
      });

      return createdResponse(res, leaveRequest, 'Leave application submitted successfully');
    } catch (error) {
      logger.error('Apply leave error:', error);
      next(error);
    }
  }

  /**
   * Approve leave application
   */
  async approveLeave(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { notes, approvalType } = req.body;

      console.log('Approve Leave Request:', {
        id,
        notes,
        approvalType,
        userRole: user?.role,
        userId: user?._id
      });

      // Get employee ID from user (may not exist for admin/HR users)
      const employee = await Employee.findOne({ userId: user._id, organizationId });

      // For admin/HR users without employee record, use user ID as approver
      const approverId = employee ? employee._id : user._id;

      // Determine approval type based on user role or explicit parameter
      let finalApprovalType = approvalType;
      if (!finalApprovalType) {
        // Auto-detect based on user role
        const isHR = user.role === 'hr' || user.role === 'admin';
        finalApprovalType = isHR ? 'hr' : 'hod';
      }

      console.log('Final Approval Type:', finalApprovalType, 'Approver ID:', approverId);

      const updatedRequest = await leaveService.approveLeaveRequest(id, approverId, notes, finalApprovalType);

      console.log('Updated Request Status:', updatedRequest?.status);

      return successResponse(res, updatedRequest, 'Leave application approved');
    } catch (error) {
      logger.error('Approve leave error:', error);
      next(error);
    }
  }

  /**
   * Reject leave application
   */
  async rejectLeave(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { reason } = req.body;

      // Get employee ID from user (may not exist for admin/HR users)
      const employee = await Employee.findOne({ userId: user._id, organizationId });

      // For admin/HR users without employee record, use user ID as rejecter
      const rejecterId = employee ? employee._id : user._id;

      const updatedRequest = await leaveService.rejectLeaveRequest(id, rejecterId, reason);
      return successResponse(res, updatedRequest, 'Leave application rejected');
    } catch (error) {
      logger.error('Reject leave error:', error);
      next(error);
    }
  }

  /**
   * Get leave summary for dashboard
   */
  async getLeaveSummary(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year } = req.query;

      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      const summary = await leaveService.getLeaveSummary(organizationId, currentMonth, currentYear);
      return successResponse(res, summary, 'Leave summary retrieved successfully');
    } catch (error) {
      logger.error('Get leave summary error:', error);
      next(error);
    }
  }

  /**
   * Get departments list
   */
  async getDepartments(req, res, next) {
    try {
      const { organizationId } = req;

      const departments = await Employee.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), status: 'active' } },
        { $group: { _id: '$employment.department', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      const result = [
        { id: 'all', name: 'All Departments', count: departments.reduce((sum, d) => sum + d.count, 0) },
        ...departments.map(d => ({
          id: d._id.toLowerCase().replace(/\s+/g, '_'),
          name: d._id,
          count: d.count
        }))
      ];

      return successResponse(res, result, 'Departments retrieved successfully');
    } catch (error) {
      logger.error('Get departments error:', error);
      next(error);
    }
  }
}

export default new LeaveController();