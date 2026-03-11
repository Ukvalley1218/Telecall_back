import mongoose from 'mongoose';
import { SUBSCRIPTION_PLANS } from '../config/constants.js';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  domain: {
    type: String,
    required: [true, 'Domain is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Domain can only contain lowercase letters, numbers, and hyphens']
  },
  subscriptionPlan: {
    type: String,
    enum: Object.values(SUBSCRIPTION_PLANS),
    default: SUBSCRIPTION_PLANS.FREE
  },
  maxEmployees: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    lateMarkBuffer: {
      type: Number,
      default: 10,
      min: [0, 'Buffer cannot be negative'],
      max: [60, 'Buffer cannot exceed 60 minutes']
    },
    sandwichLeaveEnabled: {
      type: Boolean,
      default: true
    },
    incentivePayoutDays: {
      type: Number,
      default: 45,
      min: [1, 'Payout days must be at least 1']
    },
    workingDaysPerWeek: {
      type: Number,
      default: 6,
      min: [1, 'Minimum 1 working day'],
      max: [7, 'Maximum 7 working days']
    },
    overtimeMultiplier: {
      type: Number,
      default: 1.5,
      min: [1, 'Multiplier cannot be less than 1']
    }
  },
  contactDetails: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for employee count
organizationSchema.virtual('employeeCount', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'organizationId',
  count: true
});

// Index for faster queries
organizationSchema.index({ isActive: 1 });

// Method to check if organization can add more employees
organizationSchema.methods.canAddEmployee = async function() {
  const Employee = mongoose.model('Employee');
  const count = await Employee.countDocuments({
    organizationId: this._id,
    status: 'active'
  });
  return count < this.maxEmployees;
};

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;