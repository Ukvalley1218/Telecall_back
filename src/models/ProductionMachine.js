import mongoose from 'mongoose';

/**
 * Production Machine Schema
 * Factory machines
 */

const productionMachineSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Human-readable Machine ID (auto-generated)
  machineId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  // Machine Details
  name: {
    type: String,
    required: [true, 'Machine name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Cutting', 'Edge Banding', 'Assembly', 'Finishing', 'Pressing', 'Drilling', 'Sanding', 'Other'],
    required: true
  },
  // Production Line
  line: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionLine'
  },
  lineRef: {
    type: String,
    trim: true
  },
  // Status
  status: {
    type: String,
    enum: ['Running', 'Maintenance', 'Stopped', 'Error'],
    default: 'Running'
  },
  // Performance
  efficiency: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  temperature: {
    type: Number,
    default: 25
  },
  runtime: {
    type: Number,
    default: 0
  },
  downtime: {
    type: Number,
    default: 0
  },
  // Operator
  operator: {
    type: String,
    trim: true
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  // Power & Speed
  powerConsumption: {
    type: Number,
    default: 0
  },
  speed: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Maintenance
  lastMaintenance: Date,
  nextMaintenance: Date,
  maintenanceHistory: [{
    date: Date,
    type: {
      type: String,
      enum: ['Scheduled', 'Emergency', 'Preventive']
    },
    description: String,
    performedBy: String
  }],
  // Specifications
  manufacturer: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },
  purchaseDate: Date,
  warrantyExpiry: Date,
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
productionMachineSchema.index({ organizationId: 1, status: 1 });
productionMachineSchema.index({ organizationId: 1, type: 1 });
productionMachineSchema.index({ organizationId: 1, line: 1 });

// Pre-save hook
productionMachineSchema.pre('save', async function(next) {
  if (this.isNew && !this.machineId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    this.machineId = `M-${String(count + 1).padStart(3, '0')}`;
  }

  // If machine is in maintenance or stopped, set efficiency to 0
  if (this.status === 'Maintenance' || this.status === 'Stopped') {
    this.efficiency = 0;
    this.speed = 0;
    this.powerConsumption = 0;
  }

  next();
});

const ProductionMachine = mongoose.model('ProductionMachine', productionMachineSchema);

export default ProductionMachine;