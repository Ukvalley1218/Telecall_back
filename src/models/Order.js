import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Order ID (human-readable)
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Customer Information
  customer: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  // Product Information
  product: {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    description: String,
    category: String,
    type: {
      type: String,
      enum: ['FM', 'HM'], // Factory Made or Hand Made
      required: true,
      default: 'FM'
    }
  },
  // Order Value
  amount: {
    type: Number,
    required: [true, 'Order amount is required'],
    min: 0
  },
  // Order Type: FM (Factory Made) or HM (Hand Made)
  orderType: {
    type: String,
    enum: ['FM', 'HM'],
    required: true,
    default: 'FM'
  },
  // Order Status
  status: {
    type: String,
    enum: ['new', 'in_production', 'completed', 'cancelled'],
    default: 'new'
  },
  // Tracking Status
  trackingStatus: {
    type: String,
    enum: ['on_track', 'delayed', 'completed', 'stuck'],
    default: 'on_track'
  },
  // Current Production Stage
  currentStage: {
    type: String,
    enum: [
      'Material Received',
      'Vendor Purchase',
      'Hardware Purchase',
      'IT Team Planning',
      'Delivery',
      'Installation Start',
      'Rework',
      'Quality Check',
      'Final',
      'Handover'
    ],
    default: 'Material Received'
  },
  // Stage Progress (1-10)
  stageProgress: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },
  // Overall Completion Percentage
  completion: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Internal Steps for Current Stage
  internalSteps: [{
    name: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  // Assignment
  assignedTeam: {
    type: String,
    trim: true
  },
  supervisor: {
    type: String,
    trim: true
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  // Order Source
  source: {
    type: String,
    enum: ['Website', 'Phone', 'Referral', 'Walk-in', 'Campaign', 'Other'],
    default: 'Website'
  },
  // Dates
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  // Delay Information
  delayDays: {
    type: Number,
    default: 0
  },
  delayReason: {
    type: String,
    trim: true
  },
  // Customer Feedback
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  // Notes and Remarks
  notes: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  // 3D Model Reference (for client view)
  model3d: {
    name: String,
    thumbnail: String,
    modelUrl: String,
    modelType: {
      type: String,
      enum: ['glb', 'gltf', 'obj']
    },
    description: String
  },
  // Documents/Attachments
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  // History/Activity Log
  history: [{
    action: {
      type: String,
      required: true
    },
    fromStage: String,
    toStage: String,
    fromStatus: String,
    toStatus: String,
    notes: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Created/Updated By
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

// Indexes for better query performance
orderSchema.index({ organizationId: 1, status: 1 });
orderSchema.index({ organizationId: 1, orderType: 1 });
orderSchema.index({ organizationId: 1, currentStage: 1 });
orderSchema.index({ organizationId: 1, trackingStatus: 1 });
orderSchema.index({ organizationId: 1, assignedTeam: 1 });
orderSchema.index({ organizationId: 1, createdAt: -1 });

// Virtual for formatted amount
orderSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount?.toLocaleString('en-IN') || '0'}`;
});

// Pre-save hook to generate orderId
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    const year = new Date().getFullYear();
    this.orderId = `ORD-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Instance method to add history entry
orderSchema.methods.addHistoryEntry = function(action, data = {}, performedBy) {
  this.history.push({
    action,
    ...data,
    performedBy,
    performedAt: new Date()
  });
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

export default Order;