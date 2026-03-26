import Holiday from '../../models/Holiday.js';
import mongoose from 'mongoose';

class HolidayService {
  /**
   * Get holidays with filters
   */
  async getHolidays(organizationId, filters = {}, options = {}) {
    const query = { organizationId, isActive: true };

    if (filters.year) {
      query.year = parseInt(filters.year);
    }
    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.month) {
      const month = parseInt(filters.month);
      const year = filters.year ? parseInt(filters.year) : new Date().getFullYear();
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const holidays = await Holiday.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Holiday.countDocuments(query);

    return {
      holidays,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get holiday by ID
   */
  async getHolidayById(id, organizationId) {
    return Holiday.findOne({ _id: id, organizationId });
  }

  /**
   * Create holiday
   */
  async createHoliday(data) {
    // Check for duplicate holiday on same date
    const existing = await Holiday.findOne({
      organizationId: data.organizationId,
      date: new Date(data.date)
    });

    if (existing) {
      throw new Error('Holiday already exists for this date');
    }

    const holiday = new Holiday(data);
    await holiday.save();
    return holiday;
  }

  /**
   * Update holiday
   */
  async updateHoliday(id, organizationId, data) {
    const holiday = await Holiday.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    );
    return holiday;
  }

  /**
   * Delete holiday
   */
  async deleteHoliday(id, organizationId) {
    return Holiday.findOneAndDelete({ _id: id, organizationId });
  }

  /**
   * Get holidays for year
   */
  async getHolidaysForYear(organizationId, year) {
    return Holiday.getForYear(organizationId, parseInt(year));
  }

  /**
   * Get holidays for date range
   */
  async getHolidaysForDateRange(organizationId, startDate, endDate) {
    return Holiday.getForDateRange(organizationId, new Date(startDate), new Date(endDate));
  }

  /**
   * Get upcoming holidays
   */
  async getUpcomingHolidays(organizationId, limit = 10) {
    return Holiday.getUpcoming(organizationId, limit);
  }

  /**
   * Get holiday calendar
   */
  async getHolidayCalendar(organizationId, year) {
    return Holiday.getCalendar(organizationId, parseInt(year));
  }

  /**
   * Check if date is holiday
   */
  async isHoliday(organizationId, date) {
    return Holiday.isHoliday(organizationId, new Date(date));
  }

  /**
   * Get holiday summary
   */
  async getHolidaySummary(organizationId, year) {
    return Holiday.getYearSummary(organizationId, parseInt(year));
  }

  /**
   * Create recurring holidays for new year
   */
  async createRecurringHolidays(organizationId, year, userId) {
    return Holiday.createRecurringForYear(organizationId, parseInt(year), userId);
  }

  /**
   * Bulk create holidays
   */
  async bulkCreateHolidays(organizationId, holidays, userId) {
    const created = [];
    const errors = [];

    for (const holidayData of holidays) {
      try {
        const holiday = new Holiday({
          ...holidayData,
          organizationId,
          createdBy: userId
        });
        await holiday.save();
        created.push(holiday);
      } catch (error) {
        errors.push({
          data: holidayData,
          error: error.message
        });
      }
    }

    return { created, errors };
  }

  /**
   * Get holidays by type
   */
  async getHolidaysByType(organizationId, type, year) {
    const query = { organizationId, type, isActive: true };
    if (year) {
      query.year = parseInt(year);
    }
    return Holiday.find(query).sort({ date: 1 });
  }

  /**
   * Get optional holidays
   */
  async getOptionalHolidays(organizationId, year) {
    const query = { organizationId, isOptional: true, isActive: true };
    if (year) {
      query.year = parseInt(year);
    }
    return Holiday.find(query).sort({ date: 1 });
  }

  /**
   * Get working holidays
   */
  async getWorkingHolidays(organizationId, year) {
    const query = { organizationId, isWorkingDay: true, isActive: true };
    if (year) {
      query.year = parseInt(year);
    }
    return Holiday.find(query).sort({ date: 1 });
  }

  /**
   * Get holidays for department
   */
  async getHolidaysForDepartment(organizationId, department, year) {
    const holidays = await Holiday.find({
      organizationId,
      year: parseInt(year),
      isActive: true,
      $or: [
        { isOrganizationWide: true },
        { applicableDepartments: { $in: [department, '*'] } }
      ]
    }).sort({ date: 1 });

    return holidays.filter(h => h.appliesToDepartment(department));
  }

  /**
   * Get holidays for region
   */
  async getHolidaysForRegion(organizationId, region, year) {
    const holidays = await Holiday.find({
      organizationId,
      year: parseInt(year),
      isActive: true,
      $or: [
        { isOrganizationWide: true },
        { applicableRegions: { $in: [region, '*'] } }
      ]
    }).sort({ date: 1 });

    return holidays.filter(h => h.appliesToRegion(region));
  }

  /**
   * Import holidays from template
   */
  async importFromTemplate(organizationId, year, templateName, userId) {
    // Common Indian holidays template
    const templates = {
      'india_national': [
        { name: 'Republic Day', date: new Date(year, 0, 26), type: 'national', isRecurring: true },
        { name: 'Independence Day', date: new Date(year, 7, 15), type: 'national', isRecurring: true },
        { name: 'Gandhi Jayanti', date: new Date(year, 9, 2), type: 'national', isRecurring: true },
        { name: 'Christmas', date: new Date(year, 11, 25), type: 'national', isRecurring: true },
        { name: "New Year's Day", date: new Date(year, 0, 1), type: 'company', isRecurring: true }
      ],
      'india_common': [
        { name: 'Republic Day', date: new Date(year, 0, 26), type: 'national', isRecurring: true },
        { name: 'Independence Day', date: new Date(year, 7, 15), type: 'national', isRecurring: true },
        { name: 'Gandhi Jayanti', date: new Date(year, 9, 2), type: 'national', isRecurring: true },
        { name: 'Christmas', date: new Date(year, 11, 25), type: 'national', isRecurring: true },
        { name: "New Year's Day", date: new Date(year, 0, 1), type: 'company', isRecurring: true },
        { name: 'Holi', date: new Date(year, 2, 14), type: 'regional', isRecurring: true },
        { name: 'Diwali', date: new Date(year, 10, 12), type: 'regional', isRecurring: true },
        { name: 'Dussehra', date: new Date(year, 9, 24), type: 'regional', isRecurring: true }
      ]
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error('Template not found');
    }

    const created = [];
    for (const holidayData of template) {
      // Check if already exists
      const existing = await Holiday.findOne({
        organizationId,
        name: holidayData.name,
        year
      });

      if (!existing) {
        const holiday = new Holiday({
          ...holidayData,
          organizationId,
          createdBy: userId
        });
        await holiday.save();
        created.push(holiday);
      }
    }

    return created;
  }

  /**
   * Get holiday statistics
   */
  async getHolidayStats(organizationId, year) {
    const currentYear = year || new Date().getFullYear();

    const stats = await Holiday.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          year: parseInt(currentYear),
          isActive: true
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Holiday.countDocuments({
      organizationId,
      year: currentYear,
      isActive: true
    });

    const optional = await Holiday.countDocuments({
      organizationId,
      year: currentYear,
      isOptional: true,
      isActive: true
    });

    const working = await Holiday.countDocuments({
      organizationId,
      year: currentYear,
      isWorkingDay: true,
      isActive: true
    });

    return {
      total,
      optional,
      working,
      byType: stats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {})
    };
  }
}

export default new HolidayService();