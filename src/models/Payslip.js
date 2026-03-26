import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['statutory', 'voluntary', 'other'],
    default: 'other'
  }
}, { _id: false });

const payslipSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  payslipId: {
    type: String,
    unique: true,
    sparse: true
  },
  payrollRunId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PayrollRun',
    required: [true, 'Payroll run ID is required'],
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required'],
    index: true
  },
  salaryStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryStructure'
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
  // Employee details snapshot
  employeeDetails: {
    employeeCode: String,
    firstName: String,
    lastName: String,
    department: String,
    designation: String,
    panNumber: String,
    bankAccount: String,
    bankName: String,
    ifscCode: String
  },
  // Attendance details
  attendance: {
    workingDays: {
      type: Number,
      default: 22
    },
    presentDays: {
      type: Number,
      default: 0
    },
    absentDays: {
      type: Number,
      default: 0
    },
    paidLeaves: {
      type: Number,
      default: 0
    },
    unpaidLeaves: {
      type: Number,
      default: 0
    },
    halfDays: {
      type: Number,
      default: 0
    },
    lateMarks: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    }
  },
  // Earnings
  earnings: [earningSchema],
  grossEarnings: {
    type: Number,
    default: 0
  },
  // Deductions
  deductions: [deductionSchema],
  grossDeductions: {
    type: Number,
    default: 0
  },
  // Late mark deductions
  lateMarkDeduction: {
    type: Number,
    default: 0
  },
  // Overtime
  overtimeAmount: {
    type: Number,
    default: 0
  },
  // Incentives for the month
  incentiveAmount: {
    type: Number,
    default: 0
  },
  incentiveDetails: [{
    incentiveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incentive'
    },
    amount: Number,
    reason: String
  }],
  // Net salary
  netSalary: {
    type: Number,
    default: 0
  },
  // Salary per day calculation
  perDaySalary: {
    type: Number,
    default: 0
  },
  // Payment details
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'on_hold'],
    default: 'pending',
    index: true
  },
  paymentMode: {
    type: String,
    enum: ['bank_transfer', 'cheque', 'cash'],
    default: 'bank_transfer'
  },
  paymentDate: {
    type: Date
  },
  paymentReference: {
    type: String
  },
  paymentNotes: {
    type: String
  },
  // Tax calculations (simplified)
  taxDetails: {
    taxableIncome: {
      type: Number,
      default: 0
    },
    tdsDeducted: {
      type: Number,
      default: 0
    },
    professionalTax: {
      type: Number,
      default: 0
    }
  },
  // Year-to-date totals
  ytd: {
    grossEarnings: {
      type: Number,
      default: 0
    },
    grossDeductions: {
      type: Number,
      default: 0
    },
    netSalary: {
      type: Number,
      default: 0
    },
    tds: {
      type: Number,
      default: 0
    },
    pf: {
      type: Number,
      default: 0
    },
    esi: {
      type: Number,
      default: 0
    }
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'generated', 'sent', 'acknowledged'],
    default: 'draft'
  },
  sentAt: {
    type: Date
  },
  acknowledgedAt: {
    type: Date
  },
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
payslipSchema.index({ organizationId: 1, month: 1, year: 1 });
payslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
payslipSchema.index({ payrollRunId: 1, employeeId: 1 });

// Virtual for period display
payslipSchema.virtual('period').get(function() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[this.month - 1]} ${this.year}`;
});

// Virtual for total payable days
payslipSchema.virtual('totalPayableDays').get(function() {
  return this.attendance.presentDays +
    this.attendance.paidLeaves +
    (this.attendance.halfDays * 0.5);
});

// Pre-save hook to generate payslip ID
payslipSchema.pre('save', async function(next) {
  if (this.isNew && !this.payslipId) {
    const count = await this.constructor.countDocuments({
      organizationId: this.organizationId,
      month: this.month,
      year: this.year
    });
    this.payslipId = `PS${this.year}${String(this.month).padStart(2, '0')}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Static method to get payslips for employee
payslipSchema.statics.getForEmployee = function(employeeId, year) {
  const query = { employeeId };
  if (year) query.year = year;
  return this.find(query).sort({ year: -1, month: -1 });
};

// Static method to get payslips for payroll run
payslipSchema.statics.getForPayrollRun = function(payrollRunId) {
  return this.find({ payrollRunId })
    .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department');
};

// Static method to calculate YTD totals
payslipSchema.statics.calculateYTD = async function(employeeId, month, year) {
  const payslips = await this.find({
    employeeId,
    year,
    month: { $lte: month },
    status: { $ne: 'draft' }
  });

  return payslips.reduce((totals, payslip) => ({
    grossEarnings: totals.grossEarnings + payslip.grossEarnings,
    grossDeductions: totals.grossDeductions + payslip.grossDeductions,
    netSalary: totals.netSalary + payslip.netSalary,
    tds: totals.tds + (payslip.deductions.find(d => d.name.toLowerCase().includes('tds'))?.amount || 0),
    pf: totals.pf + (payslip.deductions.find(d => d.name.toLowerCase().includes('pf'))?.amount || 0),
    esi: totals.esi + (payslip.deductions.find(d => d.name.toLowerCase().includes('esi'))?.amount || 0)
  }), {
    grossEarnings: 0,
    grossDeductions: 0,
    netSalary: 0,
    tds: 0,
    pf: 0,
    esi: 0
  });
};

// Method to mark as paid
payslipSchema.methods.markPaid = async function(paymentDate, paymentReference, paymentNotes) {
  this.paymentStatus = 'paid';
  this.paymentDate = paymentDate || new Date();
  this.paymentReference = paymentReference;
  this.paymentNotes = paymentNotes;
  this.status = 'sent';
  this.sentAt = this.paymentDate;
  return this.save();
};

// Method to send payslip
payslipSchema.methods.send = async function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

const Payslip = mongoose.model('Payslip', payslipSchema);

export default Payslip;