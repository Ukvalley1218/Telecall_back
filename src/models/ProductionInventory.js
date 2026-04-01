import mongoose from 'mongoose';

/**
 * Production Inventory Schema
 * Factory inventory/stock management
 */

const productionInventorySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Human-readable Inventory ID (auto-generated)
  inventoryId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  // SKU
  sku: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  // Item Details
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
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
  // Stock Levels
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  minStock: {
    type: Number,
    default: 0,
    min: 0
  },
  maxStock: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 0,
    min: 0
  },
  // Costing
  unitCost: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  // Status
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Critical', 'Out of Stock'],
    default: 'In Stock'
  },
  movement: {
    type: String,
    enum: ['in', 'out', 'stable'],
    default: 'stable'
  },
  // Supplier
  supplier: {
    type: String,
    trim: true
  },
  supplierContact: {
    type: String,
    trim: true
  },
  // Location
  location: {
    type: String,
    trim: true
  },
  // Dates
  lastRestocked: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Quality
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C'],
    default: 'A'
  },
  // Stock History
  stockHistory: [{
    date: Date,
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment']
    },
    quantity: Number,
    previousStock: Number,
    newStock: Number,
    reference: String,
    remarks: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
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
productionInventorySchema.index({ organizationId: 1, status: 1 });
productionInventorySchema.index({ organizationId: 1, category: 1 });
productionInventorySchema.index({ organizationId: 1, sku: 1 });

// Pre-save hook
productionInventorySchema.pre('save', async function(next) {
  if (this.isNew && !this.inventoryId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    this.inventoryId = `INV-${String(count + 1).padStart(4, '0')}`;
  }

  // Generate SKU if not provided
  if (!this.sku) {
    const prefix = this.category.split(' ').map(w => w[0]).join('').toUpperCase();
    this.sku = `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // Calculate total value
  this.totalValue = this.currentStock * this.unitCost;

  // Auto-update status
  if (this.currentStock === 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.minStock) {
    this.status = 'Critical';
  } else if (this.currentStock <= this.reorderLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }

  this.lastUpdated = new Date();
  next();
});

// Method to add stock
productionInventorySchema.methods.addStock = function(quantity, reference, performedBy, remarks) {
  const previousStock = this.currentStock;
  this.currentStock += quantity;
  this.movement = 'in';
  this.lastRestocked = new Date();

  this.stockHistory.push({
    date: new Date(),
    type: 'in',
    quantity,
    previousStock,
    newStock: this.currentStock,
    reference,
    remarks,
    performedBy
  });

  return this.save();
};

// Method to remove stock
productionInventorySchema.methods.removeStock = function(quantity, reference, performedBy, remarks) {
  if (this.currentStock < quantity) {
    throw new Error('Insufficient stock');
  }

  const previousStock = this.currentStock;
  this.currentStock -= quantity;
  this.movement = 'out';

  this.stockHistory.push({
    date: new Date(),
    type: 'out',
    quantity,
    previousStock,
    newStock: this.currentStock,
    reference,
    remarks,
    performedBy
  });

  return this.save();
};

const ProductionInventory = mongoose.model('ProductionInventory', productionInventorySchema);

export default ProductionInventory;