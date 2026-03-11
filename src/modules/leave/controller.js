import mongoose from 'mongoose';
import Employee from '../../models/Employee.js';
import Attendance from '../../models/Attendance.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

// Leave types configuration
const LEAVE_TYPES = {
  casual: { name: 'Casual Leave', annual: 12, color: '#4CAF50' },
  sick: { name: 'Sick Leave', annual: 6, color: '#F44336' },
  earned: { name: 'Earned Leave', annual: 15, color: '#2196F3' },
  unpaid: { name: 'Unpaid Leave', annual: 0, color: '#9E9E9E' },
  comp_off: { name: 'Compensatory Off', annual: 0, color: '#FF9800' }
};

class LeaveController {
  /**
   * Get leave balance for all employees
   */
  async getLeaveBalances(req, res, next) {
    try {
      const { organizationId } = req;
      const { department, employeeId } = req.query;

      // Build query
      const query = { organizationId, status: 'active' };
      if (department && department !== 'all') {
        query['employment.department'] = new RegExp(department, 'i');
      }
      if (employeeId) {
        query._id = employeeId;
      }

      const employees = await Employee.find(query)
        .select('employeeId personalInfo.firstName personalInfo.lastName employment.department employment.designation employment.joiningDate')
        .sort({ 'employment.department': 1, 'personalInfo.firstName': 1 });

      const currentYear = new Date().getFullYear();
      const leaveBalances = employees.map(employee => {
        const joiningYear = new Date(employee.employment.joiningDate).getFullYear();
        const yearsOfService = currentYear - joiningYear;

        // Calculate pro-rated leaves for new joiners
        const isProRated = joiningYear === currentYear;
        const monthsWorked = isProRated ? new Date().getMonth() + 1 : 12;

        const balances = {};
        Object.entries(LEAVE_TYPES).forEach(([type, config]) => {
          if (type === 'unpaid' || type === 'comp_off') {
            balances[type] = {
              ...config,
              allocated: 0,
              used: 0,
              balance: 0
            };
          } else {
            const allocated = isProRated ? Math.floor((config.annual / 12) * monthsWorked) : config.annual;
            // Simulate some used leaves
            const used = Math.floor(Math.random() * Math.min(allocated, 5));
            balances[type] = {
              ...config,
              allocated,
              used,
              balance: allocated - used
            };
          }
        });

        return {
          employeeId: employee._id,
          employeeCode: employee.employeeId,
          name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          department: employee.employment.department,
          designation: employee.employment.designation,
          joiningDate: employee.employment.joiningDate,
          yearsOfService,
          balances,
          totalBalance: Object.values(balances).reduce((sum, b) => sum + b.balance, 0)
        };
      });

      return successResponse(res, leaveBalances, 'Leave balances retrieved successfully');
    } catch (error) {
      logger.error('Get leave balances error:', error);
      next(error);
    }
  }

  /**
   * Get leave applications
   */
  async getLeaveApplications(req, res, next) {
    try {
      const { organizationId } = req;
      const { employeeId, status, department } = req.query;

      // Simulated leave applications (in real app, this would come from a LeaveApplication model)
      const employees = await Employee.find({ organizationId, status: 'active' })
        .select('employeeId personalInfo.firstName personalInfo.lastName employment.department');

      // Generate sample leave applications
      const leaveApplications = [];
      const statuses = ['pending', 'approved', 'rejected'];
      const leaveTypes = Object.keys(LEAVE_TYPES);

      for (let i = 0; i < 15; i++) {
        const employee = employees[Math.floor(Math.random() * employees.length)];
        if (!employee) continue;

        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
        const days = Math.floor(Math.random() * 5) + 1;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days - 1);

        leaveApplications.push({
          id: `LA${String(i + 1).padStart(4, '0')}`,
          employeeId: employee._id,
          employeeCode: employee.employeeId,
          employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          department: employee.employment.department,
          leaveType,
          leaveTypeName: LEAVE_TYPES[leaveType].name,
          startDate,
          endDate,
          days,
          reason: this.getRandomLeaveReason(leaveType),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          appliedAt: new Date(startDate.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
          approvedBy: Math.random() > 0.3 ? 'Admin User' : null,
          approvedAt: Math.random() > 0.3 ? new Date() : null,
          rejectionReason: null
        });
      }

      // Apply filters
      let filtered = leaveApplications;
      if (employeeId) {
        filtered = filtered.filter(l => l.employeeId.toString() === employeeId);
      }
      if (status && status !== 'all') {
        filtered = filtered.filter(l => l.status === status);
      }
      if (department && department !== 'all') {
        filtered = filtered.filter(l => l.department.includes(department));
      }

      return successResponse(res, filtered, 'Leave applications retrieved successfully');
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
      const { employeeId, leaveType, startDate, endDate, reason, halfDay } = req.body;

      // Calculate days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = halfDay ? 0.5 : Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // In a real app, you would save to database
      const leaveApplication = {
        id: `LA${Date.now()}`,
        employeeId,
        leaveType,
        leaveTypeName: LEAVE_TYPES[leaveType]?.name || leaveType,
        startDate: start,
        endDate: end,
        days,
        halfDay: halfDay || false,
        reason,
        status: 'pending',
        appliedAt: new Date(),
        appliedBy: user._id
      };

      logger.info(`Leave application created: ${leaveApplication.id} for employee ${employeeId}`);

      return createdResponse(res, leaveApplication, 'Leave application submitted successfully');
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
      const { notes } = req.body;

      // In a real app, you would update the database
      logger.info(`Leave application ${id} approved by user ${user._id}`);

      return successResponse(res, {
        id,
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date(),
        notes
      }, 'Leave application approved');
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

      logger.info(`Leave application ${id} rejected by user ${user._id}`);

      return successResponse(res, {
        id,
        status: 'rejected',
        rejectedBy: user._id,
        rejectedAt: new Date(),
        rejectionReason: reason
      }, 'Leave application rejected');
    } catch (error) {
      logger.error('Reject leave error:', error);
      next(error);
    }
  }

  /**
   * Get leave types
   */
  async getLeaveTypes(req, res, next) {
    try {
      const types = Object.entries(LEAVE_TYPES).map(([key, value]) => ({
        id: key,
        ...value
      }));

      return successResponse(res, types, 'Leave types retrieved successfully');
    } catch (error) {
      logger.error('Get leave types error:', error);
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

      const employees = await Employee.countDocuments({ organizationId, status: 'active' });

      // Simulated summary
      const summary = {
        totalEmployees: employees,
        onLeaveToday: Math.floor(employees * 0.05),
        pendingApplications: Math.floor(Math.random() * 10) + 3,
        approvedThisMonth: Math.floor(Math.random() * 20) + 10,
        rejectedThisMonth: Math.floor(Math.random() * 5) + 1,
        byType: Object.entries(LEAVE_TYPES).map(([key, value]) => ({
          type: key,
          name: value.name,
          count: Math.floor(Math.random() * 10) + 1,
          color: value.color
        })),
        monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(0, currentMonth - 6 + i).toLocaleString('default', { month: 'short' }),
          approved: Math.floor(Math.random() * 15) + 5,
          rejected: Math.floor(Math.random() * 3) + 1
        }))
      };

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

  // Helper methods
  getRandomLeaveReason(leaveType) {
    const reasons = {
      casual: ['Personal work', 'Family function', 'Travel plans', 'Personal errands'],
      sick: ['Not feeling well', 'Fever', 'Medical appointment', 'Health checkup'],
      earned: ['Vacation', 'Family trip', 'Personal time off', 'Annual vacation'],
      unpaid: ['Extended leave', 'Personal commitments', 'Family emergency'],
      comp_off: ['Worked on holiday', 'Extra shift compensation', 'Weekend work']
    };
    const list = reasons[leaveType] || reasons.casual;
    return list[Math.floor(Math.random() * list.length)];
  }
}

export default new LeaveController();