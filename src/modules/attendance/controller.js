import attendanceService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';
import { ROLES } from '../../config/constants.js';

class AttendanceController {
  /**
   * Check-in
   */
  async checkIn(req, res, next) {
    try {
      const { organizationId, user } = req;
      const checkInData = {
        employeeId: req.body.employeeId,
        shiftId: req.body.shiftId,
        location: req.body.location,
        ip: req.body.ip || req.ip
      };

      const attendance = await attendanceService.checkIn(organizationId, user, checkInData);

      logger.info(`Check-in: Employee ${attendance.employeeId} at ${attendance.checkIn.time}`);

      return createdResponse(res, attendance, 'Check-in recorded successfully');
    } catch (error) {
      logger.error('Check-in error:', error);
      next(error);
    }
  }

  /**
   * Check-out
   */
  async checkOut(req, res, next) {
    try {
      const { organizationId, user } = req;
      const checkOutData = {
        location: req.body.location,
        ip: req.body.ip || req.ip
      };

      const attendance = await attendanceService.checkOut(organizationId, user, checkOutData);

      if (!attendance) {
        return errorResponse(res, 'No active check-in found', 400);
      }

      logger.info(`Check-out: Employee ${attendance.employeeId} at ${attendance.checkOut.time}`);

      return successResponse(res, attendance, 'Check-out recorded successfully');
    } catch (error) {
      logger.error('Check-out error:', error);
      next(error);
    }
  }

  /**
   * Get attendance records
   */
  async getAttendance(req, res, next) {
    try {
      const { organizationId, user } = req;
      const filters = {
        employeeId: req.query.employeeId,
        date: req.query.date,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      // If employee role, only show their own attendance
      if (user.role === ROLES.EMPLOYEE) {
        filters.employeeId = user.employeeId;
      }

      const result = await attendanceService.getAttendance(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.attendance,
        options.page,
        options.limit,
        result.pagination.total,
        'Attendance records retrieved'
      );
    } catch (error) {
      logger.error('Get attendance error:', error);
      next(error);
    }
  }

  /**
   * Get employee attendance
   */
  async getEmployeeAttendance(req, res, next) {
    try {
      const { organizationId, user } = req;
      const employeeId = req.params.id;
      const { startDate, endDate } = req.query;

      // Check access rights
      if (user.role === ROLES.EMPLOYEE && user.employeeId?.toString() !== employeeId) {
        return errorResponse(res, 'Access denied', 403);
      }

      const result = await attendanceService.getEmployeeAttendance(
        organizationId,
        employeeId,
        startDate,
        endDate
      );

      return successResponse(res, result, 'Employee attendance retrieved');
    } catch (error) {
      logger.error('Get employee attendance error:', error);
      next(error);
    }
  }

  /**
   * Get late mark summary
   */
  async getLateMarkSummary(req, res, next) {
    try {
      const { organizationId, user } = req;
      const filters = {
        month: req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1,
        year: req.query.year ? parseInt(req.query.year) : new Date().getFullYear(),
        employeeId: req.query.employeeId
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      // If employee role, only show their own summary
      if (user.role === ROLES.EMPLOYEE) {
        filters.employeeId = user.employeeId;
      }

      const result = await attendanceService.getLateMarkSummary(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.summaries,
        options.page,
        options.limit,
        result.pagination.total,
        'Late mark summary retrieved'
      );
    } catch (error) {
      logger.error('Get late mark summary error:', error);
      next(error);
    }
  }

  /**
   * Apply late mark deduction
   */
  async applyLateMarkDeduction(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { month, year, employeeId } = req.body;

      const result = await attendanceService.applyLateMarkDeduction(
        organizationId,
        month,
        year,
        employeeId,
        user._id
      );

      return successResponse(res, result, 'Late mark deduction applied');
    } catch (error) {
      logger.error('Apply late mark deduction error:', error);
      next(error);
    }
  }

  /**
   * Get today's attendance
   */
  async getTodayAttendance(req, res, next) {
    try {
      const { organizationId, user } = req;

      const attendance = await attendanceService.getTodayAttendance(organizationId, user);

      return successResponse(res, attendance, 'Today\'s attendance retrieved');
    } catch (error) {
      logger.error('Get today attendance error:', error);
      next(error);
    }
  }

  /**
   * Manual attendance entry
   */
  async manualEntry(req, res, next) {
    try {
      const { organizationId, user } = req;

      const attendance = await attendanceService.createManualEntry(
        organizationId,
        req.body,
        user._id
      );

      logger.info(`Manual attendance entry: Employee ${attendance.employeeId} by user ${user._id}`);

      return createdResponse(res, attendance, 'Manual attendance entry recorded');
    } catch (error) {
      logger.error('Manual entry error:', error);
      next(error);
    }
  }

  /**
   * Get attendance summary report by department
   */
  async getAttendanceSummaryReport(req, res, next) {
    try {
      const { organizationId } = req;
      const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

      const report = await attendanceService.getAttendanceSummaryReport(organizationId, month, year);

      return successResponse(res, report, 'Attendance summary report retrieved');
    } catch (error) {
      logger.error('Get attendance summary report error:', error);
      next(error);
    }
  }
}

export default new AttendanceController();