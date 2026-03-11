import mongoose from 'mongoose';
import { SANDWICH_LEAVE_STATUS } from '../config/constants.js';

const sandwichLeaveSchema = new mongoose.Schema({
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
  leaveDates: [{
    type: Date,
    required: [true, 'Leave date is required']
  }],
  sandwichDates: [{
    type: Date,
    required: true
  }],
  deductionType: {
    type: String,
    enum: ['1x', '2x'],
    default: '1x'
  },
  deductionDays: {
    type: Number,
    default: 0
  },
  deductionAmount: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: Object.values(SANDWICH_LEAVE_STATUS),
    default: SANDWICH_LEAVE_STATUS.PENDING
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
sandwichLeaveSchema.index({ organizationId: 1, status: 1 });
sandwichLeaveSchema.index({ employeeId: 1, status: 1 });
sandwichLeaveSchema.index({ leaveDates: 1 });

// Virtual for employee
sandwichLeaveSchema.virtual('employee', {
  ref: 'Employee',
  localField: 'employeeId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to calculate sandwich dates
sandwichLeaveSchema.pre('save', async function(next) {
  if (this.isModified('leaveDates') && this.leaveDates.length > 0) {
    // Sort dates
    this.leaveDates.sort((a, b) => a - b);

    // Calculate sandwich dates (dates between leave dates that fall on holidays/weekends)
    this.sandwichDates = [];

    for (let i = 0; i < this.leaveDates.length - 1; i++) {
      const startDate = new Date(this.leaveDates[i]);
      const endDate = new Date(this.leaveDates[i + 1]);
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + 1);

      while (currentDate < endDate) {
        const dayOfWeek = currentDate.getDay();
        // Check if it's a weekend (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          this.sandwichDates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Calculate deduction
    const totalDays = this.leaveDates.length + this.sandwichDates?.length || 0;
    this.deductionDays = this.deductionType === '2x' ? totalDays * 2 : totalDays;
  }
  next();
});

// Method to calculate deduction amount
sandwichLeaveSchema.methods.calculateDeductionAmount = async function() {
  const Employee = mongoose.model('Employee');
  const employee = await Employee.findById(this.employeeId);

  if (!employee || !employee.salary || !employee.salary.basic) {
    return 0;
  }

  const dailySalary = employee.salary.basic / 30; // Assuming 30 days per month
  this.deductionAmount = Math.round(dailySalary * this.deductionDays * 100) / 100;

  return this.deductionAmount;
};

// Method to approve sandwich leave
sandwichLeaveSchema.methods.approve = async function(approverId) {
  this.status = SANDWICH_LEAVE_STATUS.APPROVED;
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  return this.save();
};

// Method to reject sandwich leave
sandwichLeaveSchema.methods.reject = async function(approverId, reason) {
  this.status = SANDWICH_LEAVE_STATUS.REJECTED;
  this.approvedBy = approverId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Static method to check if employee has pending sandwich leaves
sandwichLeaveSchema.statics.hasPendingLeaves = function(employeeId) {
  return this.exists({ employeeId, status: SANDWICH_LEAVE_STATUS.PENDING });
};

// Static method to get employee sandwich leaves
sandwichLeaveSchema.statics.getEmployeeLeaves = function(employeeId, startDate, endDate) {
  const query = { employeeId };

  if (startDate && endDate) {
    query.leaveDates = { $elemMatch: { $gte: startDate, $lte: endDate } };
  }

  return this.find(query).sort({ createdAt: -1 });
};

const SandwichLeave = mongoose.model('SandwichLeave', sandwichLeaveSchema);

export default SandwichLeave;