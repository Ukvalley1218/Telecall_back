import mongoose from 'mongoose';

/**
 * Production Work Order Schema
 * For handmade (HM) production work orders
 */

// HM Stage Data Schema
const hmStageDataSchema = new mongoose.Schema({
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
  supervisorName: String,
  assignedDate: Date,
  teamMembers: [String],
  purchaseDate: Date,
  vendor: String,
  amount: Number,
  deliveryDate: Date,
  receivedBy: String,
  assignedArtisan: String,
  stageDetails: String,
  qcDate: Date,
  qcStatus: String,
  handoverDate: Date,
  clientApproval: Boolean,
  satisfactionPercentage: Number,
  feedback: String,
  // Sub-stage progress for S1, S2, S3
  subStages: [{
    key: String,
    name: String,
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }]
}, { _id: false });

// Stage History Schema
const stageHistorySchema = new mongoose.Schema({
  stage: {
    type: String,
    required: true
  },
  startedAt: Date,
  completedAt: Date,
  status: {
    type: String,
    enum: ['Done', 'Running', 'Delayed', 'Skipped']
  },
  remarks: String
}, { _id: false });

const productionWorkOrderSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Human-readable Work Order ID (auto-generated)
  workOrderId: {
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
  clientAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String
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
  // Assignment
  assignedArtisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionArtisan'
  },
  assignedArtisanName: {
    type: String,
    trim: true
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
    enum: ['Active', 'Delayed', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Active'
  },
  // Stage Tracking
  currentStage: {
    type: String,
    default: 'Supervisor'
  },
  currentStageIndex: {
    type: Number,
    default: 0
  },
  stageStatus: {
    type: String,
    enum: ['Not Started', 'Running', 'Delayed', 'Done'],
    default: 'Not Started'
  },
  // HM Stages Data (13 stages)
  stageData: {
    supervisor: hmStageDataSchema,
    workingTeam: hmStageDataSchema,
    purchase: hmStageDataSchema,
    delivery: hmStageDataSchema,
    startWork: hmStageDataSchema,
    stage: hmStageDataSchema,
    s1Structure: hmStageDataSchema,
    s2Laminate: hmStageDataSchema,
    s3Hardware: hmStageDataSchema,
    qc: hmStageDataSchema,
    remark: hmStageDataSchema,
    handover: hmStageDataSchema,
    clientSatisfaction: hmStageDataSchema
  },
  // Stage History
  stageHistory: [stageHistorySchema],
  // Progress
  completion: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  completedStages: {
    type: Number,
    default: 0
  },
  totalStages: {
    type: Number,
    default: 13
  },
  // Material Reference
  materialIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionMaterial'
  }],
  materialStatus: {
    type: String,
    enum: ['Ready', 'Partial', 'Missing', 'Ordered'],
    default: 'Missing'
  },
  // Quality Check
  qcId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionQualityCheck'
  },
  qcStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Passed', 'Failed', 'Rework'],
    default: 'Pending'
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
  labourCost: {
    type: Number,
    default: 0
  },
  materialCost: {
    type: Number,
    default: 0
  },
  // Additional
  remarks: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Installation Photos
  photos: {
    // Photo before dispatch from factory/workshop
    beforeDispatch: {
      url: String,
      publicId: String, // For cloud storage
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: Date,
      remarks: String
    },
    // Photo at site before installation starts
    beforeInstallation: {
      url: String,
      publicId: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: Date,
      remarks: String
    },
    // Photo after installation is complete
    afterInstallation: {
      url: String,
      publicId: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: Date,
      remarks: String
    }
  },
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
productionWorkOrderSchema.index({ organizationId: 1, status: 1 });
productionWorkOrderSchema.index({ organizationId: 1, priority: 1 });
productionWorkOrderSchema.index({ organizationId: 1, 'assignedArtisan': 1 });
productionWorkOrderSchema.index({ organizationId: 1, dueDate: 1 });
productionWorkOrderSchema.index({ organizationId: 1, createdAt: -1 });

// Virtual for days left
productionWorkOrderSchema.virtual('daysLeft').get(function() {
  if (!this.dueDate) return null;
  const today = new Date();
  const due = new Date(this.dueDate);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
});

// Pre-save hook to generate workOrderId
productionWorkOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.workOrderId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    const year = new Date().getFullYear();
    this.workOrderId = `WO-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to add activity log
productionWorkOrderSchema.methods.addActivity = function(action, details, performedBy) {
  this.activityLog.push({
    action,
    details,
    performedBy,
    performedAt: new Date()
  });
  return this.save();
};

const ProductionWorkOrder = mongoose.model('ProductionWorkOrder', productionWorkOrderSchema);

export default ProductionWorkOrder;