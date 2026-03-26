import mongoose from 'mongoose';

const payrollRunSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  runId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Payroll run name is required'],
    trim: true
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
    min: 2020,
    max: 2100
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required']
  },
  status: {
    type: String,
    enum: ['draft', 'processing', 'processed', 'approved', 'paid', 'cancelled'],
    default: 'draft',
    index: true
  },
  // Summary statistics
  totalEmployees: {
    type: Number,
    default: 0
  },
  processedEmployees: {
    type: Number,
    default: 0
  },
  totalGross: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  totalNet: {
    type: Number,
    default: 0
  },
  totalIncentives: {
    type: Number,
    default: 0
  },
  // Working days calculation
  workingDays: {
    type: Number,
    default: 22
  },
  holidays: {
    type: Number,
    default: 0
  },
  weekends: {
    type: Number,
    default: 8
  },
  // Department breakdown
  departmentSummary: [{
    department: String,
    employeeCount: Number,
    totalGross: Number,
    totalDeductions: Number,
    totalNet: Number
  }],
  // Approval workflow
  approvalHistory: [{
    action: {
      type: String,
      enum: ['created', 'processed', 'approved', 'rejected', 'paid', 'cancelled']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    comments: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
payrollRunSchema.index({ organizationId: 1, month: 1, year: 1 });
payrollRunSchema.index({ organizationId: 1, status: 1 });

// Virtual for period display
payrollRunSchema.virtual('period').get(function() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[this.month - 1]} ${this.year}`;
});

// Pre-save hook to generate run ID
payrollRunSchema.pre('save', async function(next) {
  if (this.isNew && !this.runId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    this.runId = `PR${this.year}${String(this.month).padStart(2, '0')}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Static method to check if payroll already run for month
payrollRunSchema.statics.existsForMonth = async function(organizationId, month, year) {
  const run = await this.findOne({
    organizationId,
    month,
    year,
    status: { $nin: ['cancelled', 'draft'] }
  });
  return !!run;
};

// Static method to get current runs
payrollRunSchema.statics.getCurrentRuns = function(organizationId) {
  return this.find({
    organizationId,
    status: { $in: ['draft', 'processing', 'processed', 'approved'] }
  }).sort({ createdAt: -1 });
};

// Method to start processing
payrollRunSchema.methods.startProcessing = async function(userId) {
  if (this.status !== 'draft') {
    throw new Error('Only draft payroll runs can be processed');
  }

  this.status = 'processing';
  this.approvalHistory.push({
    action: 'processing',
    userId,
    timestamp: new Date()
  });

  return this.save();
};

// Method to mark as processed
payrollRunSchema.methods.markProcessed = async function(userId, summary) {
  this.status = 'processed';
  this.processedBy = userId;
  this.totalEmployees = summary.totalEmployees;
  this.processedEmployees = summary.processedEmployees;
  this.totalGross = summary.totalGross;
  this.totalDeductions = summary.totalDeductions;
  this.totalNet = summary.totalNet;
  this.totalIncentives = summary.totalIncentives || 0;
  this.departmentSummary = summary.departmentSummary || [];

  this.approvalHistory.push({
    action: 'processed',
    userId,
    timestamp: new Date()
  });

  return this.save();
};

// Method to approve
payrollRunSchema.methods.approve = async function(userId, comments) {
  if (this.status !== 'processed') {
    throw new Error('Only processed payroll runs can be approved');
  }

  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();

  this.approvalHistory.push({
    action: 'approved',
    userId,
    timestamp: new Date(),
    comments
  });

  return this.save();
};

// Method to mark as paid
payrollRunSchema.methods.markPaid = async function(userId, paymentDate) {
  if (this.status !== 'approved') {
    throw new Error('Only approved payroll runs can be marked as paid');
  }

  this.status = 'paid';
  this.paidBy = userId;
  this.paidAt = paymentDate || new Date();

  this.approvalHistory.push({
    action: 'paid',
    userId,
    timestamp: new Date()
  });

  return this.save();
};

// Method to cancel
payrollRunSchema.methods.cancel = async function(userId, reason) {
  if (this.status === 'paid') {
    throw new Error('Paid payroll runs cannot be cancelled');
  }

  this.status = 'cancelled';

  this.approvalHistory.push({
    action: 'cancelled',
    userId,
    timestamp: new Date(),
    comments: reason
  });

  return this.save();
};

const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);

export default PayrollRun;