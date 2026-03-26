import dwrService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';
import Employee from '../../models/Employee.js';

/**
 * Get employee ID from user ID
 */
const getEmployeeFromUser = async (userId, organizationId) => {
  const employee = await Employee.findOne({ userId, organizationId }).select('_id');
  if (!employee) {
    throw new Error('Employee record not found');
  }
  return employee._id;
};

class DWRController {
  async getDWRs(req, res, next) {
    try {
      const { organizationId } = req;
      const { employeeId, status, reviewStatus, startDate, endDate, date, page, limit } = req.query;

      const result = await dwrService.getDWRs(organizationId, {
        employeeId, status, reviewStatus, startDate, endDate, date
      }, { page: parseInt(page) || 1, limit: parseInt(limit) || 20 });

      return paginatedResponse(
        res,
        result.dwrs,
        parseInt(page) || 1,
        parseInt(limit) || 20,
        result.pagination.total,
        'DWRs retrieved successfully'
      );
    } catch (error) {
      logger.error('Get DWRs error:', error);
      next(error);
    }
  }

  async getDWRById(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const dwr = await dwrService.getDWRById(id, organizationId);

      if (!dwr) {
        return notFoundResponse(res, 'Daily Work Report');
      }

      return successResponse(res, dwr, 'DWR retrieved successfully');
    } catch (error) {
      logger.error('Get DWR error:', error);
      next(error);
    }
  }

  async createDWR(req, res, next) {
    try {
      const { organizationId, user } = req;

      const dwr = await dwrService.createDWR({
        ...req.body,
        organizationId,
        createdBy: user._id
      });

      logger.info(`DWR created: ${dwr.reportId} by user ${user._id}`);

      return createdResponse(res, dwr, 'Daily work report created successfully');
    } catch (error) {
      logger.error('Create DWR error:', error);
      next(error);
    }
  }

  async updateDWR(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;

      const dwr = await dwrService.updateDWR(id, organizationId, {
        ...req.body,
        updatedBy: user._id
      });

      if (!dwr) {
        return notFoundResponse(res, 'Daily Work Report');
      }

      return successResponse(res, dwr, 'DWR updated successfully');
    } catch (error) {
      logger.error('Update DWR error:', error);
      next(error);
    }
  }

  async deleteDWR(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const dwr = await dwrService.deleteDWR(id, organizationId);

      if (!dwr) {
        return notFoundResponse(res, 'Daily Work Report');
      }

      return successResponse(res, null, 'DWR deleted successfully');
    } catch (error) {
      logger.error('Delete DWR error:', error);
      next(error);
    }
  }

  async submitDWR(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;

      const dwr = await dwrService.submitDWR(id, organizationId, user._id);

      return successResponse(res, dwr, 'DWR submitted successfully');
    } catch (error) {
      logger.error('Submit DWR error:', error);
      next(error);
    }
  }

  async addReview(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { rating, comments, needsAttention, strengths, areasOfImprovement } = req.body;

      const employeeId = await getEmployeeFromUser(user._id, organizationId);
      const dwr = await dwrService.addReview(id, organizationId, employeeId, {
        rating,
        comments,
        needsAttention,
        strengths,
        areasOfImprovement
      });

      return successResponse(res, dwr, 'Review added successfully');
    } catch (error) {
      logger.error('Add review error:', error);
      next(error);
    }
  }

  async getEmployeeMonthlyDWRs(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { month, year } = req.query;

      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      const dwrs = await dwrService.getEmployeeMonthlyDWRs(employeeId, currentMonth, currentYear);

      return successResponse(res, dwrs, 'Monthly DWRs retrieved successfully');
    } catch (error) {
      logger.error('Get employee monthly DWRs error:', error);
      next(error);
    }
  }

  async getComplianceStats(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year } = req.query;

      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      const stats = await dwrService.getComplianceStats(organizationId, currentMonth, currentYear);

      return successResponse(res, stats, 'DWR compliance stats retrieved successfully');
    } catch (error) {
      logger.error('Get compliance stats error:', error);
      next(error);
    }
  }

  async getPendingReviews(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const employeeId = await getEmployeeFromUser(userId, organizationId);

      const dwrs = await dwrService.getPendingReviews(employeeId);

      return successResponse(res, dwrs, 'Pending reviews retrieved successfully');
    } catch (error) {
      logger.error('Get pending reviews error:', error);
      next(error);
    }
  }

  async addTask(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const dwr = await dwrService.addTask(id, organizationId, req.body);

      return successResponse(res, dwr, 'Task added successfully');
    } catch (error) {
      logger.error('Add task error:', error);
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const { organizationId } = req;
      const { id, taskId } = req.params;

      const dwr = await dwrService.updateTask(id, organizationId, taskId, req.body);

      return successResponse(res, dwr, 'Task updated successfully');
    } catch (error) {
      logger.error('Update task error:', error);
      next(error);
    }
  }

  async removeTask(req, res, next) {
    try {
      const { organizationId } = req;
      const { id, taskId } = req.params;

      const dwr = await dwrService.removeTask(id, organizationId, taskId);

      return successResponse(res, dwr, 'Task removed successfully');
    } catch (error) {
      logger.error('Remove task error:', error);
      next(error);
    }
  }

  async getDWRStats(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year } = req.query;

      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      const stats = await dwrService.getDWRStats(organizationId, currentMonth, currentYear);

      return successResponse(res, stats, 'DWR stats retrieved successfully');
    } catch (error) {
      logger.error('Get DWR stats error:', error);
      next(error);
    }
  }

  async getEmployeeDWRSummary(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { month, year } = req.query;

      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      const summary = await dwrService.getEmployeeDWRSummary(employeeId, currentMonth, currentYear);

      return successResponse(res, summary, 'Employee DWR summary retrieved successfully');
    } catch (error) {
      logger.error('Get employee DWR summary error:', error);
      next(error);
    }
  }

  async getTodayDWR(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const employeeId = await getEmployeeFromUser(userId, organizationId);

      const dwr = await dwrService.getTodayDWR(employeeId);

      return successResponse(res, dwr, 'Today\'s DWR retrieved successfully');
    } catch (error) {
      logger.error('Get today DWR error:', error);
      next(error);
    }
  }

  async createOrUpdateTodayDWR(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const employeeId = await getEmployeeFromUser(userId, organizationId);

      const dwr = await dwrService.createOrUpdateTodayDWR(employeeId, organizationId, userId, req.body);

      return successResponse(res, dwr, 'DWR saved successfully');
    } catch (error) {
      logger.error('Create or update today DWR error:', error);
      next(error);
    }
  }

  async submitHourlyReport(req, res, next) {
    try {
      const userId = req.user._id;
      const organizationId = req.organizationId;
      const employeeId = await getEmployeeFromUser(userId, organizationId);

      const file = req.file || null;
      const data = {
        hourSlot: req.body.hourSlot,
        workDescription: req.body.workDescription
      };

      const dwr = await dwrService.submitHourlyReport(employeeId, organizationId, userId, data, file);

      logger.info(`Hourly report submitted: ${req.body.hourSlot} by user ${userId}`);

      return successResponse(res, dwr, 'Hourly report submitted successfully');
    } catch (error) {
      logger.error('Submit hourly report error:', error);
      next(error);
    }
  }

  async getDWRPerformanceStats(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year } = req.query;

      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      const stats = await dwrService.getDWRPerformanceStats(organizationId, currentMonth, currentYear);

      return successResponse(res, stats, 'DWR performance stats retrieved successfully');
    } catch (error) {
      logger.error('Get DWR performance stats error:', error);
      next(error);
    }
  }
}

export default new DWRController();