import mongoose from 'mongoose';
import { EMPLOYEE_STATUS } from '../config/constants.js';
import { generateEmployeeId } from '../utils/helpers.js';

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  name: String,
  relationship: String,
  phone: String
}, { _id: false });

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['aadhar', 'pan', 'education', 'experience', 'other']
  },
  name: String,
  url: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const employeeSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  },
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    address: addressSchema,
    emergencyContact: emergencyContactSchema
  },
  employment: {
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract'],
      default: 'full-time'
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    probationPeriod: {
      type: Number,
      default: 6,
      min: [0, 'Probation period cannot be negative']
    },
    probationEndDate: Date
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
  assignedKPIs: [{
    kpiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KPI',
      required: true
    },
    targetValue: {
      type: Number,
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  overtimeAllowed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: Object.values(EMPLOYEE_STATUS),
    default: EMPLOYEE_STATUS.ACTIVE
  },
  documents: [documentSchema],
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountHolderName: String
  },
  salary: {
    basic: Number,
    allowances: Number,
    incentives: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
employeeSchema.index({ organizationId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ organizationId: 1, status: 1 });
employeeSchema.index({ 'personalInfo.email': 1 });
employeeSchema.index({ userId: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for shift details
employeeSchema.virtual('shift', {
  ref: 'Shift',
  localField: 'shiftId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to generate employee ID
employeeSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Employee = mongoose.model('Employee');
    const count = await Employee.countDocuments({ organizationId: this.organizationId });
    const org = await mongoose.model('Organization').findById(this.organizationId);
    const prefix = org?.name?.substring(0, 3).toUpperCase() || 'EMP';
    this.employeeId = generateEmployeeId(prefix, count + 1);

    // Calculate probation end date
    if (this.employment.joiningDate && this.employment.probationPeriod) {
      this.employment.probationEndDate = new Date(this.employment.joiningDate);
      this.employment.probationEndDate.setMonth(
        this.employment.probationEndDate.getMonth() + this.employment.probationPeriod
      );
    }
  }
  next();
});

// Static method to find active employees
employeeSchema.statics.findActive = function(organizationId) {
  return this.find({ organizationId, status: EMPLOYEE_STATUS.ACTIVE });
};

// Method to check if employee is on probation
employeeSchema.methods.isOnProbation = function() {
  if (!this.employment.probationEndDate) return false;
  return new Date() < this.employment.probationEndDate;
};

// Method to assign KPI
employeeSchema.methods.assignKPI = async function(kpiId, targetValue, assignedBy) {
  this.assignedKPIs.push({
    kpiId,
    targetValue,
    assignedBy
  });
  return this.save();
};

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;