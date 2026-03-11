import mongoose from 'mongoose';
import { generateKPIId } from '../utils/helpers.js';

const kpiSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  kpiId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'KPI name is required'],
    trim: true,
    maxlength: [100, 'KPI name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['Rs', 'Count', 'Percentage', 'Hours', 'Days']
  },
  group: {
    type: String,
    required: [true, 'KPI group is required'],
    enum: ['Sales', 'Design', 'Production', 'Recruitment', 'IT', 'Marketing', 'Finance', 'Support', 'Quality', 'Operations', 'Other']
  },
  targetValue: {
    type: Number,
    required: [true, 'Target value is required'],
    min: [0, 'Target value cannot be negative']
  },
  maxValue: {
    type: Number,
    min: [0, 'Max value cannot be negative']
  },
  weightage: {
    type: Number,
    default: 1,
    min: [0.1, 'Weightage must be at least 0.1'],
    max: [10, 'Weightage cannot exceed 10']
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
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

// Indexes
kpiSchema.index({ organizationId: 1, isActive: 1 });
kpiSchema.index({ organizationId: 1, group: 1 });

// Pre-save hook to generate KPI ID
kpiSchema.pre('save', async function(next) {
  if (this.isNew && !this.kpiId) {
    const KPI = mongoose.model('KPI');
    const count = await KPI.countDocuments({ organizationId: this.organizationId });
    this.kpiId = generateKPIId(this.group, count + 1);
  }
  next();
});

// Virtual for employee assignments
kpiSchema.virtual('employeeAssignments', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'assignedKPIs.kpiId'
});

// Static method to find active KPIs
kpiSchema.statics.findActive = function(organizationId) {
  return this.find({ organizationId, isActive: true });
};

// Static method to find by group
kpiSchema.statics.findByGroup = function(organizationId, group) {
  return this.find({ organizationId, group, isActive: true });
};

const KPI = mongoose.model('KPI', kpiSchema);

export default KPI;