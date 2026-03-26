import mongoose from 'mongoose';

const clientMilestoneSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Reference to the sales lead/deal
  salesLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesLead',
    required: [true, 'Sales Lead ID is required']
  },
  // Milestone details
  title: {
    type: String,
    required: [true, 'Milestone title is required'],
    trim: true
  },
  description: {
    type: String
  },
  // Amount details
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  // Dates
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  // Milestone type
  milestoneType: {
    type: String,
    enum: ['payment', 'design_approval', 'material_delivery', 'installation', 'handover', 'other'],
    default: 'payment'
  },
  // Priority
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  // Notes
  notes: {
    type: String
  },
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
clientMilestoneSchema.index({ organizationId: 1, salesLeadId: 1 });
clientMilestoneSchema.index({ organizationId: 1, status: 1 });
clientMilestoneSchema.index({ organizationId: 1, dueDate: 1 });

// Virtual for formatted amount
clientMilestoneSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount?.toLocaleString('en-IN') || '0'}`;
});

const ClientMilestone = mongoose.model('ClientMilestone', clientMilestoneSchema);

export default ClientMilestone;