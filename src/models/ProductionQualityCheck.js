import mongoose from 'mongoose';

/**
 * Production Quality Check Schema
 */

// Checklist Item Schema
const checklistItemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail', 'Pending'],
    default: 'Pending'
  },
  notes: String
}, { _id: false });

// Issue Schema
const qcIssueSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  resolved: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const productionQualityCheckSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Human-readable QC ID (auto-generated)
  qcId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  // Work Order Reference
  workOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionWorkOrder'
  },
  workOrderRef: {
    type: String,
    trim: true
  },
  // For Factory Orders
  batchOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionBatchOrder'
  },
  batchOrderRef: {
    type: String,
    trim: true
  },
  // Product Info
  productName: {
    type: String,
    trim: true
  },
  batch: {
    type: String,
    trim: true
  },
  // QC Type
  qcType: {
    type: String,
    enum: ['Initial', 'In-Process', 'Final', 'Pre-Dispatch', 'Work Order', 'Batch Order'],
    required: true
  },
  // Stage
  stage: {
    type: String,
    trim: true
  },
  // Checklist
  checklist: [checklistItemSchema],
  // Status
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Passed', 'Failed', 'Rework'],
    default: 'Pending'
  },
  // Score
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  // Issues Found
  issues: [qcIssueSchema],
  // Inspection Details
  inspector: {
    type: String,
    trim: true
  },
  inspectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  inspectionDate: Date,
  // Approval
  approvedBy: {
    type: String,
    trim: true
  },
  approvalDate: Date,
  approvalComments: {
    type: String,
    trim: true
  },
  // Rework
  reworkRequired: {
    type: Boolean,
    default: false
  },
  reworkDetails: {
    type: String,
    trim: true
  },
  reworkAssignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionArtisan'
  },
  reworkStatus: {
    type: String,
    enum: ['Not Required', 'Pending', 'In Progress', 'Completed']
  },
  // For Factory QA - Quantity tracking
  quantity: {
    type: Number,
    default: 0
  },
  inspectedQty: {
    type: Number,
    default: 0
  },
  passQty: {
    type: Number,
    default: 0
  },
  failQty: {
    type: Number,
    default: 0
  },
  defects: [{
    type: {
      type: String,
      trim: true
    },
    count: {
      type: Number,
      default: 0
    },
    severity: {
      type: String,
      enum: ['Minor', 'Major', 'Critical']
    }
  }],
  // Additional
  notes: {
    type: String,
    trim: true
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
productionQualityCheckSchema.index({ organizationId: 1, status: 1 });
productionQualityCheckSchema.index({ organizationId: 1, qcType: 1 });
productionQualityCheckSchema.index({ organizationId: 1, workOrderId: 1 });

// Pre-save hook
productionQualityCheckSchema.pre('save', async function(next) {
  if (this.isNew && !this.qcId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    this.qcId = `QC-${String(count + 1).padStart(4, '0')}`;
  }

  // Calculate overall score from checklist
  if (this.checklist && this.checklist.length > 0) {
    const passed = this.checklist.filter(item => item.status === 'Pass').length;
    this.overallScore = Math.round((passed / this.checklist.length) * 100);

    // Auto-set status based on score
    if (this.status === 'In Progress') {
      if (this.overallScore === 100) {
        this.status = 'Passed';
      } else if (this.checklist.some(item => item.status === 'Fail')) {
        this.status = 'Failed';
      }
    }
  }

  next();
});

const ProductionQualityCheck = mongoose.model('ProductionQualityCheck', productionQualityCheckSchema);

export default ProductionQualityCheck;