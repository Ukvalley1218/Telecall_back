import mongoose from 'mongoose';

/**
 * Production Batch Order Schema
 * For factory-made (FM) production batch orders
 */

// FM Stage Data Schema
const fmStageDataSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Delayed'],
    default: 'Not Started'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startDate: Date,
  endDate: Date,
  remarks: String,
  // Stage-specific fields
  receivedDate: Date,
  supplier: String,
  qualityCheck: String,
  siteVisitDate: Date,
  measurements: String,
  requirements: String,
  vendorName: String,
  purchaseDate: Date,
  amount: Number,
  hardwareList: String,
  planningDate: Date,
  assignedTo: String,
  supervisorName: String,
  teamMembers: [String],
  measurementDate: Date,
  deliveryDate: Date,
  receivedBy: String,
  estimatedEnd: Date,
  reworkReason: String,
  qcDate: Date,
  qcStatus: String,
  completionDate: Date,
  handoverDate: Date,
  clientSignature: String
}, { _id: false });

const productionBatchOrderSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Human-readable Batch Order ID (auto-generated)
  batchId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  // Client Information
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  clientEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  clientPhone: {
    type: String,
    trim: true
  },
  // Project Details
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  productType: {
    type: String,
    required: [true, 'Product type is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Production Line Assignment
  productionLine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionLine'
  },
  productionLineName: {
    type: String,
    trim: true
  },
  // Quantity
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  completedUnits: {
    type: Number,
    default: 0
  },
  // Timeline
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  startDate: Date,
  completedDate: Date,
  // Priority & Status
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Delayed', 'On Hold', 'Cancelled'],
    default: 'In Progress'
  },
  // Stage Tracking
  currentStage: {
    type: String,
    default: 'Material Received'
  },
  currentStageIndex: {
    type: Number,
    default: 0
  },
  // FM Stages Data (13 stages)
  stageData: {
    materialReceived: fmStageDataSchema,
    preInstallation: fmStageDataSchema,
    vendorPurchase: fmStageDataSchema,
    hardwarePurchase: fmStageDataSchema,
    itPlanning: fmStageDataSchema,
    supervisor: fmStageDataSchema,
    measurementTeam: fmStageDataSchema,
    delivery: fmStageDataSchema,
    installationStart: fmStageDataSchema,
    rework: fmStageDataSchema,
    qualityCheck: fmStageDataSchema,
    final: fmStageDataSchema,
    handover: fmStageDataSchema
  },
  // Progress
  completion: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Costing
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: 0
  },
  // Quality Check Reference
  qualityCheckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionQualityCheck'
  },
  qualityStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Passed', 'Failed'],
    default: 'Pending'
  },
  // Additional
  remarks: {
    type: String,
    trim: true
  },
  batch: {
    type: String,
    trim: true
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Activity Log
  activityLog: [{
    action: String,
    details: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
productionBatchOrderSchema.index({ organizationId: 1, status: 1 });
productionBatchOrderSchema.index({ organizationId: 1, priority: 1 });
productionBatchOrderSchema.index({ organizationId: 1, 'productionLine': 1 });
productionBatchOrderSchema.index({ organizationId: 1, dueDate: 1 });
productionBatchOrderSchema.index({ organizationId: 1, createdAt: -1 });

// Pre-save hook to generate batchId
productionBatchOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.batchId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    const year = new Date().getFullYear();
    this.batchId = `FMO-${year}-${String(count + 1).padStart(4, '0')}`;
    this.batch = `BATCH-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Method to add activity log
productionBatchOrderSchema.methods.addActivity = function(action, details, performedBy) {
  this.activityLog.push({
    action,
    details,
    performedBy,
    performedAt: new Date()
  });
  return this.save();
};

const ProductionBatchOrder = mongoose.model('ProductionBatchOrder', productionBatchOrderSchema);

export default ProductionBatchOrder;