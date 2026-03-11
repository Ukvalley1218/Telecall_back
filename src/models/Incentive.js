import mongoose from 'mongoose';
import { INCENTIVE_STATUS, INCENTIVE_REASONS } from '../config/constants.js';
import { calculateIncentivePayableDate } from '../utils/helpers.js';

const incentiveSchema = new mongoose.Schema({
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
  salesAmount: {
    type: Number,
    required: [true, 'Sales amount is required'],
    min: [0, 'Sales amount cannot be negative']
  },
  incentivePercentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  incentiveAmount: {
    type: Number,
    required: [true, 'Incentive amount is required'],
    min: [0, 'Incentive amount cannot be negative']
  },
  reason: {
    type: String,
    enum: Object.values(INCENTIVE_REASONS),
    required: [true, 'Reason is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  salesDate: {
    type: Date,
    required: [true, 'Sales date is required'],
    default: Date.now
  },
  payableDate: {
    type: Date
  },
  status: {
    type: String,
    enum: Object.values(INCENTIVE_STATUS),
    default: INCENTIVE_STATUS.PENDING
  },
  paidDate: Date,
  paymentReference: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
incentiveSchema.index({ organizationId: 1, status: 1 });
incentiveSchema.index({ employeeId: 1, salesDate: -1 });
incentiveSchema.index({ payableDate: 1, status: 1 });

// Virtual for employee
incentiveSchema.virtual('employee', {
  ref: 'Employee',
  localField: 'employeeId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to calculate payable date
incentiveSchema.pre('save', async function(next) {
  if (this.isNew && !this.payableDate) {
    const Organization = mongoose.model('Organization');
    const organization = await Organization.findById(this.organizationId);
    const payoutDays = organization?.settings?.incentivePayoutDays || 45;
    this.payableDate = calculateIncentivePayableDate(this.salesDate, payoutDays);
  }
  next();
});

// Method to mark as paid
incentiveSchema.methods.markAsPaid = async function(paymentReference) {
  this.status = INCENTIVE_STATUS.PAID;
  this.paidDate = new Date();
  this.paymentReference = paymentReference;
  return this.save();
};

// Method to cancel incentive
incentiveSchema.methods.cancel = async function(reason) {
  if (this.status === INCENTIVE_STATUS.PAID) {
    throw new Error('Cannot cancel a paid incentive');
  }
  this.status = INCENTIVE_STATUS.CANCELLED;
  this.notes = reason;
  return this.save();
};

// Static method to get pending incentives for an employee
incentiveSchema.statics.getPendingIncentives = function(employeeId) {
  return this.find({
    employeeId,
    status: INCENTIVE_STATUS.PENDING
  }).sort({ payableDate: 1 });
};

// Static method to get payable incentives for a date range
incentiveSchema.statics.getPayableIncentives = function(organizationId, startDate, endDate) {
  return this.find({
    organizationId,
    status: INCENTIVE_STATUS.PENDING,
    payableDate: { $gte: startDate, $lte: endDate }
  }).populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId');
};

// Static method to calculate total incentive for an employee
incentiveSchema.statics.calculateEmployeeTotalIncentive = async function(employeeId, status = null) {
  const query = { employeeId };
  if (status) query.status = status;

  const result = await this.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$incentiveAmount' } } }
  ]);

  return result[0]?.total || 0;
};

const Incentive = mongoose.model('Incentive', incentiveSchema);

export default Incentive;