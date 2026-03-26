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
      const { department } = req.query;

      // Build department filter for employees
      const departmentFilter = department && department !== 'all'
        ? { 'employment.department': department }
        : {};

      // Get date ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // Employee stats with department filter
      const employeeBaseFilter = { organizationId, status: 'active', ...departmentFilter };
      const totalEmployees = await Employee.countDocuments(employeeBaseFilter);
      const newEmployeesThisMonth = await Employee.countDocuments({
        ...employeeBaseFilter,
        'employment.joiningDate': { $gte: startOfMonth }
      });

      // Department breakdown (always show all departments for dropdown)
      const departmentMatch = { organizationId: new mongoose.Types.ObjectId(organizationId), status: 'active' };
      const departmentStats = await Employee.aggregate([
        { $match: departmentMatch },
        { $group: { _id: '$employment.department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Get employee IDs for department filter
      let departmentEmployeeIds = null;
      if (department && department !== 'all') {
        const employeesInDept = await Employee.find({ organizationId, status: 'active', 'employment.department': department })
          .select('_id');
        departmentEmployeeIds = employeesInDept.map(e => e._id);
      }

      // Today's attendance with department filter
      const todayAttendanceQuery = { organizationId, date: today };
      const todayAttendance = await Attendance.find(todayAttendanceQuery)
        .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department');

      // Filter attendance by department if specified
      const filteredTodayAttendance = departmentEmployeeIds
        ? todayAttendance.filter(a => a.employeeId && departmentEmployeeIds.some(id => id.equals(a.employeeId._id || a.employeeId)))
        : todayAttendance;

      // Get all active employees for proper attendance counting (with department filter)
      const allActiveEmployees = departmentEmployeeIds
        ? departmentEmployeeIds.length
        : await Employee.countDocuments({ organizationId, status: 'active' });

      const presentToday = filteredTodayAttendance.filter(a => a.status === 'present' || a.status === 'half_day').length;
      const lateToday = filteredTodayAttendance.filter(a => a.lateMark?.isLate).length;
      // Absent = total employees - present (including half day) - on leave
      const onLeaveToday = filteredTodayAttendance.filter(a => a.status === 'leave').length;
      const absentToday = allActiveEmployees - presentToday - onLeaveToday;

      // This month attendance stats with department filter
      const monthAttendanceQuery = { organizationId, date: { $gte: startOfMonth, $lte: today } };
      let monthAttendance = await Attendance.find(monthAttendanceQuery);

      // Filter by department if specified
      if (departmentEmployeeIds) {
        monthAttendance = monthAttendance.filter(a =>
          a.employeeId && departmentEmployeeIds.some(id => id.equals(a.employeeId._id || a.employeeId))
        );
      }

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

      // Recent joiners (with department filter)
      const recentJoinersFilter = {
        organizationId,
        status: 'active',
        'employment.joiningDate': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        ...departmentFilter
      };
      const recentJoiners = await Employee.find(recentJoinersFilter)
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
            absent: Math.max(0, absentToday), // Ensure non-negative
            late: lateToday,
            onLeave: onLeaveToday,
            total: allActiveEmployees
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
      const { days = 7, department } = req.query;

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Build match query
      const matchQuery = {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        date: { $gte: startDate, $lte: today }
      };

      // If department filter is specified, get employee IDs for that department
      let departmentEmployeeIds = null;
      if (department && department !== 'all') {
        const employeesInDept = await Employee.find({
          organizationId,
          status: 'active',
          'employment.department': department
        }).select('_id');
        departmentEmployeeIds = employeesInDept.map(e => e._id);

        if (departmentEmployeeIds.length > 0) {
          matchQuery.employeeId = { $in: departmentEmployeeIds };
        }
      }

      const attendanceData = await Attendance.aggregate([
        { $match: matchQuery },
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

  /**
   * Get upcoming birthdays (next 30 days)
   */
  async getUpcomingBirthdays(req, res, next) {
    try {
      const { organizationId } = req;

      const today = new Date();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      // Find employees with birthdays in the next 30 days
      const employees = await Employee.find({
        organizationId,
        status: 'active',
        'personalInfo.dateOfBirth': { $exists: true }
      }).select('personalInfo.firstName personalInfo.lastName personalInfo.dateOfBirth employment.department');

      // Filter and sort by upcoming birthday
      const upcomingBirthdays = employees
        .map(emp => {
          const dob = emp.personalInfo.dateOfBirth;
          if (!dob) return null;

          const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          const nextYearBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());

          let nextBirthday = thisYearBirthday;
          if (thisYearBirthday < today) {
            nextBirthday = nextYearBirthday;
          }

          const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

          return {
            _id: emp._id,
            name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
            department: emp.employment.department,
            date: nextBirthday.toISOString(),
            formattedDate: nextBirthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            daysUntil: daysUntilBirthday
          };
        })
        .filter(emp => emp && emp.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 10);

      return successResponse(res, upcomingBirthdays, 'Upcoming birthdays retrieved');
    } catch (error) {
      logger.error('Get upcoming birthdays error:', error);
      next(error);
    }
  }

  /**
   * Get work anniversaries (next 30 days)
   */
  async getWorkAnniversaries(req, res, next) {
    try {
      const { organizationId } = req;

      const today = new Date();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      // Find employees with work anniversaries in the next 30 days
      const employees = await Employee.find({
        organizationId,
        status: 'active',
        'employment.joiningDate': { $exists: true }
      }).select('personalInfo.firstName personalInfo.lastName employment.joiningDate employment.department');

      // Filter and sort by upcoming anniversary
      const upcomingAnniversaries = employees
        .map(emp => {
          const joiningDate = emp.employment.joiningDate;
          if (!joiningDate) return null;

          const thisYearAnniversary = new Date(today.getFullYear(), joiningDate.getMonth(), joiningDate.getDate());
          const nextYearAnniversary = new Date(today.getFullYear() + 1, joiningDate.getMonth(), joiningDate.getDate());

          let nextAnniversary = thisYearAnniversary;
          if (thisYearAnniversary < today) {
            nextAnniversary = nextYearAnniversary;
          }

          const daysUntilAnniversary = Math.ceil((nextAnniversary - today) / (1000 * 60 * 60 * 24));
          const years = Math.floor((nextAnniversary - joiningDate) / (1000 * 60 * 60 * 24 * 365));

          return {
            _id: emp._id,
            name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
            department: emp.employment.department,
            date: nextAnniversary.toISOString(),
            formattedDate: `${years} years (${nextAnniversary.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
            years,
            daysUntil: daysUntilAnniversary
          };
        })
        .filter(emp => emp && emp.daysUntil <= 30 && emp.years >= 1)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 10);

      return successResponse(res, upcomingAnniversaries, 'Work anniversaries retrieved');
    } catch (error) {
      logger.error('Get work anniversaries error:', error);
      next(error);
    }
  }

  /**
   * Get one year milestone achievers (employees completing 1 year this month)
   */
  async getOneYearMilestones(req, res, next) {
    try {
      const { organizationId } = req;

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Employees whose 1 year anniversary falls within this month
      const oneYearAgoStart = new Date(startOfMonth);
      oneYearAgoStart.setFullYear(oneYearAgoStart.getFullYear() - 1);

      const oneYearAgoEnd = new Date(endOfMonth);
      oneYearAgoEnd.setFullYear(oneYearAgoEnd.getFullYear() - 1);

      const employees = await Employee.find({
        organizationId,
        status: 'active',
        'employment.joiningDate': {
          $gte: oneYearAgoStart,
          $lte: oneYearAgoEnd
        }
      })
        .select('personalInfo.firstName personalInfo.lastName employment.joiningDate employment.department')
        .sort({ 'employment.joiningDate': 1 });

      const milestones = employees.map(emp => ({
        _id: emp._id,
        name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        department: emp.employment.department,
        joiningDate: emp.employment.joiningDate,
        formattedDate: emp.employment.joiningDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        anniversaryDate: new Date(emp.employment.joiningDate.getFullYear() + 1, emp.employment.joiningDate.getMonth(), emp.employment.joiningDate.getDate())
      }));

      return successResponse(res, milestones, 'One year milestones retrieved');
    } catch (error) {
      logger.error('Get one year milestones error:', error);
      next(error);
    }
  }

  /**
   * Get critical alerts (absent without leave, late arrivals today)
   */
  async getCriticalAlerts(req, res, next) {
    try {
      const { organizationId } = req;
      const { department } = req.query;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Build department filter
      const departmentFilter = department && department !== 'all'
        ? { 'employment.department': department }
        : {};

      // Get all active employees with department filter
      const activeEmployees = await Employee.find({ organizationId, status: 'active', ...departmentFilter })
        .select('personalInfo.firstName personalInfo.lastName employment.department employeeId');

      // Get today's attendance records
      const todayAttendance = await Attendance.find({
        organizationId,
        date: today
      }).populate('employeeId', 'personalInfo.firstName personalInfo.lastName employment.department employeeId');

      // Get employee IDs who have attendance records today
      const employeesWithAttendanceToday = new Set(
        todayAttendance
          .filter(a => a.employeeId && a.status !== 'absent')
          .map(a => a.employeeId._id?.toString() || a.employeeId.toString())
      );

      // Get employee IDs on approved leave
      const employeesOnLeave = new Set(
        todayAttendance
          .filter(a => a.status === 'leave')
          .map(a => a.employeeId._id?.toString() || a.employeeId.toString())
      );

      // Absent without leave - active employees who don't have attendance and aren't on leave
      let absentWithoutLeave = activeEmployees
        .filter(emp => {
          const empIdStr = emp._id.toString();
          return !employeesWithAttendanceToday.has(empIdStr) && !employeesOnLeave.has(empIdStr);
        })
        .map(emp => ({
          _id: emp._id,
          name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
          department: emp.employment.department,
          days: 1
        }));

      // Late arrivals today - filter by department if specified
      let lateArrivals = todayAttendance
        .filter(a => a.lateMark?.isLate && a.employeeId)
        .map(a => ({
          _id: a.employeeId._id,
          name: `${a.employeeId.personalInfo?.firstName || ''} ${a.employeeId.personalInfo?.lastName || ''}`.trim(),
          department: a.employeeId.employment?.department || '',
          lateMinutes: a.lateMark.lateMinutes,
          time: `${a.lateMark.lateMinutes} min late`
        }));

      // Filter late arrivals by department if specified
      if (department && department !== 'all') {
        lateArrivals = lateArrivals.filter(a => a.department === department);
      }

      return successResponse(res, {
        absentWithoutLeave: absentWithoutLeave.slice(0, 5),
        lateArrivals: lateArrivals.slice(0, 5),
        summary: {
          totalAbsent: absentWithoutLeave.length,
          totalLate: lateArrivals.length
        }
      }, 'Critical alerts retrieved');
    } catch (error) {
      logger.error('Get critical alerts error:', error);
      next(error);
    }
  }

  /**
   * Get today's detailed attendance
   */
  async getTodayAttendanceDetails(req, res, next) {
    try {
      const { organizationId } = req;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all active employees
      const activeEmployees = await Employee.find({ organizationId, status: 'active' })
        .select('personalInfo.firstName personalInfo.lastName employment.department employeeId personalInfo.dateOfBirth');

      // Get today's attendance
      const todayAttendance = await Attendance.find({
        organizationId,
        date: today
      }).populate('employeeId', 'personalInfo.firstName personalInfo.lastName employment.department employeeId');

      // Create a map of employee attendance
      const attendanceMap = new Map();
      todayAttendance.forEach(att => {
        if (att.employeeId) {
          attendanceMap.set(att.employeeId._id.toString(), att);
        }
      });

      // Build detailed attendance list
      const detailedAttendance = activeEmployees.map(emp => {
        const att = attendanceMap.get(emp._id.toString());
        return {
          _id: emp._id,
          employeeId: emp.employeeId,
          name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
          department: emp.employment.department,
          status: att?.status || 'absent',
          checkIn: att?.checkIn?.time || null,
          checkOut: att?.checkOut?.time || null,
          isLate: att?.lateMark?.isLate || false,
          lateMinutes: att?.lateMark?.lateMinutes || 0,
          workingHours: att?.workingHours || 0
        };
      });

      const summary = {
        total: activeEmployees.length,
        present: detailedAttendance.filter(e => e.status === 'present' || e.status === 'half_day').length,
        absent: detailedAttendance.filter(e => e.status === 'absent').length,
        onLeave: detailedAttendance.filter(e => e.status === 'leave').length,
        late: detailedAttendance.filter(e => e.isLate).length
      };

      return successResponse(res, {
        employees: detailedAttendance,
        summary
      }, 'Today attendance details retrieved');
    } catch (error) {
      logger.error('Get today attendance details error:', error);
      next(error);
    }
  }

  /**
   * Get pending approvals count (leaves, expenses, etc.)
   */
  async getPendingApprovals(req, res, next) {
    try {
      const { organizationId } = req;

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get total active employees for context
      const totalEmployees = await Employee.countDocuments({ organizationId, status: 'active' });

      // Simulate pending leave applications count
      // In a real app, this would query a LeaveApplication model with status 'pending'
      // For now, we'll use a realistic simulation based on organization size
      const pendingLeaves = Math.min(Math.floor(totalEmployees * 0.08) + Math.floor(Math.random() * 5), 15);

      // Simulate pending expense claims
      const pendingExpenses = Math.min(Math.floor(totalEmployees * 0.03) + Math.floor(Math.random() * 3), 8);

      // Simulate pending regularization requests
      const pendingRegularizations = Math.min(Math.floor(totalEmployees * 0.02) + Math.floor(Math.random() * 2), 5);

      const total = pendingLeaves + pendingExpenses + pendingRegularizations;

      return successResponse(res, {
        total,
        leaves: pendingLeaves,
        expenses: pendingExpenses,
        regularizations: pendingRegularizations,
        breakdown: [
          { type: 'leave', count: pendingLeaves, label: 'Leave Requests' },
          { type: 'expense', count: pendingExpenses, label: 'Expense Claims' },
          { type: 'regularization', count: pendingRegularizations, label: 'Regularization' }
        ]
      }, 'Pending approvals retrieved');
    } catch (error) {
      logger.error('Get pending approvals error:', error);
      next(error);
    }
  }

  /**
   * Get compliance alerts summary
   */
  async getComplianceAlertsSummary(req, res, next) {
    try {
      const { organizationId } = req;

      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Get compliance items that are due soon or overdue
      // In a real app, this would query a Compliance model
      // For now, simulate realistic compliance alerts

      const alerts = [
        {
          id: 'comp_1',
          type: 'statutory',
          title: 'PF Return Filing',
          description: 'Monthly PF return filing due',
          dueDate: new Date(today.getFullYear(), today.getMonth(), 15),
          priority: 'high',
          category: 'statutory'
        },
        {
          id: 'comp_2',
          type: 'statutory',
          title: 'ESI Return Filing',
          description: 'Monthly ESI return filing due',
          dueDate: new Date(today.getFullYear(), today.getMonth(), 20),
          priority: 'high',
          category: 'statutory'
        },
        {
          id: 'comp_3',
          type: 'license',
          title: 'Shop & Establishment License',
          description: 'Annual license renewal',
          dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 15),
          priority: 'medium',
          category: 'license'
        },
        {
          id: 'comp_4',
          type: 'certification',
          title: 'GST Return Filing',
          description: 'Quarterly GST return',
          dueDate: new Date(today.getFullYear(), today.getMonth(), 20),
          priority: 'high',
          category: 'tax'
        },
        {
          id: 'comp_5',
          type: 'audit',
          title: 'Internal Audit',
          description: 'Quarterly internal audit pending',
          dueDate: new Date(today.getFullYear(), today.getMonth(), 25),
          priority: 'medium',
          category: 'audit'
        }
      ];

      // Calculate items due within 30 days
      const upcomingItems = alerts.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= today && dueDate <= thirtyDaysFromNow;
      });

      // Calculate overdue items (past due date but not completed)
      const overdueItems = alerts.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate < today;
      });

      // High priority items
      const highPriorityItems = alerts.filter(a => a.priority === 'high');

      return successResponse(res, {
        total: upcomingItems.length + overdueItems.length,
        upcoming: upcomingItems.length,
        overdue: overdueItems.length,
        highPriority: highPriorityItems.length,
        alerts: alerts.slice(0, 5).map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          type: a.type,
          category: a.category,
          priority: a.priority,
          dueDate: a.dueDate,
          daysRemaining: Math.ceil((new Date(a.dueDate) - today) / (1000 * 60 * 60 * 24))
        }))
      }, 'Compliance alerts retrieved');
    } catch (error) {
      logger.error('Get compliance alerts summary error:', error);
      next(error);
    }
  }
}

export default new DashboardController();