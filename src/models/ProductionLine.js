import mongoose from 'mongoose';

/**
 * Production Line Schema
 * Factory production lines
 */

const productionLineSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Human-readable Line ID (auto-generated)
  lineId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  // Line Details
  name: {
    type: String,
    required: [true, 'Production line name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Assembly', 'Cutting', 'Finishing', 'Edge Banding', 'Pressing', 'Packing'],
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['Running', 'Maintenance', 'Stopped'],
    default: 'Running'
  },
  // Current Production
  currentProduct: {
    type: String,
    trim: true
  },
  workOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionBatchOrder'
  },
  workOrderRef: {
    type: String,
    trim: true
  },
  // Capacity & Output
  capacity: {
    type: Number,
    default: 100
  },
  output: {
    type: Number,
    default: 0
  },
  efficiency: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Assignment
  operator: {
    type: String,
    trim: true
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  shift: {
    type: String,
    enum: ['Morning', 'Evening', 'Night'],
    default: 'Morning'
  },
  workers: {
    type: Number,
    default: 0
  },
  // Machines
  machines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionMachine'
  }],
  // Maintenance
  downtime: {
    type: Number,
    default: 0
  },
  lastMaintenance: Date,
  nextMaintenance: Date,
  // Location
  location: {
    type: String,
    trim: true
  },
  // Additional
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
productionLineSchema.index({ organizationId: 1, status: 1 });
productionLineSchema.index({ organizationId: 1, type: 1 });

// Pre-save hook
productionLineSchema.pre('save', async function(next) {
  if (this.isNew && !this.lineId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    this.lineId = `PL-${String(count + 1).padStart(3, '0')}`;
  }

  // Calculate efficiency
  if (this.capacity > 0) {
    this.efficiency = Math.min(100, Math.round((this.output / this.capacity) * 100));
  }

  next();
});

const ProductionLine = mongoose.model('ProductionLine', productionLineSchema);

export default ProductionLine;