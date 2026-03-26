import employeeService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class EmployeeController {
  /**
   * Get all employees
   */
  async getEmployees(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status,
        department: req.query.department,
        search: req.query.search
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await employeeService.getEmployees(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.employees,
        options.page,
        options.limit,
        result.pagination.total,
        'Employees retrieved successfully'
      );
    } catch (error) {
      logger.error('Get employees error:', error);
      next(error);
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployee(req, res, next) {
    try {
      const { organizationId } = req;
      const employee = await employeeService.getEmployeeById(req.params.id, organizationId);

      if (!employee) {
        return notFoundResponse(res, 'Employee');
      }

      return successResponse(res, employee, 'Employee retrieved successfully');
    } catch (error) {
      logger.error('Get employee error:', error);
      next(error);
    }
  }

  /**
   * Create employee
   */
  async createEmployee(req, res, next) {
    try {
      const { organizationId, user } = req;
      const employeeData = {
        ...req.body,
        organizationId
      };

      const employee = await employeeService.createEmployee(employeeData, user._id);

      logger.info(`Employee created: ${employee.employeeId} by user ${user._id}`);

      return createdResponse(res, employee, 'Employee created successfully');
    } catch (error) {
      logger.error('Create employee error:', error);
      next(error);
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(req, res, next) {
    try {
      const { organizationId } = req;
      const employee = await employeeService.updateEmployee(
        req.params.id,
        organizationId,
        req.body
      );

      if (!employee) {
        return notFoundResponse(res, 'Employee');
      }

      return successResponse(res, employee, 'Employee updated successfully');
    } catch (error) {
      logger.error('Update employee error:', error);
      next(error);
    }
  }

  /**
   * Assign shift
   */
  async assignShift(req, res, next) {
    try {
      const { organizationId } = req;
      const employee = await employeeService.assignShift(
        req.params.id,
        organizationId,
        req.body.shiftId
      );

      if (!employee) {
        return notFoundResponse(res, 'Employee');
      }

      return successResponse(res, employee, 'Shift assigned successfully');
    } catch (error) {
      logger.error('Assign shift error:', error);
      next(error);
    }
  }

  /**
   * Assign KPI
   */
  async assignKPI(req, res, next) {
    try {
      const { organizationId, user } = req;
      const employee = await employeeService.assignKPI(
        req.params.id,
        organizationId,
        req.body.kpiId,
        req.body.targetValue,
        user._id
      );

      if (!employee) {
        return notFoundResponse(res, 'Employee');
      }

      return successResponse(res, employee, 'KPI assigned successfully');
    } catch (error) {
      logger.error('Assign KPI error:', error);
      next(error);
    }
  }

  /**
   * Toggle overtime eligibility
   */
  async toggleOvertime(req, res, next) {
    try {
      const { organizationId } = req;
      const employee = await employeeService.toggleOvertime(
        req.params.id,
        organizationId,
        req.body.allowed
      );

      if (!employee) {
        return notFoundResponse(res, 'Employee');
      }

      return successResponse(res, employee, 'Overtime eligibility updated');
    } catch (error) {
      logger.error('Toggle overtime error:', error);
      next(error);
    }
  }

  /**
   * Deactivate employee
   */
  async deactivateEmployee(req, res, next) {
    try {
      const { organizationId } = req;
      const employee = await employeeService.deactivateEmployee(
        req.params.id,
        organizationId
      );

      if (!employee) {
        return notFoundResponse(res, 'Employee');
      }

      return successResponse(res, employee, 'Employee deactivated successfully');
    } catch (error) {
      logger.error('Deactivate employee error:', error);
      next(error);
    }
  }

  /**
   * Get attendance summary
   */
  async getAttendanceSummary(req, res, next) {
    try {
      const { organizationId } = req;
      const { startDate, endDate } = req.query;

      const summary = await employeeService.getAttendanceSummary(
        req.params.id,
        organizationId,
        startDate,
        endDate
      );

      return successResponse(res, summary, 'Attendance summary retrieved');
    } catch (error) {
      logger.error('Get attendance summary error:', error);
      next(error);
    }
  }

  /**
   * Get incentives
   */
  async getIncentives(req, res, next) {
    try {
      const { organizationId } = req;
      const incentives = await employeeService.getIncentives(
        req.params.id,
        organizationId
      );

      return successResponse(res, incentives, 'Incentives retrieved');
    } catch (error) {
      logger.error('Get incentives error:', error);
      next(error);
    }
  }
}

export default new EmployeeController();