import Attendance from '../../models/Attendance.js';
import Employee from '../../models/Employee.js';
import Shift from '../../models/Shift.js';
import LateMarkSummary from '../../models/LateMarkSummary.js';
import Organization from '../../models/Organization.js';
import { ATTENDANCE_STATUS, ROLES } from '../../config/constants.js';
import { calculateWorkingHours, calculateLateMinutes } from '../../utils/helpers.js';
import mongoose from 'mongoose';

class AttendanceService {
  /**
   * Check-in
   */
  async checkIn(organizationId, user, data) {
    // Get employee
    let employeeId = data.employeeId;

    if (!employeeId) {
      // If no employeeId provided, get from user
      const employee = await Employee.findOne({
        organizationId,
        userId: user._id,
        status: 'active'
      });

      if (!employee) {
        throw new Error('Employee not found');
      }
      employeeId = employee._id;
    }

    // Verify employee exists and is active
    const employee = await Employee.findOne({
      _id: employeeId,
      organizationId,
      status: 'active'
    });

    if (!employee) {
      throw new Error('Employee not found or inactive');
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      employeeId,
      organizationId,
      date: today
    });

    if (existingAttendance && existingAttendance.checkIn && existingAttendance.checkIn.time) {
      throw new Error('Already checked in for today');
    }

    // Get shift
    const shift = await Shift.findOne({
      _id: data.shiftId || employee.shiftId,
      organizationId,
      isActive: true
    });

    if (!shift) {
      throw new Error('Shift not found or inactive');
    }

    // Create attendance record
    const attendance = new Attendance({
      organizationId,
      employeeId,
      date: today,
      shiftId: shift._id,
      checkIn: {
        time: new Date(),
        location: data.location,
        ip: data.ip
      }
    });

    // Calculate late mark
    await attendance.calculateLateMark();

    // Set initial status
    attendance.status = ATTENDANCE_STATUS.PRESENT;

    await attendance.save();

    return Attendance.findById(attendance._id)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('shiftId', 'name code');
  }

  /**
   * Check-out
   */
  async checkOut(organizationId, user, data) {
    // Get employee from user
    const employee = await Employee.findOne({
      organizationId,
      userId: user._id,
      status: 'active'
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Find today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      organizationId,
      date: today
    });

    if (!attendance || !attendance.checkIn) {
      throw new Error('No check-in record found for today');
    }

    if (attendance.checkOut && attendance.checkOut.time) {
      throw new Error('Already checked out for today');
    }

    // Set check-out
    attendance.checkOut = {
      time: new Date(),
      location: data.location,
      ip: data.ip
    };

    // Calculate late mark if not done
    if (!attendance.lateMark || !attendance.lateMark.isLate) {
      await attendance.calculateLateMark();
    }

    // Calculate working hours
    await attendance.calculateWorkingHours(employee);

    // Determine status
    const shift = await Shift.findById(attendance.shiftId);
    const dayOfWeek = attendance.date.getDay();
    const shiftDuration = shift.calculateDuration(dayOfWeek);
    attendance.status = attendance.determineStatus(shiftDuration);

    await attendance.save();

    // Update late mark summary if late
    if (attendance.lateMark && attendance.lateMark.isLate) {
      await this.updateLateMarkSummary(attendance);
    }

    return Attendance.findById(attendance._id)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('shiftId', 'name code');
  }

  /**
   * Get attendance records
   */
  async getAttendance(organizationId, filters, options) {
    const query = { organizationId };

    // Apply filters
    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters.date) {
      query.date = new Date(filters.date);
    }
    if (filters.startDate && filters.endDate) {
      query.date = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    } else if (filters.startDate) {
      query.date = { $gte: new Date(filters.startDate) };
    } else if (filters.endDate) {
      query.date = { $lte: new Date(filters.endDate) };
    }
    if (filters.status) {
      query.status = filters.status;
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('shiftId', 'name code');

    const total = await Attendance.countDocuments(query);

    return {
      attendance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get employee attendance
   */
  async getEmployeeAttendance(organizationId, employeeId, startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const attendance = await Attendance.find({
      employeeId,
      organizationId,
      date: { $gte: start, $lte: end }
    })
      .sort({ date: 1 })
      .populate('shiftId', 'name code');

    // Calculate summary
    const summary = {
      totalDays: attendance.length,
      presentDays: attendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length,
      absentDays: attendance.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length,
      halfDays: attendance.filter(a => a.status === ATTENDANCE_STATUS.HALF_DAY).length,
      leaveDays: attendance.filter(a => a.status === ATTENDANCE_STATUS.LEAVE).length,
      totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
      totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
      totalLateMarks: attendance.filter(a => a.lateMark && a.lateMark.isLate).length,
      attendance
    };

    return summary;
  }

  /**
   * Get late mark summary
   */
  async getLateMarkSummary(organizationId, filters, options) {
    const query = { organizationId };

    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters.month) {
      query.month = filters.month;
    }
    if (filters.year) {
      query.year = filters.year;
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const summaries = await LateMarkSummary.find(query)
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId');

    const total = await LateMarkSummary.countDocuments(query);

    return {
      summaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Apply late mark deduction
   */
  async applyLateMarkDeduction(organizationId, month, year, employeeId, processedBy) {
    const query = { organizationId, month, year };
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const summaries = await LateMarkSummary.find(query);

    const results = [];
    for (const summary of summaries) {
      await summary.calculateSalaryDeduction();
      await summary.markProcessed(processedBy);
      results.push({
        employeeId: summary.employeeId,
        lateMarks: summary.totalLateMarks,
        deductionDays: summary.deductionDays,
        salaryDeduction: summary.salaryDeduction
      });
    }

    return results;
  }

  /**
   * Get today's attendance
   */
  async getTodayAttendance(organizationId, user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get employee from user
    const employee = await Employee.findOne({
      organizationId,
      userId: user._id
    });

    if (!employee) {
      return null;
    }

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      organizationId,
      date: today
    }).populate('shiftId', 'name code');

    return {
      employee,
      attendance
    };
  }

  /**
   * Create manual attendance entry
   */
  async createManualEntry(organizationId, data, createdBy) {
    const { employeeId, date, checkIn, checkOut, status, notes, reason } = data;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      employeeId,
      organizationId,
      date: attendanceDate
    });

    if (attendance) {
      // Update existing
      if (checkIn) {
        attendance.checkIn = {
          time: new Date(checkIn.time),
          location: checkIn.location,
          ip: checkIn.ip
        };
      }
      if (checkOut) {
        attendance.checkOut = {
          time: new Date(checkOut.time),
          location: checkOut.location,
          ip: checkOut.ip
        };
      }
      attendance.status = status;
      attendance.notes = notes;
      attendance.isManualEntry = true;
      attendance.manualEntryReason = reason;
      attendance.approvedBy = createdBy;
    } else {
      // Create new
      attendance = new Attendance({
        organizationId,
        employeeId,
        date: attendanceDate,
        shiftId: data.shiftId,
        checkIn: checkIn ? {
          time: new Date(checkIn.time),
          location: checkIn.location,
          ip: checkIn.ip
        } : null,
        checkOut: checkOut ? {
          time: new Date(checkOut.time),
          location: checkOut.location,
          ip: checkOut.ip
        } : null,
        status,
        notes,
        isManualEntry: true,
        manualEntryReason: reason,
        approvedBy: createdBy
      });
    }

    await attendance.save();

    return Attendance.findById(attendance._id)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('shiftId', 'name code');
  }

  /**
   * Update late mark summary
   */
  async updateLateMarkSummary(attendance) {
    const date = attendance.date;
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const summary = await LateMarkSummary.getOrCreateSummary(
      attendance.organizationId,
      attendance.employeeId,
      month,
      year
    );

    await summary.addLateMark(attendance.date, attendance.lateMark.lateMinutes, attendance._id);
  }
}

export default new AttendanceService();