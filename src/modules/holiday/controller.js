import holidayService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class HolidayController {
  async getHolidays(req, res, next) {
    try {
      const { organizationId } = req;
      const { year, month, type, page, limit } = req.query;

      const result = await holidayService.getHolidays(organizationId, {
        year, month, type
      }, { page: parseInt(page) || 1, limit: parseInt(limit) || 50 });

      return paginatedResponse(
        res,
        result.holidays,
        parseInt(page) || 1,
        parseInt(limit) || 50,
        result.pagination.total,
        'Holidays retrieved successfully'
      );
    } catch (error) {
      logger.error('Get holidays error:', error);
      next(error);
    }
  }

  async getHolidayById(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const holiday = await holidayService.getHolidayById(id, organizationId);

      if (!holiday) {
        return notFoundResponse(res, 'Holiday');
      }

      return successResponse(res, holiday, 'Holiday retrieved successfully');
    } catch (error) {
      logger.error('Get holiday error:', error);
      next(error);
    }
  }

  async createHoliday(req, res, next) {
    try {
      const { organizationId, user } = req;

      const holiday = await holidayService.createHoliday({
        ...req.body,
        organizationId,
        createdBy: user._id
      });

      logger.info(`Holiday created: ${holiday.name} by user ${user._id}`);

      return createdResponse(res, holiday, 'Holiday created successfully');
    } catch (error) {
      logger.error('Create holiday error:', error);
      next(error);
    }
  }

  async updateHoliday(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;

      const holiday = await holidayService.updateHoliday(id, organizationId, {
        ...req.body,
        updatedBy: user._id
      });

      if (!holiday) {
        return notFoundResponse(res, 'Holiday');
      }

      return successResponse(res, holiday, 'Holiday updated successfully');
    } catch (error) {
      logger.error('Update holiday error:', error);
      next(error);
    }
  }

  async deleteHoliday(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const holiday = await holidayService.deleteHoliday(id, organizationId);

      if (!holiday) {
        return notFoundResponse(res, 'Holiday');
      }

      return successResponse(res, null, 'Holiday deleted successfully');
    } catch (error) {
      logger.error('Delete holiday error:', error);
      next(error);
    }
  }

  async getHolidaysForYear(req, res, next) {
    try {
      const { organizationId } = req;
      const { year } = req.params;

      const holidays = await holidayService.getHolidaysForYear(organizationId, year);

      return successResponse(res, holidays, 'Holidays retrieved successfully');
    } catch (error) {
      logger.error('Get holidays for year error:', error);
      next(error);
    }
  }

  async getHolidaysForDateRange(req, res, next) {
    try {
      const { organizationId } = req;
      const { startDate, endDate } = req.query;

      const holidays = await holidayService.getHolidaysForDateRange(organizationId, startDate, endDate);

      return successResponse(res, holidays, 'Holidays retrieved successfully');
    } catch (error) {
      logger.error('Get holidays for date range error:', error);
      next(error);
    }
  }

  async getUpcomingHolidays(req, res, next) {
    try {
      const { organizationId } = req;
      const { limit = 10 } = req.query;

      const holidays = await holidayService.getUpcomingHolidays(organizationId, parseInt(limit));

      return successResponse(res, holidays, 'Upcoming holidays retrieved successfully');
    } catch (error) {
      logger.error('Get upcoming holidays error:', error);
      next(error);
    }
  }

  async getHolidayCalendar(req, res, next) {
    try {
      const { organizationId } = req;
      const { year } = req.query;

      const currentYear = year || new Date().getFullYear();

      const calendar = await holidayService.getHolidayCalendar(organizationId, currentYear);

      return successResponse(res, calendar, 'Holiday calendar retrieved successfully');
    } catch (error) {
      logger.error('Get holiday calendar error:', error);
      next(error);
    }
  }

  async isHoliday(req, res, next) {
    try {
      const { organizationId } = req;
      const { date } = req.query;

      const holiday = await holidayService.isHoliday(organizationId, date);

      return successResponse(res, {
        isHoliday: !!holiday,
        holiday: holiday || null
      }, 'Holiday check completed');
    } catch (error) {
      logger.error('Is holiday check error:', error);
      next(error);
    }
  }

  async getHolidaySummary(req, res, next) {
    try {
      const { organizationId } = req;
      const { year } = req.query;

      const currentYear = year || new Date().getFullYear();

      const summary = await holidayService.getHolidaySummary(organizationId, currentYear);

      return successResponse(res, summary, 'Holiday summary retrieved successfully');
    } catch (error) {
      logger.error('Get holiday summary error:', error);
      next(error);
    }
  }

  async createRecurringHolidays(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { year } = req.body;

      const holidays = await holidayService.createRecurringHolidays(organizationId, year, user._id);

      return successResponse(res, holidays, 'Recurring holidays created successfully');
    } catch (error) {
      logger.error('Create recurring holidays error:', error);
      next(error);
    }
  }

  async bulkCreateHolidays(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { holidays } = req.body;

      const result = await holidayService.bulkCreateHolidays(organizationId, holidays, user._id);

      return successResponse(res, result, 'Holidays created successfully');
    } catch (error) {
      logger.error('Bulk create holidays error:', error);
      next(error);
    }
  }

  async getHolidaysByType(req, res, next) {
    try {
      const { organizationId } = req;
      const { type } = req.params;
      const { year } = req.query;

      const holidays = await holidayService.getHolidaysByType(organizationId, type, year);

      return successResponse(res, holidays, 'Holidays retrieved successfully');
    } catch (error) {
      logger.error('Get holidays by type error:', error);
      next(error);
    }
  }

  async getOptionalHolidays(req, res, next) {
    try {
      const { organizationId } = req;
      const { year } = req.query;

      const holidays = await holidayService.getOptionalHolidays(organizationId, year);

      return successResponse(res, holidays, 'Optional holidays retrieved successfully');
    } catch (error) {
      logger.error('Get optional holidays error:', error);
      next(error);
    }
  }

  async importFromTemplate(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { year, templateName } = req.body;

      const holidays = await holidayService.importFromTemplate(organizationId, year, templateName, user._id);

      return successResponse(res, holidays, 'Holidays imported from template successfully');
    } catch (error) {
      logger.error('Import from template error:', error);
      next(error);
    }
  }

  async getHolidayStats(req, res, next) {
    try {
      const { organizationId } = req;
      const { year } = req.query;

      const currentYear = year || new Date().getFullYear();

      const stats = await holidayService.getHolidayStats(organizationId, currentYear);

      return successResponse(res, stats, 'Holiday stats retrieved successfully');
    } catch (error) {
      logger.error('Get holiday stats error:', error);
      next(error);
    }
  }
}

export default new HolidayController();