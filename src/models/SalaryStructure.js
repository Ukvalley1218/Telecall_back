import mongoose from 'mongoose';

const salaryComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['earning', 'deduction'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  isPercentage: {
    type: Boolean,
    default: false
  },
  percentageOf: {
    type: String,
    enum: ['basic', 'gross', 'net'],
    default: null
  },
  isFixed: {
    type: Boolean,
    default: true
  },
  isTaxable: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const salaryStructureSchema = new mongoose.Schema({
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
    unique: true,
    index: true
  },
  structureId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Basic Salary
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: [0, 'Basic salary cannot be negative']
  },
  // Earnings
  hra: {
    type: Number,
    default: 0,
    min: [0, 'HRA cannot be negative']
  },
  hraPercentage: {
    type: Number,
    default: 0,
    min: [0, 'HRA percentage cannot be negative'],
    max: [100, 'HRA percentage cannot exceed 100']
  },
  conveyance: {
    type: Number,
    default: 0,
    min: [0, 'Conveyance cannot be negative']
  },
  medicalAllowance: {
    type: Number,
    default: 0,
    min: [0, 'Medical allowance cannot be negative']
  },
  specialAllowance: {
    type: Number,
    default: 0,
    min: [0, 'Special allowance cannot be negative']
  },
  lta: {
    type: Number,
    default: 0,
    min: [0, 'LTA cannot be negative']
  },
  otherAllowances: {
    type: Number,
    default: 0,
    min: [0, 'Other allowances cannot be negative']
  },
  // Deductions
  pf: {
    type: Number,
    default: 0,
    min: [0, 'PF cannot be negative']
  },
  pfPercentage: {
    type: Number,
    default: 0,
    min: [0, 'PF percentage cannot be negative'],
    max: [100, 'PF percentage cannot exceed 100']
  },
  esi: {
    type: Number,
    default: 0,
    min: [0, 'ESI cannot be negative']
  },
  esiPercentage: {
    type: Number,
    default: 0,
    min: [0, 'ESI percentage cannot be negative'],
    max: [100, 'ESI percentage cannot exceed 100']
  },
  professionalTax: {
    type: Number,
    default: 0,
    min: [0, 'Professional tax cannot be negative']
  },
  tds: {
    type: Number,
    default: 0,
    min: [0, 'TDS cannot be negative']
  },
  otherDeductions: {
    type: Number,
    default: 0,
    min: [0, 'Other deductions cannot be negative']
  },
  // Additional Components
  components: [salaryComponentSchema],
  // Gross and Net calculations (monthly)
  grossSalary: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  // CTC
  annualCtc: {
    type: Number,
    default: 0
  },
  // Effective dates
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: {
    type: Date
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Bank details for salary transfer
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountHolderName: String,
    branchName: String
  },
  // Meta
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

// Indexes
salaryStructureSchema.index({ organizationId: 1, isActive: 1 });

// Pre-save hook to calculate gross and net
salaryStructureSchema.pre('save', function(next) {
  // Calculate HRA if percentage based
  if (this.hraPercentage > 0) {
    this.hra = Math.round((this.basicSalary * this.hraPercentage) / 100);
  }

  // Calculate PF if percentage based
  if (this.pfPercentage > 0) {
    this.pf = Math.round((this.basicSalary * this.pfPercentage) / 100);
  }

  // Calculate ESI if percentage based
  if (this.esiPercentage > 0) {
    this.esi = Math.round((this.grossSalary * this.esiPercentage) / 100);
  }

  // Calculate gross salary (all earnings)
  this.grossSalary = this.basicSalary +
    this.hra +
    this.conveyance +
    this.medicalAllowance +
    this.specialAllowance +
    this.lta +
    this.otherAllowances;

  // Add custom earning components
  const customEarnings = this.components
    .filter(c => c.type === 'earning')
    .reduce((sum, c) => sum + c.amount, 0);
  this.grossSalary += customEarnings;

  // Calculate total deductions
  const totalDeductions = this.pf +
    this.esi +
    this.professionalTax +
    this.tds +
    this.otherDeductions;

  // Add custom deduction components
  const customDeductions = this.components
    .filter(c => c.type === 'deduction')
    .reduce((sum, c) => sum + c.amount, 0);

  // Calculate net salary
  this.netSalary = this.grossSalary - totalDeductions - customDeductions;

  // Calculate annual CTC (gross * 12 + any other annual benefits)
  this.annualCtc = this.grossSalary * 12;

  // Generate structure ID if new
  if (this.isNew && !this.structureId) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.structureId = `SAL${year}${random}`;
  }

  next();
});

// Static method to get active structure for employee
salaryStructureSchema.statics.getActiveForEmployee = function(employeeId) {
  return this.findOne({ employeeId, isActive: true });
};

// Static method to get all structures for organization
salaryStructureSchema.statics.getAllForOrganization = function(organizationId, filters = {}) {
  const query = { organizationId, isActive: true, ...filters };
  return this.find(query)
    .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
    .sort({ createdAt: -1 });
};

// Method to calculate monthly salary with attendance adjustments
salaryStructureSchema.methods.calculateMonthlySalary = function(workingDays, presentDays, unpaidLeaves, lateMarkDeductions = 0) {
  const perDaySalary = this.grossSalary / workingDays;

  // Deductions for unpaid leave
  const unpaidDeduction = perDaySalary * unpaidLeaves;

  // Calculate payable days
  const payableDays = presentDays;
  const payableGross = perDaySalary * payableDays;

  // Pro-rate deductions
  const pfDeduction = (this.pf / workingDays) * payableDays;
  const esiDeduction = (this.esi / workingDays) * payableDays;
  const ptDeduction = this.professionalTax; // PT is usually fixed per month
  const tdsDeduction = (this.tds / workingDays) * payableDays;

  const totalDeductions = pfDeduction + esiDeduction + ptDeduction + tdsDeduction + lateMarkDeductions + unpaidDeduction;

  return {
    grossSalary: this.grossSalary,
    payableGross: Math.round(payableGross),
    perDaySalary: Math.round(perDaySalary),
    earnings: {
      basic: Math.round((this.basicSalary / workingDays) * payableDays),
      hra: Math.round((this.hra / workingDays) * payableDays),
      conveyance: Math.round((this.conveyance / workingDays) * payableDays),
      medicalAllowance: Math.round((this.medicalAllowance / workingDays) * payableDays),
      specialAllowance: Math.round((this.specialAllowance / workingDays) * payableDays),
      lta: Math.round((this.lta / workingDays) * payableDays),
      otherAllowances: Math.round((this.otherAllowances / workingDays) * payableDays)
    },
    deductions: {
      pf: Math.round(pfDeduction),
      esi: Math.round(esiDeduction),
      professionalTax: Math.round(ptDeduction),
      tds: Math.round(tdsDeduction),
      unpaidLeave: Math.round(unpaidDeduction),
      lateMark: Math.round(lateMarkDeductions)
    },
    netSalary: Math.round(payableGross - totalDeductions),
    workingDays,
    payableDays,
    unpaidLeaves
  };
};

const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);

export default SalaryStructure;