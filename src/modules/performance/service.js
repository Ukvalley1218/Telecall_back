import mongoose from 'mongoose';
import PerformanceRecord from '../../models/PerformanceRecord.js';
import Employee from '../../models/Employee.js';
import KPI from '../../models/KPI.js';
import Incentive from '../../models/Incentive.js';
import Attendance from '../../models/Attendance.js';

class PerformanceService {
  /**
   * Get performance records with filters
   */
  async getPerformanceRecords(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    if (filters.employeeId) query.employeeId = filters.employeeId;
    if (filters.month) query.month = parseInt(filters.month);
    if (filters.year) query.year = parseInt(filters.year);
    if (filters.grade) query.grade = filters.grade;
    if (filters.status) query.status = filters.status;

    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const records = await PerformanceRecord.find(query)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .populate('managerReview.reviewedBy', 'personalInfo.firstName personalInfo.lastName')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PerformanceRecord.countDocuments(query);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get performance record by ID
   */
  async getPerformanceRecordById(id, organizationId) {
    return PerformanceRecord.findOne({ _id: id, organizationId })
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .populate('managerReview.reviewedBy', 'personalInfo.firstName personalInfo.lastName')
      .populate('kpiScores.kpiId', 'name group unit');
  }

  /**
   * Create or update performance record
   */
  async createOrUpdatePerformanceRecord(data) {
    const { organizationId, employeeId, month, year } = data;

    // Check if record exists
    let record = await PerformanceRecord.findOne({ employeeId, month, year });

    if (record) {
      // Update existing
      Object.assign(record, data);
      await record.save();
    } else {
      // Create new
      record = new PerformanceRecord(data);
      await record.save();
    }

    return this.getPerformanceRecordById(record._id, organizationId);
  }

  /**
   * Calculate performance for employee
   */
  async calculatePerformance(employeeId, month, year) {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get KPI scores
    const kpiScores = await this.calculateKPIScores(employeeId, month, year);

    // Get attendance data
    const attendanceData = await this.calculateAttendanceScore(employeeId, month, year);

    // Get incentive data
    const incentiveData = await this.calculateIncentiveScore(employeeId, month, year);

    // Create performance record
    const record = new PerformanceRecord({
      organizationId: employee.organizationId,
      employeeId,
      month,
      year,
      kpiScores,
      kpiScore: this.calculateWeightedKPIScore(kpiScores),
      kpiWeightage: 0.6,
      attendance: attendanceData,
      attendanceWeightage: 0.2,
      incentives: incentiveData,
      incentiveWeightage: 0.2,
      createdBy: employee.userId
    });

    await record.save();
    return record;
  }

  /**
   * Calculate KPI scores
   */
  async calculateKPIScores(employeeId, month, year) {
    const employee = await Employee.findById(employeeId)
      .populate('assignedKPIs.kpiId');

    const kpiScores = [];

    for (const assigned of employee.assignedKPIs || []) {
      if (!assigned.kpiId) continue;

      // Get actual achieved value (would come from KPI tracking)
      // For now, we'll use a placeholder calculation
      const achievedValue = assigned.targetValue * (0.8 + Math.random() * 0.4); // 80-120% of target

      kpiScores.push({
        kpiId: assigned.kpiId._id,
        kpiName: assigned.kpiId.name,
        group: assigned.kpiId.group,
        targetValue: assigned.targetValue,
        achievedValue: achievedValue,
        weightage: assigned.kpiId.weightage || 1
      });
    }

    return kpiScores;
  }

  /**
   * Calculate weighted KPI score
   */
  calculateWeightedKPIScore(kpiScores) {
    if (!kpiScores || kpiScores.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalWeightage = 0;

    for (const kpi of kpiScores) {
      const score = kpi.targetValue > 0
        ? Math.min(100, (kpi.achievedValue / kpi.targetValue) * 100)
        : 0;
      kpi.score = score;
      kpi.weightedScore = score * kpi.weightage;
      totalWeightedScore += kpi.weightedScore;
      totalWeightage += kpi.weightage;
    }

    return totalWeightage > 0 ? totalWeightedScore / totalWeightage : 0;
  }

  /**
   * Calculate attendance score
   */
  async calculateAttendanceScore(employeeId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    const workingDays = this.getWorkingDays(startDate, endDate);
    const presentDays = attendances.filter(a => a.status === 'present').length;
    const absentDays = attendances.filter(a => a.status === 'absent').length;
    const halfDays = attendances.filter(a => a.status === 'half_day').length;
    const lateMarks = attendances.filter(a => a.lateMinutes > 0).length;
    const paidLeaves = attendances.filter(a => a.status === 'leave' && a.leaveType === 'paid').length;
    const unpaidLeaves = attendances.filter(a => a.status === 'leave' && a.leaveType === 'unpaid').length;

    const attendancePercentage = ((presentDays + paidLeaves + halfDays * 0.5) / workingDays) * 100;
    const penalty = (unpaidLeaves * 5) + (lateMarks * 1);
    const score = Math.max(0, Math.min(100, attendancePercentage - penalty));

    return {
      workingDays,
      presentDays,
      absentDays,
      halfDays,
      lateMarks,
      paidLeaves,
      unpaidLeaves,
      attendancePercentage,
      score
    };
  }

  /**
   * Calculate incentive score
   */
  async calculateIncentiveScore(employeeId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const incentives = await Incentive.find({
      employeeId,
      status: 'paid',
      paidDate: { $gte: startDate, $lte: endDate }
    });

    const totalIncentives = incentives.reduce((sum, i) => sum + i.incentiveAmount, 0);
    const incentiveCount = incentives.length;

    // Target incentives could be configurable per employee
    const targetIncentives = 50000; // Placeholder

    const score = targetIncentives > 0
      ? Math.min(100, (totalIncentives / targetIncentives) * 100)
      : Math.min(100, 50 + incentiveCount * 10);

    return {
      totalIncentives,
      incentiveCount,
      targetIncentives,
      score
    };
  }

  /**
   * Get working days in a month
   */
  getWorkingDays(startDate, endDate) {
    let workingDays = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Submit self review
   */
  async submitSelfReview(id, organizationId, data) {
    const record = await PerformanceRecord.findOne({ _id: id, organizationId });
    if (!record) {
      throw new Error('Performance record not found');
    }

    await record.submitSelfReview(data, data.userId);
    return this.getPerformanceRecordById(id, organizationId);
  }

  /**
   * Add manager review
   */
  async addManagerReview(id, organizationId, managerId, data) {
    const record = await PerformanceRecord.findOne({ _id: id, organizationId });
    if (!record) {
      throw new Error('Performance record not found');
    }

    await record.addManagerReview(managerId, data);
    return this.getPerformanceRecordById(id, organizationId);
  }

  /**
   * Get employee performance history
   */
  async getEmployeeHistory(employeeId, year) {
    return PerformanceRecord.getEmployeeHistory(employeeId, year);
  }

  /**
   * Get organization performance summary
   */
  async getOrganizationSummary(organizationId, month, year) {
    return PerformanceRecord.getOrganizationSummary(organizationId, month, year);
  }

  /**
   * Get top performers
   */
  async getTopPerformers(organizationId, month, year, limit = 10) {
    const records = await PerformanceRecord.find({
      organizationId,
      month,
      year,
      status: { $in: ['submitted', 'reviewed', 'approved'] }
    })
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
      .sort({ finalScore: -1 })
      .limit(limit);

    return records;
  }

  /**
   * Get performance dashboard stats
   */
  async getDashboardStats(organizationId, month, year) {
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const [
      summary,
      gradeDistribution,
      topPerformers,
      pendingReviews
    ] = await Promise.all([
      this.getOrganizationSummary(organizationId, currentMonth, currentYear),
      this.getGradeDistribution(organizationId, currentMonth, currentYear),
      this.getTopPerformers(organizationId, currentMonth, currentYear, 5),
      this.getPendingReviews(organizationId)
    ]);

    return {
      summary,
      gradeDistribution,
      topPerformers,
      pendingReviews
    };
  }

  /**
   * Get grade distribution
   */
  async getGradeDistribution(organizationId, month, year) {
    const distribution = await PerformanceRecord.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          month,
          year
        }
      },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      'A+': distribution.find(d => d._id === 'A+')?.count || 0,
      'A': distribution.find(d => d._id === 'A')?.count || 0,
      'B+': distribution.find(d => d._id === 'B+')?.count || 0,
      'B': distribution.find(d => d._id === 'B')?.count || 0,
      'C': distribution.find(d => d._id === 'C')?.count || 0,
      'D': distribution.find(d => d._id === 'D')?.count || 0,
      'F': distribution.find(d => d._id === 'F')?.count || 0
    };
  }

  /**
   * Get pending reviews
   */
  async getPendingReviews(organizationId) {
    return PerformanceRecord.find({
      organizationId,
      status: 'submitted'
    })
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
      .sort({ createdAt: 1 });
  }
}

export default new PerformanceService();