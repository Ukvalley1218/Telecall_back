import mongoose from 'mongoose';
import Employee from '../../models/Employee.js';
import Attendance from '../../models/Attendance.js';
import Candidate from '../../models/Candidate.js';
import JobOpening from '../../models/JobOpening.js';
import Incentive from '../../models/Incentive.js';
import Shift from '../../models/Shift.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class DashboardController {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req, res, next) {
    try {
      const { organizationId } = req;

      // Get date ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // Employee stats
      const totalEmployees = await Employee.countDocuments({ organizationId, status: 'active' });
      const newEmployeesThisMonth = await Employee.countDocuments({
        organizationId,
        status: 'active',
        'employment.joiningDate': { $gte: startOfMonth }
      });

      // Department breakdown
      const departmentStats = await Employee.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), status: 'active' } },
        { $group: { _id: '$employment.department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Today's attendance
      const todayAttendance = await Attendance.find({
        organizationId,
        date: today
      }).populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department');

      const presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'half_day').length;
      const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
      const lateToday = todayAttendance.filter(a => a.lateMark?.isLate).length;

      // This month attendance stats
      const monthAttendance = await Attendance.find({
        organizationId,
        date: { $gte: startOfMonth, $lte: today }
      });

      const attendanceRate = monthAttendance.length > 0
        ? ((monthAttendance.filter(a => a.status === 'present').length / monthAttendance.length) * 100).toFixed(1)
        : 0;

      // Recruitment stats
      const activeJobs = await JobOpening.countDocuments({ organizationId, status: 'active', isActive: true });
      const totalCandidates = await Candidate.countDocuments({ organizationId });
      const newCandidatesThisMonth = await Candidate.countDocuments({
        organizationId,
        appliedAt: { $gte: startOfMonth }
      });

      // Candidate pipeline
      const candidatePipeline = await Candidate.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Incentive stats
      const pendingIncentives = await Incentive.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$incentiveAmount' }, count: { $sum: 1 } } }
      ]);

      const paidIncentivesThisMonth = await Incentive.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'paid',
            paymentDate: { $gte: startOfMonth, $lte: today }
          }
        },
        { $group: { _id: null, total: { $sum: '$incentiveAmount' }, count: { $sum: 1 } } }
      ]);

      // Late mark stats this month
      const lateMarksThisMonth = await Attendance.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            date: { $gte: startOfMonth, $lte: today },
            'lateMark.isLate': true
          }
        },
        { $group: { _id: '$employeeId', count: { $sum: 1 } } }
      ]);

      // Shifts
      const totalShifts = await Shift.countDocuments({ organizationId, isActive: true });

      // Recent joiners
      const recentJoiners = await Employee.find({
        organizationId,
        status: 'active',
        'employment.joiningDate': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
        .sort({ 'employment.joiningDate': -1 })
        .limit(5)
        .select('employeeId personalInfo.firstName personalInfo.lastName employment.department employment.designation employment.joiningDate');

      // Upcoming interviews
      const upcomingInterviews = await Candidate.find({
        organizationId,
        status: 'interview_scheduled',
        'interviewDetails.scheduledAt': { $gte: today }
      })
        .sort({ 'interviewDetails.scheduledAt': 1 })
        .limit(5)
        .select('name position department interviewDetails');

      const stats = {
        employees: {
          total: totalEmployees,
          newThisMonth: newEmployeesThisMonth,
          byDepartment: departmentStats.map(d => ({ department: d._id, count: d.count }))
        },
        attendance: {
          today: {
            present: presentToday,
            absent: absentToday,
            late: lateToday,
            total: todayAttendance.length
          },
          thisMonth: {
            attendanceRate: parseFloat(attendanceRate),
            totalDays: monthAttendance.length,
            lateMarks: lateMarksThisMonth.length
          }
        },
        recruitment: {
          activeJobs,
          totalCandidates,
          newCandidatesThisMonth,
          pipeline: candidatePipeline.map(p => ({ status: p._id, count: p.count }))
        },
        incentives: {
          pending: {
            amount: pendingIncentives[0]?.total || 0,
            count: pendingIncentives[0]?.count || 0
          },
          paidThisMonth: {
            amount: paidIncentivesThisMonth[0]?.total || 0,
            count: paidIncentivesThisMonth[0]?.count || 0
          }
        },
        shifts: totalShifts,
        recentJoiners,
        upcomingInterviews
      };

      return successResponse(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      next(error);
    }
  }

  /**
   * Get attendance chart data
   */
  async getAttendanceChartData(req, res, next) {
    try {
      const { organizationId } = req;
      const { days = 7 } = req.query;

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - parseInt(days));

      const attendanceData = await Attendance.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            date: { $gte: startDate, $lte: today }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
            },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
            },
            late: {
              $sum: { $cond: ['$lateMark.isLate', 1, 0] }
            },
            halfDay: {
              $sum: { $cond: [{ $eq: ['$status', 'half_day'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      return successResponse(res, attendanceData, 'Attendance chart data retrieved');
    } catch (error) {
      logger.error('Get attendance chart data error:', error);
      next(error);
    }
  }

  /**
   * Get recruitment funnel data
   */
  async getRecruitmentFunnel(req, res, next) {
    try {
      const { organizationId } = req;

      const funnel = await Candidate.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const stages = ['applied', 'shortlisted', 'screening', 'interview_scheduled', 'selected', 'training', 'offer_sent', 'rejected'];
      const result = stages.map(stage => ({
        stage,
        count: funnel.find(f => f._id === stage)?.count || 0
      }));

      return successResponse(res, result, 'Recruitment funnel retrieved');
    } catch (error) {
      logger.error('Get recruitment funnel error:', error);
      next(error);
    }
  }

  /**
   * Get department distribution
   */
  async getDepartmentDistribution(req, res, next) {
    try {
      const { organizationId } = req;

      const distribution = await Employee.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), status: 'active' } },
        {
          $group: {
            _id: '$employment.department',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return successResponse(res, distribution, 'Department distribution retrieved');
    } catch (error) {
      logger.error('Get department distribution error:', error);
      next(error);
    }
  }
}

export default new DashboardController();