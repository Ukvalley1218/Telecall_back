import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Leave type name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  code: {
    type: String,
    required: [true, 'Leave type code is required'],
    trim: true,
    uppercase: true,
    maxlength: [20, 'Code cannot exceed 20 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  annualQuota: {
    type: Number,
    required: [true, 'Annual quota is required'],
    min: [0, 'Annual quota cannot be negative'],
    default: 0
  },
  carryForward: {
    type: Boolean,
    default: false
  },
  maxCarryForward: {
    type: Number,
    default: 0,
    min: [0, 'Max carry forward cannot be negative']
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  isEncashable: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#6B7280',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format']
  },
  applicableAfterMonths: {
    type: Number,
    default: 0,
    min: [0, 'Applicable after months cannot be negative']
  },
  maxConsecutiveDays: {
    type: Number,
    default: 0,
    min: [0, 'Max consecutive days cannot be negative']
  },
  requireDocument: {
    type: Boolean,
    default: false
  },
  documentMandatoryAfterDays: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for unique leave type code per organization
leaveTypeSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// Static method to find active leave types
leaveTypeSchema.statics.findActive = function(organizationId) {
  return this.find({ organizationId, isActive: true }).sort({ name: 1 });
};

// Method to calculate pro-rated quota
leaveTypeSchema.methods.calculateProRatedQuota = function(joiningDate, year) {
  if (!this.annualQuota) return 0;

  const joiningYear = new Date(joiningDate).getFullYear();
  if (joiningYear !== year) return this.annualQuota;

  const joiningMonth = new Date(joiningDate).getMonth();
  const monthsInYear = 12 - joiningMonth;

  return Math.floor((this.annualQuota / 12) * monthsInYear);
};

const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);

export default LeaveType;