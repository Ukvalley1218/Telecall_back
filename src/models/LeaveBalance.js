import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
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
  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveType',
    required: [true, 'Leave type ID is required']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later']
  },
  allocated: {
    type: Number,
    default: 0,
    min: [0, 'Allocated days cannot be negative']
  },
  used: {
    type: Number,
    default: 0,
    min: [0, 'Used days cannot be negative']
  },
  pending: {
    type: Number,
    default: 0,
    min: [0, 'Pending days cannot be negative']
  },
  carriedForward: {
    type: Number,
    default: 0,
    min: [0, 'Carried forward days cannot be negative']
  },
  maxCarryForward: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for unique employee-leaveType-year combination
leaveBalanceSchema.index({ employeeId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

// Virtual for balance
leaveBalanceSchema.virtual('balance').get(function() {
  return this.allocated + this.carriedForward - this.used - this.pending;
});

// Virtual for remaining balance
leaveBalanceSchema.virtual('remaining').get(function() {
  return this.allocated + this.carriedForward - this.used;
});

// Method to use leave (when approved)
leaveBalanceSchema.methods.useLeave = function(days) {
  if (this.remaining < days) {
    throw new Error('Insufficient leave balance');
  }
  this.used += days;
  this.pending = Math.max(0, this.pending - days);
  return this.save();
};

// Method to add pending leave (when applied)
leaveBalanceSchema.methods.addPending = function(days) {
  if (this.remaining - this.pending < days) {
    throw new Error('Insufficient leave balance');
  }
  this.pending += days;
  return this.save();
};

// Method to remove pending leave (when cancelled/rejected)
leaveBalanceSchema.methods.removePending = function(days) {
  this.pending = Math.max(0, this.pending - days);
  return this.save();
};

// Method to carry forward balance
leaveBalanceSchema.methods.carryForward = function(maxDays) {
  const availableToCarry = this.allocated + this.carriedForward - this.used;
  this.maxCarryForward = maxDays;
  this.carriedForward = Math.min(availableToCarry, maxDays);
  return this.save();
};

// Static method to get or create balance
leaveBalanceSchema.statics.getOrCreate = async function(organizationId, employeeId, leaveTypeId, year, allocated) {
  let balance = await this.findOne({ employeeId, leaveTypeId, year });

  if (!balance) {
    balance = new this({
      organizationId,
      employeeId,
      leaveTypeId,
      year,
      allocated
    });
    await balance.save();
  }

  return balance;
};

// Static method to get all balances for an employee
leaveBalanceSchema.statics.getEmployeeBalances = async function(organizationId, employeeId, year) {
  return this.find({ organizationId, employeeId, year })
    .populate('leaveTypeId', 'name code color isPaid')
    .sort({ 'leaveTypeId.name': 1 });
};

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

export default LeaveBalance;