import SandwichLeave from '../../models/SandwichLeave.js';
import Employee from '../../models/Employee.js';
import { SANDWICH_LEAVE_STATUS } from '../../config/constants.js';

class SandwichLeaveService {
  /**
   * Get sandwich leaves with filtering and pagination
   */
  async getSandwichLeaves(organizationId, filters, options) {
    const query = { organizationId };

    // Apply filters
    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters.status) {
      query.status = filters.status;
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const leaves = await SandwichLeave.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('createdBy', 'profile.firstName profile.lastName')
      .populate('approvedBy', 'profile.firstName profile.lastName');

    const total = await SandwichLeave.countDocuments(query);

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
   * Get sandwich leave by ID
   */
  async getSandwichLeaveById(id, organizationId) {
    return SandwichLeave.findOne({ _id: id, organizationId })
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('approvedBy', 'profile.firstName profile.lastName');
  }

  /**
   * Create sandwich leave
   */
  async createSandwichLeave(data) {
    // Verify employee exists
    const employee = await Employee.findOne({
      _id: data.employeeId,
      organizationId: data.organizationId,
      status: 'active'
    });

    if (!employee) {
      throw new Error('Employee not found or inactive');
    }

    // Parse and sort leave dates
    const leaveDates = data.leaveDates.map(d => new Date(d));
    leaveDates.sort((a, b) => a - b);

    // Calculate sandwich dates (weekends/holidays between leave dates)
    const sandwichDates = this.calculateSandwichDates(leaveDates);

    // Calculate deduction
    const totalDays = leaveDates.length + sandwichDates.length;
    const deductionDays = data.deductionType === '2x' ? totalDays * 2 : totalDays;

    const leave = new SandwichLeave({
      organizationId: data.organizationId,
      employeeId: data.employeeId,
      leaveDates,
      sandwichDates,
      deductionType: data.deductionType || '1x',
      deductionDays,
      reason: data.reason,
      notes: data.notes,
      createdBy: data.createdBy
    });

    // Calculate deduction amount
    await leave.calculateDeductionAmount();
    await leave.save();

    return await this.getSandwichLeaveById(leave._id, data.organizationId);
  }

  /**
   * Calculate sandwich dates (weekends between leave dates)
   */
  calculateSandwichDates(leaveDates) {
    const sandwichDates = [];

    for (let i = 0; i < leaveDates.length - 1; i++) {
      const startDate = new Date(leaveDates[i]);
      const endDate = new Date(leaveDates[i + 1]);
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + 1);

      while (currentDate < endDate) {
        const dayOfWeek = currentDate.getDay();
        // Check if it's a weekend (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          sandwichDates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return sandwichDates;
  }

  /**
   * Approve sandwich leave
   */
  async approveSandwichLeave(id, organizationId, approverId) {
    const leave = await SandwichLeave.findOne({ _id: id, organizationId });

    if (!leave) {
      return null;
    }

    if (leave.status !== SANDWICH_LEAVE_STATUS.PENDING) {
      throw new Error('Only pending sandwich leaves can be approved');
    }

    // Calculate deduction amount if not already calculated
    if (!leave.deductionAmount) {
      await leave.calculateDeductionAmount();
    }

    await leave.approve(approverId);
    return await this.getSandwichLeaveById(id, organizationId);
  }

  /**
   * Reject sandwich leave
   */
  async rejectSandwichLeave(id, organizationId, rejecterId, reason) {
    const leave = await SandwichLeave.findOne({ _id: id, organizationId });

    if (!leave) {
      return null;
    }

    if (leave.status !== SANDWICH_LEAVE_STATUS.PENDING) {
      throw new Error('Only pending sandwich leaves can be rejected');
    }

    await leave.reject(rejecterId, reason);
    return await this.getSandwichLeaveById(id, organizationId);
  }

  /**
   * Delete sandwich leave
   */
  async deleteSandwichLeave(id, organizationId) {
    const leave = await SandwichLeave.findOne({ _id: id, organizationId });

    if (!leave) {
      return null;
    }

    if (leave.status === SANDWICH_LEAVE_STATUS.APPROVED) {
      throw new Error('Cannot delete an approved sandwich leave');
    }

    await SandwichLeave.findByIdAndDelete(id);
    return leave;
  }

  /**
   * Get sandwich leaves for employee
   */
  async getEmployeeSandwichLeaves(employeeId, startDate, endDate) {
    const query = { employeeId };

    if (startDate && endDate) {
      query.leaveDates = { $elemMatch: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    }

    return SandwichLeave.find(query)
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'profile.firstName profile.lastName');
  }
}

export default new SandwichLeaveService();