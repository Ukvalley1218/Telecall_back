import mongoose from 'mongoose';

// Product schema for quotation items
const quotationProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  unit: {
    type: String,
    enum: ['piece', 'set', 'sqft', 'meter', 'hour'],
    default: 'piece'
  },
  length: Number,
  width: Number,
  height: Number,
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: 0
  },
  materialCost: {
    type: Number,
    default: 0,
    min: 0
  },
  labourCost: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  total: {
    type: Number,
    default: 0
  }
}, { _id: true });

const quotationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Quotation Number
  quotationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  // Client Information
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  clientPhone: {
    type: String,
    trim: true
  },
  clientEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  clientAddress: {
    type: String,
    trim: true
  },
  // Project Details
  projectType: {
    type: String,
    trim: true
  },
  // Products/Items
  products: [quotationProductSchema],
  // Pricing
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  transportCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  installationCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  additionalCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  taxPercent: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  // Validity
  validUntilDays: {
    type: Number,
    default: 30
  },
  validUntil: {
    type: Date
  },
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Pending', 'Negotiation', 'Accepted', 'Rejected', 'Expired'],
    default: 'Draft'
  },
  // Notes
  notes: {
    type: String,
    trim: true
  },
  internalNotes: {
    type: String,
    trim: true
  },
  // Linked Sales Lead (optional)
  salesLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesLead'
  },
  // Send History
  sentAt: Date,
  sentTo: String,
  // Acceptance/Rejection
  respondedAt: Date,
  responseNotes: String,
  // Created/Updated by
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
quotationSchema.index({ organizationId: 1, quotationNumber: 1 });
quotationSchema.index({ organizationId: 1, status: 1 });
quotationSchema.index({ organizationId: 1, clientName: 1 });
quotationSchema.index({ organizationId: 1, createdAt: -1 });

// Pre-save hook to calculate totals and generate quotation number
quotationSchema.pre('save', async function(next) {
  // Calculate product totals
  this.products = this.products.map(product => {
    const quantity = product.quantity || 1;
    const pricePerUnit = product.pricePerUnit || 0;
    const materialCost = product.materialCost || 0;
    const labourCost = product.labourCost || 0;
    const discount = product.discount || 0;

    const baseAmount = quantity * pricePerUnit;
    const subtotal = baseAmount + materialCost + labourCost;
    const discountAmount = (subtotal * discount) / 100;
    product.total = subtotal - discountAmount;

    return product;
  });

  // Calculate subtotal from products
  this.subtotal = this.products.reduce((sum, p) => sum + (p.total || 0), 0);

  // Calculate total before tax
  const totalBeforeTax = this.subtotal +
    (this.transportCharges || 0) +
    (this.installationCharges || 0) +
    (this.additionalCharges || 0);

  // Calculate tax and grand total
  this.taxAmount = (totalBeforeTax * (this.taxPercent || 0)) / 100;
  this.grandTotal = totalBeforeTax + this.taxAmount;

  // Set valid until date
  if (this.isNew || this.isModified('validUntilDays')) {
    this.validUntil = new Date(Date.now() + (this.validUntilDays || 30) * 24 * 60 * 60 * 1000);
  }

  // Generate quotation number for new documents
  if (this.isNew && !this.quotationNumber) {
    try {
      const prefix = 'QT';
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const prefixPattern = `${prefix}${year}${month}`;

      // Find the highest quotation number with this prefix
      const lastQuotation = await this.constructor
        .findOne({ quotationNumber: new RegExp(`^${prefixPattern}`) })
        .sort({ quotationNumber: -1 })
        .lean();

      let nextNumber = 1;
      if (lastQuotation && lastQuotation.quotationNumber) {
        // Extract the number from the last quotation number
        const match = lastQuotation.quotationNumber.match(/(\d{4})$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      this.quotationNumber = `${prefixPattern}-${String(nextNumber).padStart(4, '0')}`;
    } catch (err) {
      // Fallback: use timestamp-based unique number
      const prefix = 'QT';
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-4);
      this.quotationNumber = `${prefix}${year}${month}-${timestamp}`;
    }
  }

  next();
});

// Virtual for item count
quotationSchema.virtual('itemCount').get(function() {
  return this.products?.length || 0;
});

// Virtual for total quantity
quotationSchema.virtual('totalQuantity').get(function() {
  return this.products?.reduce((sum, p) => sum + (p.quantity || 1), 0) || 0;
});

// Static method to find by organization
quotationSchema.statics.findByOrganization = function(organizationId, filters = {}) {
  const query = { organizationId };

  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  if (filters.search) {
    query.$or = [
      { quotationNumber: new RegExp(filters.search, 'i') },
      { clientName: new RegExp(filters.search, 'i') },
      { projectType: new RegExp(filters.search, 'i') }
    ];
  }

  return this.find(query).sort({ createdAt: -1 });
};

// Method to check if quotation is expired
quotationSchema.methods.isExpired = function() {
  return this.validUntil && new Date() > this.validUntil && this.status === 'Sent';
};

// Method to mark as sent
quotationSchema.methods.markAsSent = async function(sentTo) {
  this.status = 'Sent';
  this.sentAt = new Date();
  this.sentTo = sentTo;
  return this.save();
};

// Method to mark as accepted
quotationSchema.methods.markAsAccepted = async function(notes) {
  this.status = 'Accepted';
  this.respondedAt = new Date();
  this.responseNotes = notes;
  return this.save();
};

// Method to mark as rejected
quotationSchema.methods.markAsRejected = async function(notes) {
  this.status = 'Rejected';
  this.respondedAt = new Date();
  this.responseNotes = notes;
  return this.save();
};

const Quotation = mongoose.model('Quotation', quotationSchema);

export default Quotation;