import mongoose from 'mongoose';
import { LATE_MARK_RULES } from '../config/constants.js';

const lateMarkDetailSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  lateMinutes: {
    type: Number,
    required: true
  },
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  }
}, { _id: false });

const lateMarkSummarySchema = new mongoose.Schema({
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
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2020
  },
  totalLateMarks: {
    type: Number,
    default: 0
  },
  totalLateMinutes: {
    type: Number,
    default: 0
  },
  deductionDays: {
    type: Number,
    default: 0
  },
  details: [lateMarkDetailSchema],
  salaryDeduction: {
    type: Number,
    default: 0
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for unique summary per employee per month
lateMarkSummarySchema.index({ organizationId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });

// Virtual for employee
lateMarkSummarySchema.virtual('employee', {
  ref: 'Employee',
  localField: 'employeeId',
  foreignField: '_id',
  justOne: true
});

// Method to add late mark detail
lateMarkSummarySchema.methods.addLateMark = async function(date, lateMinutes, attendanceId) {
  // Check if this date already recorded
  const existingIndex = this.details.findIndex(d => d.date.toDateString() === date.toDateString());

  if (existingIndex === -1) {
    this.details.push({
      date,
      lateMinutes,
      attendanceId
    });
    this.totalLateMarks = this.details.length;
    this.totalLateMinutes = this.details.reduce((sum, d) => sum + d.lateMinutes, 0);
    this.calculateDeduction();
    return this.save();
  }

  return this;
};

// Method to calculate deduction days
lateMarkSummarySchema.methods.calculateDeduction = function() {
  const lateCount = this.totalLateMarks;

  // Apply deduction rules
  // Rule: 5 late marks = 1 full day, 3 late marks = 0.5 day
  if (lateCount >= LATE_MARK_RULES.FULL_DAY_THRESHOLD) {
    this.deductionDays = Math.floor(lateCount / LATE_MARK_RULES.FULL_DAY_THRESHOLD);
    const remaining = lateCount % LATE_MARK_RULES.FULL_DAY_THRESHOLD;
    if (remaining >= LATE_MARK_RULES.HALF_DAY_THRESHOLD) {
      this.deductionDays += 0.5;
    }
  } else if (lateCount >= LATE_MARK_RULES.HALF_DAY_THRESHOLD) {
    this.deductionDays = 0.5;
  } else {
    this.deductionDays = 0;
  }

  return this.deductionDays;
};

// Method to calculate salary deduction
lateMarkSummarySchema.methods.calculateSalaryDeduction = async function() {
  if (this.deductionDays === 0) {
    this.salaryDeduction = 0;
    return 0;
  }

  const Employee = mongoose.model('Employee');
  const employee = await Employee.findById(this.employeeId);

  if (!employee || !employee.salary || !employee.salary.basic) {
    this.salaryDeduction = 0;
    return 0;
  }

  const dailySalary = employee.salary.basic / 30; // Assuming 30 days per month
  this.salaryDeduction = Math.round(dailySalary * this.deductionDays * 100) / 100;

  return this.salaryDeduction;
};

// Method to mark as processed
lateMarkSummarySchema.methods.markProcessed = async function(userId) {
  this.isProcessed = true;
  this.processedAt = new Date();
  this.processedBy = userId;
  return this.save();
};

// Static method to get or create summary for employee
lateMarkSummarySchema.statics.getOrCreateSummary = async function(organizationId, employeeId, month, year) {
  let summary = await this.findOne({ organizationId, employeeId, month, year });

  if (!summary) {
    summary = new this({
      organizationId,
      employeeId,
      month,
      year
    });
    await summary.save();
  }

  return summary;
};

// Static method to calculate deduction for late marks
lateMarkSummarySchema.statics.calculateDeductionDays = function(lateCount) {
  if (lateCount >= LATE_MARK_RULES.FULL_DAY_THRESHOLD) {
    let deductionDays = Math.floor(lateCount / LATE_MARK_RULES.FULL_DAY_THRESHOLD);
    const remaining = lateCount % LATE_MARK_RULES.FULL_DAY_THRESHOLD;
    if (remaining >= LATE_MARK_RULES.HALF_DAY_THRESHOLD) {
      deductionDays += 0.5;
    }
    return deductionDays;
  } else if (lateCount >= LATE_MARK_RULES.HALF_DAY_THRESHOLD) {
    return 0.5;
  }
  return 0;
};

const LateMarkSummary = mongoose.model('LateMarkSummary', lateMarkSummarySchema);

export default LateMarkSummary;