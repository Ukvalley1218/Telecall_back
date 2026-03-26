import mongoose from 'mongoose';
import DailyWorkReport from '../../models/DailyWorkReport.js';

class DWRService {
  /**
   * Get DWRs with filters
   */
  async getDWRs(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    if (filters.employeeId) query.employeeId = filters.employeeId;
    if (filters.status) query.status = filters.status;
    if (filters.reviewStatus) query.reviewStatus = filters.reviewStatus;

    // Date range filter
    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    } else if (filters.date) {
      query.date = new Date(filters.date);
    }

    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const dwrs = await DailyWorkReport.find(query)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
      .populate('reviewedBy', 'personalInfo.firstName personalInfo.lastName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DailyWorkReport.countDocuments(query);

    return {
      dwrs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get DWR by ID
   */
  async getDWRById(id, organizationId) {
    return DailyWorkReport.findOne({ _id: id, organizationId })
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .populate('reviewedBy', 'personalInfo.firstName personalInfo.lastName');
  }

  /**
   * Create DWR
   */
  async createDWR(data) {
    // Check if DWR already exists for this date
    const existing = await DailyWorkReport.findOne({
      employeeId: data.employeeId,
      date: new Date(data.date)
    });

    if (existing) {
      throw new Error('Daily work report already exists for this date');
    }

    const dwr = new DailyWorkReport(data);
    await dwr.save();
    return this.getDWRById(dwr._id, data.organizationId);
  }

  /**
   * Update DWR
   */
  async updateDWR(id, organizationId, data) {
    const dwr = await DailyWorkReport.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    );
    return dwr;
  }

  /**
   * Delete DWR
   */
  async deleteDWR(id, organizationId) {
    return DailyWorkReport.findOneAndDelete({ _id: id, organizationId });
  }

  /**
   * Submit DWR
   */
  async submitDWR(id, organizationId, userId) {
    const dwr = await DailyWorkReport.findOne({ _id: id, organizationId });
    if (!dwr) {
      throw new Error('DWR not found');
    }

    await dwr.submit(userId);
    return this.getDWRById(id, organizationId);
  }

  /**
   * Add review to DWR
   */
  async addReview(id, organizationId, reviewerId, reviewData) {
    const dwr = await DailyWorkReport.findOne({ _id: id, organizationId });
    if (!dwr) {
      throw new Error('DWR not found');
    }

    await dwr.addReview(reviewerId, reviewData);
    return this.getDWRById(id, organizationId);
  }

  /**
   * Get employee DWRs for month
   */
  async getEmployeeMonthlyDWRs(employeeId, month, year) {
    return DailyWorkReport.getEmployeeMonthlyReports(employeeId, month, year);
  }

  /**
   * Get DWR compliance stats
   */
  async getComplianceStats(organizationId, month, year) {
    return DailyWorkReport.getComplianceStats(organizationId, month, year);
  }

  /**
   * Get pending reviews for manager
   */
  async getPendingReviews(managerId) {
    return DailyWorkReport.getPendingReviews(managerId);
  }

  /**
   * Add task to DWR
   */
  async addTask(id, organizationId, task) {
    const dwr = await DailyWorkReport.findOne({ _id: id, organizationId });
    if (!dwr) {
      throw new Error('DWR not found');
    }

    await dwr.addTask(task);
    return this.getDWRById(id, organizationId);
  }

  /**
   * Update task in DWR
   */
  async updateTask(id, organizationId, taskId, updates) {
    const dwr = await DailyWorkReport.findOne({ _id: id, organizationId });
    if (!dwr) {
      throw new Error('DWR not found');
    }

    await dwr.updateTask(taskId, updates);
    return this.getDWRById(id, organizationId);
  }

  /**
   * Remove task from DWR
   */
  async removeTask(id, organizationId, taskId) {
    const dwr = await DailyWorkReport.findOne({ _id: id, organizationId });
    if (!dwr) {
      throw new Error('DWR not found');
    }

    await dwr.removeTask(taskId);
    return this.getDWRById(id, organizationId);
  }

  /**
   * Get DWR statistics
   */
  async getDWRStats(organizationId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const stats = await DailyWorkReport.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const reviewStats = await DailyWorkReport.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date: { $gte: startDate, $lte: endDate },
          reviewStatus: { $ne: 'pending' }
        }
      },
      {
        $group: {
          _id: '$reviewStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const taskStats = await DailyWorkReport.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $unwind: '$tasks'
      },
      {
        $group: {
          _id: '$tasks.done',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      status: stats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      reviewStatus: reviewStats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      taskCompletion: {
        completed: taskStats.find(s => s._id === true)?.count || 0,
        pending: taskStats.find(s => s._id === false)?.count || 0
      }
    };
  }

  /**
   * Get employee DWR summary
   */
  async getEmployeeDWRSummary(employeeId, month, year) {
    const dwrs = await DailyWorkReport.getEmployeeMonthlyReports(employeeId, month, year);

    const summary = {
      totalDays: dwrs.length,
      totalTasks: 0,
      completedTasks: 0,
      totalHoursWorked: 0,
      completionRate: 0,
      reviewedCount: 0,
      pendingReviewCount: 0
    };

    dwrs.forEach(dwr => {
      if (dwr.summary) {
        summary.totalTasks += dwr.summary.totalTasks || 0;
        summary.completedTasks += dwr.summary.completedTasks || 0;
        summary.totalHoursWorked += dwr.summary.totalHoursWorked || 0;
      }

      if (dwr.reviewStatus === 'reviewed') {
        summary.reviewedCount++;
      } else if (dwr.reviewStatus === 'pending') {
        summary.pendingReviewCount++;
      }
    });

    if (summary.totalTasks > 0) {
      summary.completionRate = (summary.completedTasks / summary.totalTasks) * 100;
    }

    return summary;
  }

  /**
   * Get today's DWR for employee
   */
  async getTodayDWR(employeeId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return DailyWorkReport.findOne({
      employeeId,
      date: today
    }).populate('employeeId', 'personalInfo.firstName personalInfo.lastName');
  }

  /**
   * Create or update today's DWR
   */
  async createOrUpdateTodayDWR(employeeId, organizationId, userId, data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dwr = await DailyWorkReport.findOne({
      employeeId,
      date: today
    });

    if (dwr) {
      // Update existing
      Object.assign(dwr, data, { updatedBy: userId });
      await dwr.save();
    } else {
      // Create new
      dwr = new DailyWorkReport({
        organizationId,
        employeeId,
        date: today,
        ...data,
        createdBy: userId
      });
      await dwr.save();
    }

    return this.getDWRById(dwr._id, organizationId);
  }

  /**
   * Submit hourly report
   */
  async submitHourlyReport(employeeId, organizationId, userId, data, file) {
    const { hourSlot, workDescription } = data;

    // Validate hour slot is in the past
    const now = new Date();
    const [startHour, startMin] = hourSlot.split('-')[0].split(':').map(Number);
    const slotEndTime = new Date(now);
    slotEndTime.setHours(startHour + 1, startMin, 0, 0);

    if (now < slotEndTime) {
      throw new Error('Cannot submit report for current or future hour slots');
    }

    // Get or create today's DWR
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dwr = await DailyWorkReport.findOne({
      employeeId,
      date: today
    });

    if (!dwr) {
      dwr = new DailyWorkReport({
        organizationId,
        employeeId,
        date: today,
        createdBy: userId,
        status: 'submitted'
      });
    }

    // Prepare hourly report data
    const hourlyReport = {
      hourSlot,
      workDescription,
      submittedAt: new Date()
    };

    // Handle file upload
    if (file) {
      hourlyReport.proofUrl = `/uploads/dwr-proofs/${file.filename}`;
      const ext = file.filename.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png'].includes(ext)) {
        hourlyReport.proofType = 'image';
      } else if (ext === 'pdf') {
        hourlyReport.proofType = 'document';
      } else if (['doc', 'docx'].includes(ext)) {
        hourlyReport.proofType = 'document';
      } else {
        hourlyReport.proofType = 'other';
      }
    }

    // Check if report already exists for this hour slot
    const existingIndex = dwr.hourlyReports.findIndex(r => r.hourSlot === hourSlot);
    if (existingIndex !== -1) {
      // Update existing report
      dwr.hourlyReports[existingIndex] = hourlyReport;
    } else {
      // Add new report
      dwr.hourlyReports.push(hourlyReport);
    }

    // Mark status as submitted if not already
    if (dwr.status === 'draft') {
      dwr.status = 'submitted';
      dwr.submittedAt = new Date();
    }

    dwr.updatedBy = userId;
    await dwr.save();

    return this.getDWRById(dwr._id, organizationId);
  }

  /**
   * Get DWR performance stats for organization
   */
  async getDWRPerformanceStats(organizationId, month, year) {
    return DailyWorkReport.getDWRPerformanceStats(organizationId, month, year);
  }
}

export default new DWRService();