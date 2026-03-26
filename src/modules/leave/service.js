import mongoose from 'mongoose';
import LeaveType from '../../models/LeaveType.js';
import LeaveBalance from '../../models/LeaveBalance.js';
import LeaveRequest from '../../models/LeaveRequest.js';
import Employee from '../../models/Employee.js';

class LeaveService {
  // ==================== Leave Type Methods ====================

  /**
   * Get all leave types for organization
   */
  async getLeaveTypes(organizationId, includeInactive = false) {
    const query = { organizationId };
    if (!includeInactive) {
      query.isActive = true;
    }
    return LeaveType.find(query).sort({ name: 1 });
  }

  /**
   * Get leave type by ID
   */
  async getLeaveTypeById(id, organizationId) {
    return LeaveType.findOne({ _id: id, organizationId });
  }

  /**
   * Create leave type
   */
  async createLeaveType(data) {
    const leaveType = new LeaveType(data);
    await leaveType.save();
    return leaveType;
  }

  /**
   * Update leave type
   */
  async updateLeaveType(id, organizationId, data) {
    const leaveType = await LeaveType.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    );
    return leaveType;
  }

  /**
   * Deactivate leave type
   */
  async deactivateLeaveType(id, organizationId) {
    const leaveType = await LeaveType.findOneAndUpdate(
      { _id: id, organizationId },
      { isActive: false },
      { new: true }
    );
    return leaveType;
  }

  // ==================== Leave Balance Methods ====================

  /**
   * Get or create leave balance for employee
   */
  async getOrCreateLeaveBalance(organizationId, employeeId, leaveTypeId, year) {
    let balance = await LeaveBalance.findOne({ employeeId, leaveTypeId, year });

    if (!balance) {
      const leaveType = await LeaveType.findById(leaveTypeId);
      if (!leaveType) {
        throw new Error('Leave type not found');
      }

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Calculate pro-rated quota for new joiners
      const joiningYear = new Date(employee.employment.joiningDate).getFullYear();
      let allocated = leaveType.annualQuota;

      if (joiningYear === year) {
        allocated = leaveType.calculateProRatedQuota(employee.employment.joiningDate, year);
      }

      balance = new LeaveBalance({
        organizationId,
        employeeId,
        leaveTypeId,
        year,
        allocated
      });
      await balance.save();
    }

    return balance;
  }

  /**
   * Get all leave balances for employee
   */
  async getEmployeeLeaveBalances(employeeId, year) {
    const balances = await LeaveBalance.find({ employeeId, year })
      .populate('leaveTypeId', 'name code color isPaid annualQuota');

    // Get all active leave types for the organization
    const employee = await Employee.findById(employeeId).populate('organizationId');
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get leave types
    const leaveTypes = await LeaveType.findActive(employee.organizationId._id);

    // Create balances for missing leave types
    for (const leaveType of leaveTypes) {
      const exists = balances.find(b => b.leaveTypeId._id.toString() === leaveType._id.toString());
      if (!exists) {
        const newBalance = await this.getOrCreateLeaveBalance(
          employee.organizationId._id,
          employeeId,
          leaveType._id,
          year
        );
        balances.push(newBalance);
      }
    }

    return balances.map(b => ({
      leaveTypeId: b.leaveTypeId,
      allocated: b.allocated,
      used: b.used,
      pending: b.pending,
      carriedForward: b.carriedForward,
      balance: b.balance,
      remaining: b.remaining
    }));
  }

  /**
   * Get leave balances for all employees (with filters)
   */
  async getLeaveBalances(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    // Build employee filter
    const employeeQuery = { organizationId, status: 'active' };
    if (filters.department && filters.department !== 'all') {
      employeeQuery['employment.department'] = new RegExp(filters.department, 'i');
    }
    if (filters.employeeId) {
      employeeQuery._id = filters.employeeId;
    }

    const employees = await Employee.find(employeeQuery)
      .select('employeeId personalInfo.firstName personalInfo.lastName employment.department employment.designation employment.joiningDate')
      .sort({ 'employment.department': 1, 'personalInfo.firstName': 1 });

    const year = filters.year || new Date().getFullYear();
    const leaveTypes = await LeaveType.findActive(organizationId);

    const balances = [];

    for (const employee of employees) {
      const employeeBalances = {};

      for (const leaveType of leaveTypes) {
        const balance = await this.getOrCreateLeaveBalance(
          organizationId,
          employee._id,
          leaveType._id,
          year
        );

        employeeBalances[leaveType.code] = {
          name: leaveType.name,
          code: leaveType.code,
          color: leaveType.color,
          allocated: balance.allocated,
          used: balance.used,
          pending: balance.pending,
          carriedForward: balance.carriedForward,
          balance: balance.balance
        };
      }

      balances.push({
        employeeId: employee._id,
        employeeCode: employee.employeeId,
        name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
        department: employee.employment.department,
        designation: employee.employment.designation,
        joiningDate: employee.employment.joiningDate,
        balances: employeeBalances,
        totalBalance: Object.values(employeeBalances).reduce((sum, b) => sum + b.balance, 0)
      });
    }

    return balances;
  }

  /**
   * Update leave balance
   */
  async updateLeaveBalance(id, data) {
    const balance = await LeaveBalance.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    return balance;
  }

  /**
   * Carry forward leave balances to new year
   */
  async carryForwardBalances(organizationId, fromYear, toYear) {
    const employees = await Employee.find({ organizationId, status: 'active' });
    const leaveTypes = await LeaveType.find({ organizationId, carryForward: true });

    const results = [];

    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        const oldBalance = await LeaveBalance.findOne({
          employeeId: employee._id,
          leaveTypeId: leaveType._id,
          year: fromYear
        });

        if (oldBalance && oldBalance.remaining > 0) {
          const carryForwardDays = Math.min(oldBalance.remaining, leaveType.maxCarryForward);

          // Create new balance for new year
          let newBalance = await LeaveBalance.findOne({
            employeeId: employee._id,
            leaveTypeId: leaveType._id,
            year: toYear
          });

          if (!newBalance) {
            newBalance = new LeaveBalance({
              organizationId,
              employeeId: employee._id,
              leaveTypeId: leaveType._id,
              year: toYear,
              allocated: leaveType.annualQuota,
              carriedForward: carryForwardDays
            });
          } else {
            newBalance.carriedForward = carryForwardDays;
          }

          await newBalance.save();
          results.push({
            employeeId: employee._id,
            leaveTypeId: leaveType._id,
            carriedForward: carryForwardDays
          });
        }
      }
    }

    return results;
  }

  // ==================== Leave Request Methods ====================

  /**
   * Get leave requests with filters
   */
  async getLeaveRequests(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.leaveTypeId) {
      query.leaveTypeId = filters.leaveTypeId;
    }

    // Date range filter
    if (filters.startDate && filters.endDate) {
      query.$or = [
        { startDate: { $gte: filters.startDate, $lte: filters.endDate } },
        { endDate: { $gte: filters.startDate, $lte: filters.endDate } },
        { startDate: { $lte: filters.startDate }, endDate: { $gte: filters.endDate } }
      ];
    } else if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);
      query.$or = [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } }
      ];
    }

    // Department filter
    let departmentFilter = null;
    if (filters.department && filters.department !== 'all') {
      departmentFilter = filters.department;
    }

    let requests = await LeaveRequest.find(query)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
      .populate('leaveTypeId', 'name code color')
      .populate('approvedBy', 'personalInfo.firstName personalInfo.lastName')
      .populate('rejectedBy', 'personalInfo.firstName personalInfo.lastName')
      .populate('approvalHistory.approverId', 'personalInfo.firstName personalInfo.lastName')
      .sort({ appliedAt: -1 });

    // Apply department filter after population
    if (departmentFilter) {
      requests = requests.filter(r =>
        r.employeeId?.employment?.department?.toLowerCase().includes(departmentFilter.toLowerCase())
      );
    }

    return requests;
  }

  /**
   * Get leave request by ID
   */
  async getLeaveRequestById(id, organizationId) {
    return LeaveRequest.findOne({ _id: id, organizationId })
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .populate('leaveTypeId', 'name code color isPaid')
      .populate('approvedBy', 'personalInfo.firstName personalInfo.lastName')
      .populate('rejectedBy', 'personalInfo.firstName personalInfo.lastName')
      .populate('approvalHistory.approverId', 'personalInfo.firstName personalInfo.lastName');
  }

  /**
   * Create leave request
   */
  async createLeaveRequest(data) {
    const { organizationId, employeeId, leaveTypeId, startDate, endDate, halfDay } = data;

    // Check for overlapping leaves
    const overlap = await LeaveRequest.checkOverlap(employeeId, startDate, endDate);
    if (overlap) {
      throw new Error('You already have a leave request for these dates');
    }

    // Calculate total days - parse dates properly to avoid timezone issues
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    let totalDays;

    if (halfDay) {
      totalDays = 0.5;
    } else {
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      totalDays = diffDays > 0 ? diffDays : 1;
    }

    // Get employee's reporting manager
    const employee = await Employee.findById(employeeId).populate('employment.reportingManager');
    let currentApprover = employee.employment.reportingManager?._id;

    // Check leave balance
    const year = start.getFullYear();
    const balance = await this.getOrCreateLeaveBalance(organizationId, employeeId, leaveTypeId, year);

    if (balance.remaining - balance.pending < totalDays) {
      throw new Error('Insufficient leave balance');
    }

    // Add pending to balance
    await balance.addPending(totalDays);

    // Create leave request
    const leaveRequest = new LeaveRequest({
      ...data,
      totalDays,
      currentApprover
    });

    await leaveRequest.save();
    return this.getLeaveRequestById(leaveRequest._id, organizationId);
  }

  /**
   * Approve leave request - supports multi-level approval
   */
  async approveLeaveRequest(id, approverId, notes, approvalType = 'hod') {
    console.log('approveLeaveRequest called:', { id, approverId, notes, approvalType });

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    console.log('Current leave request status:', leaveRequest.status);

    // Validate current status based on approval type
    if (approvalType === 'hod' && leaveRequest.status !== 'pending') {
      throw new Error('Only pending requests can be approved by HOD');
    }
    if (approvalType === 'hr' && leaveRequest.status !== 'hod_approved') {
      throw new Error('Only HOD-approved requests can be approved by HR');
    }

    // Approve the request
    await leaveRequest.approve(approverId, notes, approvalType);

    console.log('After approve - leave request status:', leaveRequest.status);

    // Update leave balance only when fully approved
    if (approvalType === 'hr' || approvalType === 'final') {
      const balance = await LeaveBalance.findOne({
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: new Date(leaveRequest.startDate).getFullYear()
      });

      if (balance) {
        await balance.useLeave(leaveRequest.totalDays);
      }
    }

    return this.getLeaveRequestById(id, leaveRequest.organizationId);
  }

  /**
   * Reject leave request - can reject at any stage
   */
  async rejectLeaveRequest(id, rejecterId, reason) {
    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    // Can reject pending or hod_approved requests
    if (!['pending', 'hod_approved'].includes(leaveRequest.status)) {
      throw new Error('Only pending or HOD-approved requests can be rejected');
    }

    // Reject the request
    await leaveRequest.reject(rejecterId, reason);

    // Remove pending from balance
    const balance = await LeaveBalance.findOne({
      employeeId: leaveRequest.employeeId,
      leaveTypeId: leaveRequest.leaveTypeId,
      year: new Date(leaveRequest.startDate).getFullYear()
    });

    if (balance) {
      await balance.removePending(leaveRequest.totalDays);
    }

    return this.getLeaveRequestById(id, leaveRequest.organizationId);
  }

  /**
   * Cancel leave request
   */
  async cancelLeaveRequest(id, cancelledBy, reason) {
    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if (leaveRequest.status === 'approved') {
      throw new Error('Approved leaves cannot be cancelled. Please contact HR.');
    }

    await leaveRequest.cancel(cancelledBy, reason);

    // Remove pending from balance if was pending
    if (leaveRequest.status === 'pending') {
      const balance = await LeaveBalance.findOne({
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: new Date(leaveRequest.startDate).getFullYear()
      });

      if (balance) {
        await balance.removePending(leaveRequest.totalDays);
      }
    }

    return this.getLeaveRequestById(id, leaveRequest.organizationId);
  }

  /**
   * Get leave summary
   */
  async getLeaveSummary(organizationId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [
      totalEmployees,
      pendingRequests,
      hodApprovedRequests,
      approvedRequests,
      rejectedRequests,
      requestsByType
    ] = await Promise.all([
      Employee.countDocuments({ organizationId, status: 'active' }),
      LeaveRequest.countDocuments({
        organizationId,
        status: 'pending',
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } }
        ]
      }),
      LeaveRequest.countDocuments({
        organizationId,
        status: 'hod_approved',
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } }
        ]
      }),
      LeaveRequest.countDocuments({
        organizationId,
        status: 'approved',
        approvedAt: { $gte: startDate, $lte: endDate }
      }),
      LeaveRequest.countDocuments({
        organizationId,
        status: 'rejected',
        rejectedAt: { $gte: startDate, $lte: endDate }
      }),
      LeaveRequest.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'approved',
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$leaveTypeId',
            count: { $sum: 1 },
            totalDays: { $sum: '$totalDays' }
          }
        },
        {
          $lookup: {
            from: 'leavetypes',
            localField: '_id',
            foreignField: '_id',
            as: 'leaveType'
          }
        },
        {
          $unwind: '$leaveType'
        },
        {
          $project: {
            leaveTypeId: '$_id',
            name: '$leaveType.name',
            code: '$leaveType.code',
            color: '$leaveType.color',
            count: 1,
            totalDays: 1
          }
        }
      ])
    ]);

    // Get employees on leave today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const onLeaveToday = await LeaveRequest.countDocuments({
      organizationId,
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const trendMonth = month - i;
      const trendYear = trendMonth <= 0 ? year - 1 : year;
      const adjustedMonth = trendMonth <= 0 ? 12 + trendMonth : trendMonth;

      const monthStart = new Date(trendYear, adjustedMonth - 1, 1);
      const monthEnd = new Date(trendYear, adjustedMonth, 0);

      const [approved, rejected] = await Promise.all([
        LeaveRequest.countDocuments({
          organizationId,
          status: 'approved',
          approvedAt: { $gte: monthStart, $lte: monthEnd }
        }),
        LeaveRequest.countDocuments({
          organizationId,
          status: 'rejected',
          rejectedAt: { $gte: monthStart, $lte: monthEnd }
        })
      ]);

      monthlyTrend.push({
        month: new Date(trendYear, adjustedMonth - 1).toLocaleString('default', { month: 'short' }),
        approved,
        rejected
      });
    }

    return {
      totalEmployees,
      onLeaveToday,
      pendingApplications: pendingRequests,
      hodApprovedApplications: hodApprovedRequests,
      approvedThisMonth: approvedRequests,
      rejectedThisMonth: rejectedRequests,
      byType: requestsByType,
      monthlyTrend
    };
  }

  /**
   * Get pending requests for approver
   */
  async getPendingRequestsForApprover(approverId) {
    return LeaveRequest.getPendingForApprover(approverId);
  }

  /**
   * Get leave history for employee
   */
  async getEmployeeLeaveHistory(employeeId, year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return LeaveRequest.find({
      employeeId,
      startDate: { $gte: startDate, $lte: endDate }
    })
      .populate('leaveTypeId', 'name code color')
      .sort({ startDate: -1 });
  }
}

export default new LeaveService();