import Employee from '../../models/Employee.js';
import User from '../../models/User.js';
import Permission from '../../models/Permission.js';
import Attendance from '../../models/Attendance.js';
import LeaveType from '../../models/LeaveType.js';
import LeaveRequest from '../../models/LeaveRequest.js';
import LeaveBalance from '../../models/LeaveBalance.js';
import Payslip from '../../models/Payslip.js';
import PerformanceRecord from '../../models/PerformanceRecord.js';
import Incentive from '../../models/Incentive.js';
import mongoose from 'mongoose';

class EmployeeSelfService {
  /**
   * Get or create permissions for a user
   */
  async getOrCreatePermissions(userId, organizationId, role) {
    let permission = await Permission.findOne({ userId });

    if (!permission) {
      const defaultPerms = Permission.getDefaultPermissions(role);
      permission = new Permission({
        organizationId,
        userId,
        ...defaultPerms
      });
      await permission.save();
    }

    return permission;
  }

  /**
   * Update user permissions
   */
  async updatePermissions(userId, organizationId, permissions, assignedBy) {
    let permission = await Permission.findOne({ userId });

    if (!permission) {
      permission = new Permission({
        organizationId,
        userId,
        ...permissions,
        assignedBy
      });
    } else {
      // Merge the permissions
      if (permissions.modules) {
        permission.modules = { ...permission.modules, ...permissions.modules };
      }
      if (permissions.features) {
        permission.features = { ...permission.features, ...permissions.features };
      }
      permission.assignedBy = assignedBy;
      permission.assignedAt = new Date();
    }

    await permission.save();
    return permission;
  }

  /**
   * Get employee profile by user ID
   */
  async getMyProfile(userId, organizationId) {
    const employee = await Employee.findOne({ userId, organizationId })
      .populate('shiftId')
      .populate('assignedKPIs.kpiId')
      .populate('employment.reportingManager', 'personalInfo.firstName personalInfo.lastName employeeId');

    if (!employee) {
      // Try to get basic user info if no employee record
      const user = await User.findById(userId).populate('organizationId');
      return { user, employee: null };
    }

    return { employee, user: null };
  }

  /**
   * Update own profile (limited fields)
   */
  async updateMyProfile(userId, organizationId, updateData) {
    const employee = await Employee.findOne({ userId, organizationId });

    if (!employee) {
      throw new Error('Employee record not found');
    }

    // Only allow updating certain fields
    const allowedUpdates = {
      'personalInfo.phone': updateData.personalInfo?.phone,
      'personalInfo.maritalStatus': updateData.personalInfo?.maritalStatus,
      'personalInfo.anniversaryDate': updateData.personalInfo?.anniversaryDate,
      'personalInfo.address': updateData.personalInfo?.address,
      'personalInfo.emergencyContact': updateData.personalInfo?.emergencyContact,
      'bankDetails': updateData.bankDetails
    };

    // Build update object with only allowed fields
    const update = {};
    for (const [key, value] of Object.entries(allowedUpdates)) {
      if (value !== undefined) {
        update[key] = value;
      }
    }

    if (Object.keys(update).length > 0) {
      await Employee.findOneAndUpdate(
        { userId, organizationId },
        { $set: update },
        { new: true, runValidators: true }
      );
    }

    return this.getMyProfile(userId, organizationId);
  }

  /**
   * Get my attendance summary
   */
  async getMyAttendance(userId, organizationId, startDate, endDate) {
    // First get employee ID
    const employee = await Employee.findOne({ userId, organizationId }).select('_id');
    if (!employee) {
      throw new Error('Employee record not found');
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // First day of current month
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await Attendance.find({
      employeeId: employee._id,
      organizationId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // Calculate summary
    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter(a => a.status === 'present').length,
      absentDays: attendance.filter(a => a.status === 'absent').length,
      halfDays: attendance.filter(a => a.status === 'half_day').length,
      leaveDays: attendance.filter(a => a.status === 'leave').length,
      totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
      totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
      totalLateMarks: attendance.filter(a => a.lateMark && a.lateMark.isLate).length
    };

    return {
      attendance,
      summary
    };
  }

  /**
   * Get today's attendance status
   */
  async getTodayAttendance(userId, organizationId) {
    const employee = await Employee.findOne({ userId, organizationId })
      .select('_id shiftId')
      .populate('shiftId');
    if (!employee) {
      throw new Error('Employee record not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await Attendance.findOne({
      employeeId: employee._id,
      organizationId,
      date: today
    }).populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId');

    return {
      attendance: todayAttendance,
      shift: employee.shiftId
    };
  }

  /**
   * Get my leave balance
   */
  async getMyLeaveBalance(userId, organizationId) {
    const employee = await Employee.findOne({ userId, organizationId }).select('_id employment.joiningDate');
    if (!employee) {
      throw new Error('Employee record not found');
    }

    const currentYear = new Date().getFullYear();

    // Get all active leave types for the organization
    const leaveTypes = await LeaveType.find({ organizationId, isActive: true }).sort({ name: 1 });

    // Get existing leave balances for the employee
    let leaveBalances = await LeaveBalance.find({
      employeeId: employee._id,
      organizationId,
      year: currentYear
    }).populate('leaveTypeId', 'name code color isPaid annualQuota');

    // Create a map of existing balances
    const balanceMap = {};
    leaveBalances.forEach(balance => {
      if (balance.leaveTypeId && balance.leaveTypeId._id) {
        balanceMap[balance.leaveTypeId._id.toString()] = balance;
      }
    });

    // Build the response with all leave types
    const balances = leaveTypes.map(leaveType => {
      const existingBalance = balanceMap[leaveType._id.toString()];

      if (existingBalance) {
        return {
          _id: leaveType._id,
          name: existingBalance.leaveTypeId?.name || leaveType.name,
          code: existingBalance.leaveTypeId?.code || leaveType.code,
          color: existingBalance.leaveTypeId?.color || leaveType.color,
          allocated: existingBalance.allocated,
          used: existingBalance.used,
          pending: existingBalance.pending,
          carriedForward: existingBalance.carriedForward,
          balance: existingBalance.balance,
          remaining: existingBalance.remaining
        };
      }

      // Calculate pro-rated quota for new joiners
      let allocated = leaveType.annualQuota;
      if (employee.employment?.joiningDate) {
        const joiningYear = new Date(employee.employment.joiningDate).getFullYear();
        if (joiningYear === currentYear) {
          const joiningMonth = new Date(employee.employment.joiningDate).getMonth();
          const monthsInYear = 12 - joiningMonth;
          allocated = Math.floor((leaveType.annualQuota / 12) * monthsInYear);
        }
      }

      // Return default balance for leave types without existing balance
      return {
        _id: leaveType._id,
        name: leaveType.name,
        code: leaveType.code,
        color: leaveType.color,
        allocated: allocated,
        used: 0,
        pending: 0,
        carriedForward: 0,
        balance: allocated,
        remaining: allocated
      };
    });

    return {
      employeeId: employee._id,
      year: currentYear,
      balances
    };
  }

  /**
   * Get my leave requests
   */
  async getMyLeaveRequests(userId, organizationId, status, page = 1, limit = 20) {
    const employee = await Employee.findOne({ userId, organizationId }).select('_id');
    if (!employee) {
      throw new Error('Employee record not found');
    }

    const query = { employeeId: employee._id, organizationId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const leaves = await LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('leaveTypeId')
      .populate('approvedBy', 'profile.firstName profile.lastName');

    const total = await LeaveRequest.countDocuments(query);

    return {
      leaves,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Apply for leave
   */
  async applyLeave(userId, organizationId, leaveData) {
    const employee = await Employee.findOne({ userId, organizationId }).select('_id personalInfo.firstName personalInfo.lastName employment.department employment.joiningDate employment.reportingManager');
    if (!employee) {
      throw new Error('Employee record not found');
    }

    if (!leaveData.leaveTypeId) {
      throw new Error('Leave type is required');
    }

    // Calculate days
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const currentYear = startDate.getFullYear();

    // Get the leave type
    const leaveType = await LeaveType.findOne({ _id: leaveData.leaveTypeId, organizationId, isActive: true });
    if (!leaveType) {
      throw new Error('Invalid leave type');
    }

    // Get or create leave balance for this specific leave type
    let leaveBalance = await LeaveBalance.findOne({
      employeeId: employee._id,
      leaveTypeId: leaveData.leaveTypeId,
      year: currentYear
    });

    if (!leaveBalance) {
      // Calculate pro-rated quota for new joiners
      let allocated = leaveType.annualQuota;
      if (employee.employment?.joiningDate) {
        const joiningYear = new Date(employee.employment.joiningDate).getFullYear();
        if (joiningYear === currentYear) {
          const joiningMonth = new Date(employee.employment.joiningDate).getMonth();
          const monthsInYear = 12 - joiningMonth;
          allocated = Math.floor((leaveType.annualQuota / 12) * monthsInYear);
        }
      }

      // Create new leave balance
      leaveBalance = new LeaveBalance({
        organizationId,
        employeeId: employee._id,
        leaveTypeId: leaveData.leaveTypeId,
        year: currentYear,
        allocated,
        used: 0,
        pending: 0,
        carriedForward: 0
      });
      await leaveBalance.save();
    }

    // Check if enough balance
    const availableBalance = leaveBalance.allocated + leaveBalance.carriedForward - leaveBalance.used - leaveBalance.pending;
    if (availableBalance < days) {
      throw new Error(`Insufficient leave balance. Available: ${availableBalance} days, Requested: ${days} days`);
    }

    // Add pending days to balance
    leaveBalance.pending += days;
    await leaveBalance.save();

    // Get employee's reporting manager for approval
    let currentApprover = employee.employment?.reportingManager;

    // Create leave request
    const leaveRequest = new LeaveRequest({
      organizationId,
      employeeId: employee._id,
      leaveTypeId: leaveData.leaveTypeId,
      startDate,
      endDate,
      totalDays: days,
      reason: leaveData.reason,
      status: 'pending',
      appliedBy: userId,
      currentApprover
    });

    await leaveRequest.save();

    // Return populated leave request
    const populatedRequest = await LeaveRequest.findById(leaveRequest._id)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
      .populate('leaveTypeId', 'name code color');

    return populatedRequest;
  }

  /**
   * Get my payslips
   */
  async getMyPayslips(userId, organizationId, page = 1, limit = 12) {
    const employee = await Employee.findOne({ userId, organizationId }).select('_id');
    if (!employee) {
      throw new Error('Employee record not found');
    }

    const skip = (page - 1) * limit;

    const payslips = await Payslip.find({
      employeeId: employee._id,
      organizationId
    })
      .sort({ 'payPeriod.month': -1, 'payPeriod.year': -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payslip.countDocuments({
      employeeId: employee._id,
      organizationId
    });

    return {
      payslips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get my performance records
   */
  async getMyPerformance(userId, organizationId, page = 1, limit = 10) {
    const employee = await Employee.findOne({ userId, organizationId }).select('_id');
    if (!employee) {
      throw new Error('Employee record not found');
    }

    const skip = (page - 1) * limit;

    const records = await PerformanceRecord.find({
      employeeId: employee._id,
      organizationId
    })
      .sort({ reviewDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewerId', 'profile.firstName profile.lastName');

    const total = await PerformanceRecord.countDocuments({
      employeeId: employee._id,
      organizationId
    });

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
   * Get my incentives
   */
  async getMyIncentives(userId, organizationId, page = 1, limit = 20) {
    const employee = await Employee.findOne({ userId, organizationId }).select('_id');
    if (!employee) {
      throw new Error('Employee record not found');
    }

    const skip = (page - 1) * limit;

    const incentives = await Incentive.find({
      employeeId: employee._id,
      organizationId
    })
      .sort({ salesDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Incentive.countDocuments({
      employeeId: employee._id,
      organizationId
    });

    // Calculate summary
    const summary = await Incentive.aggregate([
      {
        $match: {
          employeeId: employee._id,
          organizationId: new mongoose.Types.ObjectId(organizationId)
        }
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$incentiveAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      incentives,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get employee dashboard summary
   */
  async getDashboardSummary(userId, organizationId) {
    const employee = await Employee.findOne({ userId, organizationId })
      .select('_id shiftId employment.joiningDate')
      .populate('shiftId');

    if (!employee) {
      throw new Error('Employee record not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's attendance
    const todayAttendance = await Attendance.findOne({
      employeeId: employee._id,
      organizationId,
      date: today
    });

    // This month's attendance
    const monthAttendance = await Attendance.find({
      employeeId: employee._id,
      organizationId,
      date: { $gte: startOfMonth, $lte: today }
    });

    // Leave balance
    const currentYear = today.getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      employeeId: employee._id,
      organizationId,
      year: currentYear
    }).populate('leaveTypeId');

    // Pending leave requests
    const pendingLeaves = await LeaveRequest.countDocuments({
      employeeId: employee._id,
      organizationId,
      status: 'pending'
    });

    // Total incentives pending
    const pendingIncentives = await Incentive.aggregate([
      {
        $match: {
          employeeId: employee._id,
          organizationId: new mongoose.Types.ObjectId(organizationId),
          status: 'pending'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$incentiveAmount' }
        }
      }
    ]);

    // Calculate month summary
    const monthSummary = {
      totalDays: monthAttendance.length,
      presentDays: monthAttendance.filter(a => a.status === 'present').length,
      absentDays: monthAttendance.filter(a => a.status === 'absent').length,
      halfDays: monthAttendance.filter(a => a.status === 'half_day').length,
      leaveDays: monthAttendance.filter(a => a.status === 'leave').length,
      lateMarks: monthAttendance.filter(a => a.lateMark?.isLate).length,
      totalWorkingHours: monthAttendance.reduce((sum, a) => sum + (a.workingHours || 0), 0)
    };

    return {
      employee: {
        joiningDate: employee.employment?.joiningDate,
        shift: employee.shiftId
      },
      todayAttendance,
      monthSummary,
      leaveBalance,
      pendingLeaves,
      pendingIncentives: pendingIncentives[0]?.total || 0
    };
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return { success: true, message: 'Password changed successfully' };
  }
}

export default new EmployeeSelfService();