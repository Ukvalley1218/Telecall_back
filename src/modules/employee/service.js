import Employee from '../../models/Employee.js';
import User from '../../models/User.js';
import Shift from '../../models/Shift.js';
import KPI from '../../models/KPI.js';
import Attendance from '../../models/Attendance.js';
import Incentive from '../../models/Incentive.js';
import mongoose from 'mongoose';

class EmployeeService {
  /**
   * Get employees with filtering and pagination
   */
  async getEmployees(organizationId, filters, options) {
    const query = { organizationId };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = { $ne: 'terminated' }; // Exclude terminated by default
    }
    if (filters.department) {
      query['employment.department'] = new RegExp(filters.department, 'i');
    }
    if (filters.search) {
      query.$or = [
        { 'personalInfo.firstName': new RegExp(filters.search, 'i') },
        { 'personalInfo.lastName': new RegExp(filters.search, 'i') },
        { 'personalInfo.email': new RegExp(filters.search, 'i') },
        { employeeId: new RegExp(filters.search, 'i') }
      ];
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const employees = await Employee.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('shiftId')
      .populate('assignedKPIs.kpiId');

    const total = await Employee.countDocuments(query);

    return {
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id, organizationId) {
    return Employee.findOne({ _id: id, organizationId })
      .populate('shiftId')
      .populate('assignedKPIs.kpiId')
      .populate('employment.reportingManager', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('userId', 'email role');
  }

  /**
   * Create employee
   */
  async createEmployee(data, createdBy) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let userId = null;

      // Create user account if requested
      if (data.createUserAccount) {
        const user = new User({
          organizationId: data.organizationId,
          email: data.personalInfo.email,
          password: data.password || 'password123', // Default password
          role: 'employee',
          profile: {
            firstName: data.personalInfo.firstName,
            lastName: data.personalInfo.lastName,
            phone: data.personalInfo.phone
          }
        });
        await user.save({ session });
        userId = user._id;
      }

      // Create employee
      const employee = new Employee({
        organizationId: data.organizationId,
        userId,
        candidateId: data.candidateId,
        personalInfo: {
          firstName: data.personalInfo.firstName,
          lastName: data.personalInfo.lastName,
          email: data.personalInfo.email,
          phone: data.personalInfo.phone,
          dateOfBirth: data.personalInfo.dateOfBirth,
          gender: data.personalInfo.gender,
          address: data.personalInfo.address,
          emergencyContact: data.personalInfo.emergencyContact
        },
        employment: {
          department: data.employment.department,
          designation: data.employment.designation,
          joiningDate: data.employment.joiningDate,
          employmentType: data.employment.employmentType || 'full-time',
          probationPeriod: data.employment.probationPeriod || 6
        },
        shiftId: data.shiftId,
        overtimeAllowed: data.overtimeAllowed || false,
        status: 'active',
        salary: data.salary
      });

      await employee.save({ session });

      await session.commitTransaction();
      session.endSession();

      return await this.getEmployeeById(employee._id, data.organizationId);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(id, organizationId, data) {
    const update = {};

    if (data.personalInfo) {
      Object.keys(data.personalInfo).forEach(key => {
        update[`personalInfo.${key}`] = data.personalInfo[key];
      });
    }

    if (data.employment) {
      Object.keys(data.employment).forEach(key => {
        update[`employment.${key}`] = data.employment[key];
      });
    }

    if (data.status) {
      update.status = data.status;
    }

    if (data.bankDetails) {
      update.bankDetails = data.bankDetails;
    }

    if (data.salary) {
      update.salary = data.salary;
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: update },
      { new: true, runValidators: true }
    ).populate('shiftId');

    return employee;
  }

  /**
   * Assign shift to employee
   */
  async assignShift(id, organizationId, shiftId) {
    // Verify shift exists
    const shift = await Shift.findOne({ _id: shiftId, organizationId, isActive: true });
    if (!shift) {
      throw new Error('Shift not found or inactive');
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: id, organizationId },
      { shiftId },
      { new: true }
    ).populate('shiftId');

    return employee;
  }

  /**
   * Assign KPI to employee
   */
  async assignKPI(id, organizationId, kpiId, targetValue, assignedBy) {
    // Verify KPI exists
    const kpi = await KPI.findOne({ _id: kpiId, organizationId, isActive: true });
    if (!kpi) {
      throw new Error('KPI not found or inactive');
    }

    const employee = await Employee.findOne({ _id: id, organizationId });
    if (!employee) {
      return null;
    }

    // Check if KPI already assigned
    const existingKPI = employee.assignedKPIs.find(
      k => k.kpiId.toString() === kpiId.toString()
    );

    if (existingKPI) {
      // Update target value
      existingKPI.targetValue = targetValue;
      existingKPI.assignedDate = new Date();
    } else {
      // Add new KPI
      employee.assignedKPIs.push({
        kpiId,
        targetValue,
        assignedBy,
        assignedDate: new Date()
      });
    }

    await employee.save();
    return await this.getEmployeeById(id, organizationId);
  }

  /**
   * Toggle overtime eligibility
   */
  async toggleOvertime(id, organizationId, allowed) {
    const employee = await Employee.findOneAndUpdate(
      { _id: id, organizationId },
      { overtimeAllowed: allowed },
      { new: true }
    );

    return employee;
  }

  /**
   * Deactivate employee
   */
  async deactivateEmployee(id, organizationId) {
    const employee = await Employee.findOneAndUpdate(
      { _id: id, organizationId },
      { status: 'inactive' },
      { new: true }
    );

    // Also deactivate user account if exists
    if (employee && employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { isActive: false });
    }

    return employee;
  }

  /**
   * Get attendance summary
   */
  async getAttendanceSummary(employeeId, organizationId, startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // First day of current month
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await Attendance.find({
      employeeId,
      organizationId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter(a => a.status === 'present').length,
      absentDays: attendance.filter(a => a.status === 'absent').length,
      halfDays: attendance.filter(a => a.status === 'half_day').length,
      leaveDays: attendance.filter(a => a.status === 'leave').length,
      totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
      totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
      totalLateMarks: attendance.filter(a => a.lateMark && a.lateMark.isLate).length,
      attendance: attendance
    };

    return summary;
  }

  /**
   * Get incentives
   */
  async getIncentives(employeeId, organizationId) {
    return Incentive.find({ employeeId, organizationId })
      .sort({ salesDate: -1 })
      .populate('createdBy', 'profile.firstName profile.lastName');
  }
}

export default new EmployeeService();