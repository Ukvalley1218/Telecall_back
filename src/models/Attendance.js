import mongoose from 'mongoose';
import { ATTENDANCE_STATUS, LATE_MARK_RULES } from '../config/constants.js';
import { calculateWorkingHours, calculateLateMinutes } from '../utils/helpers.js';

const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number
}, { _id: false });

const checkSchema = new mongoose.Schema({
  time: Date,
  location: locationSchema,
  ip: String,
  device: String
}, { _id: false });

const lateMarkSchema = new mongoose.Schema({
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  deductedHours: {
    type: Number,
    default: 0
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: [true, 'Shift ID is required']
  },
  checkIn: checkSchema,
  checkOut: checkSchema,
  workingHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  lateMark: lateMarkSchema,
  status: {
    type: String,
    enum: Object.values(ATTENDANCE_STATUS),
    default: ATTENDANCE_STATUS.ABSENT
  },
  notes: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isManualEntry: {
    type: Boolean,
    default: false
  },
  manualEntryReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for unique attendance per employee per day
attendanceSchema.index({ organizationId: 1, employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ organizationId: 1, status: 1 });
attendanceSchema.index({ employeeId: 1, date: -1 });

// Virtual for employee
attendanceSchema.virtual('employee', {
  ref: 'Employee',
  localField: 'employeeId',
  foreignField: '_id',
  justOne: true
});

// Virtual for shift
attendanceSchema.virtual('shift', {
  ref: 'Shift',
  localField: 'shiftId',
  foreignField: '_id',
  justOne: true
});

// Method to calculate late mark
attendanceSchema.methods.calculateLateMark = async function() {
  if (!this.checkIn || !this.checkIn.time) {
    this.lateMark = { isLate: false, lateMinutes: 0, deductedHours: 0 };
    return this.lateMark;
  }

  // Get shift and organization settings
  const Shift = mongoose.model('Shift');
  const Organization = mongoose.model('Organization');

  const shift = await Shift.findById(this.shiftId);
  const organization = await Organization.findById(this.organizationId);

  if (!shift) {
    this.lateMark = { isLate: false, lateMinutes: 0, deductedHours: 0 };
    return this.lateMark;
  }

  const dayOfWeek = this.date.getDay();
  const timing = shift.getTimingForDay(dayOfWeek);

  if (!timing) {
    this.lateMark = { isLate: false, lateMinutes: 0, deductedHours: 0 };
    return this.lateMark;
  }

  const bufferMinutes = organization?.settings?.lateMarkBuffer || LATE_MARK_RULES.BUFFER_MINUTES;
  const lateMinutes = calculateLateMinutes(this.checkIn.time, timing.startTime, bufferMinutes);

  if (lateMinutes > 0) {
    this.lateMark = {
      isLate: true,
      lateMinutes,
      deductedHours: LATE_MARK_RULES.DEDUCTION_HOURS
    };
  } else {
    this.lateMark = { isLate: false, lateMinutes: 0, deductedHours: 0 };
  }

  return this.lateMark;
};

// Method to calculate working hours
attendanceSchema.methods.calculateWorkingHours = async function(employee) {
  if (!this.checkIn || !this.checkIn.time || !this.checkOut || !this.checkOut.time) {
    this.workingHours = 0;
    return this.workingHours;
  }

  const Shift = mongoose.model('Shift');
  const shift = await Shift.findById(this.shiftId);

  if (!shift) {
    this.workingHours = 0;
    return this.workingHours;
  }

  const dayOfWeek = this.date.getDay();
  const shiftDuration = shift.calculateDuration(dayOfWeek);

  let totalHours = calculateWorkingHours(this.checkIn.time, this.checkOut.time);

  // Deduct late mark hours
  totalHours -= this.lateMark?.deductedHours || 0;

  // Check if overtime is allowed
  if (employee && !employee.overtimeAllowed) {
    totalHours = Math.min(totalHours, shiftDuration);
  }

  this.workingHours = Math.max(0, totalHours);

  // Calculate overtime
  if (employee && employee.overtimeAllowed && totalHours > shiftDuration) {
    this.overtimeHours = totalHours - shiftDuration;
  } else {
    this.overtimeHours = 0;
  }

  return this.workingHours;
};

// Method to determine attendance status
attendanceSchema.methods.determineStatus = function(shiftDuration) {
  const hours = this.workingHours;

  if (!this.checkIn || !this.checkIn.time) {
    return ATTENDANCE_STATUS.ABSENT;
  }

  if (hours >= shiftDuration * 0.75) {
    return ATTENDANCE_STATUS.PRESENT;
  }

  if (hours >= shiftDuration * 0.25) {
    return ATTENDANCE_STATUS.HALF_DAY;
  }

  return ATTENDANCE_STATUS.ABSENT;
};

// Static method to get employee attendance for a date range
attendanceSchema.statics.getEmployeeAttendance = function(employeeId, startDate, endDate) {
  return this.find({
    employeeId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

// Static method to get organization attendance for a date
attendanceSchema.statics.getOrganizationAttendance = function(organizationId, date) {
  return this.find({ organizationId, date })
    .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId');
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;