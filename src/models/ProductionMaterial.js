import mongoose from 'mongoose';

/**
 * Production Material Schema
 * Materials for production work orders
 */

const productionMaterialSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Human-readable Material ID (auto-generated)
  materialId: {
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
  // Material Details
  materialName: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Raw Material', 'Hardware', 'Finish', 'Consumable'],
    required: true
  },
  unit: {
    type: String,
    default: 'units'
  },
  // Quantity
  requiredQty: {
    type: Number,
    required: [true, 'Required quantity is required'],
    min: 0
  },
  availableQty: {
    type: Number,
    default: 0,
    min: 0
  },
  shortage: {
    type: Number,
    default: 0
  },
  // Costing
  unitCost: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  // Status
  status: {
    type: String,
    enum: ['Ready', 'Partial', 'Missing', 'Ordered', 'In Transit'],
    default: 'Missing'
  },
  procurementStatus: {
    type: String,
    enum: ['Available', 'Ordered', 'In Transit', 'Pending'],
    default: 'Pending'
  },
  // Supplier Information
  supplier: {
    type: String,
    trim: true
  },
  supplierContact: {
    type: String,
    trim: true
  },
  // Procurement Details
  purchaseOrderRef: {
    type: String,
    trim: true
  },
  expectedDeliveryDate: Date,
  orderedDate: Date,
  receivedDate: Date,
  // Storage
  storageLocation: {
    type: String,
    trim: true
  },
  // Quality
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C'],
    default: 'A'
  },
  inspectionStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  // Additional
  notes: {
    type: String,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
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
productionMaterialSchema.index({ organizationId: 1, status: 1 });
productionMaterialSchema.index({ organizationId: 1, category: 1 });
productionMaterialSchema.index({ organizationId: 1, workOrderId: 1 });

// Pre-save hook
productionMaterialSchema.pre('save', async function(next) {
  if (this.isNew && !this.materialId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    this.materialId = `MAT-${String(count + 1).padStart(4, '0')}`;
  }

  // Calculate shortage and total cost
  this.shortage = Math.max(0, this.requiredQty - this.availableQty);
  this.totalCost = this.availableQty * this.unitCost;

  // Auto-update status
  if (this.availableQty >= this.requiredQty) {
    this.status = 'Ready';
  } else if (this.availableQty > 0) {
    this.status = 'Partial';
  } else if (this.procurementStatus === 'Ordered') {
    this.status = 'Ordered';
  } else if (this.procurementStatus === 'In Transit') {
    this.status = 'In Transit';
  } else {
    this.status = 'Missing';
  }

  this.lastUpdated = new Date();
  next();
});

const ProductionMaterial = mongoose.model('ProductionMaterial', productionMaterialSchema);

export default ProductionMaterial;