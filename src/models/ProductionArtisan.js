import mongoose from 'mongoose';

/**
 * Production Artisan Schema
 * For handmade production workers
 */
const productionArtisanSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Human-readable Artisan ID (auto-generated)
  artisanId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  // Personal Information
  name: {
    type: String,
    required: [true, 'Artisan name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  avatar: {
    type: String,
    default: ''
  },
  // Work Details
  skillCategory: {
    type: String,
    required: [true, 'Skill category is required'],
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  specialization: {
    type: String,
    trim: true
  },
  // Assignment & Workload
  assignedWorkOrders: [{
    type: String,
    ref: 'ProductionWorkOrder'
  }],
  activeWorkload: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  availableHoursPerDay: {
    type: Number,
    default: 8
  },
  currentUtilization: {
    type: Number,
    default: 0
  },
  // Performance Metrics
  efficiency: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  avgCompletionTime: {
    type: Number,
    default: 0
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  customerRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  // Status
  status: {
    type: String,
    enum: ['Available', 'On Project', 'On Leave', 'Overloaded'],
    default: 'Available'
  },
  leaveDates: [{
    type: Date
  }],
  workingDays: [{
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }],
  // Location
  location: {
    type: String,
    trim: true
  },
  // Issues & Stats
  overdueTasks: {
    type: Number,
    default: 0
  },
  reworkCount: {
    type: Number,
    default: 0
  },
  // Employment
  joinDate: {
    type: Date
  },
  dailyWage: {
    type: Number,
    default: 0
  },
  // Additional Info
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
productionArtisanSchema.index({ organizationId: 1, status: 1 });
productionArtisanSchema.index({ organizationId: 1, skillCategory: 1 });

// Pre-save hook to generate artisanId
productionArtisanSchema.pre('save', async function(next) {
  if (this.isNew && !this.artisanId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    this.artisanId = `ART-${String(count + 1).padStart(4, '0')}`;
    this.avatar = this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  next();
});

const ProductionArtisan = mongoose.model('ProductionArtisan', productionArtisanSchema);

export default ProductionArtisan;