import mongoose from 'mongoose';

const salesLeadSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Lead basic info
  title: {
    type: String,
    required: [true, 'Lead title is required'],
    trim: true
  },
  client: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  // Value and probability
  value: {
    type: Number,
    required: [true, 'Deal value is required'],
    min: 0
  },
  probability: {
    type: String,
    default: '10%',
    enum: ['10%', '25%', '40%', '55%', '70%', '85%', '100%', '0%']
  },
  // Pipeline stage
  stage: {
    type: String,
    required: [true, 'Stage is required'],
    enum: [
      'Marketing Lead Generation',
      'Telecalling',
      'Appointment',
      'Visit',
      '3D (Pending Approval)',
      'Quotation',
      'Deal Won',
      'Deal Lost'
    ],
    default: 'Marketing Lead Generation'
  },
  // Lead type: new or followup
  leadType: {
    type: String,
    enum: ['new', 'followup'],
    default: 'new'
  },
  // Priority
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  // Contact information
  contact: {
    name: String,
    email: String,
    phone: String
  },
  // Source of lead
  source: {
    type: String,
    enum: ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Instagram', 'Facebook', 'Google Ads', 'Other'],
    default: 'Website'
  },
  // Assigned salesperson
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  assignedToName: {
    type: String
  },
  // Expected close date
  expectedCloseDate: {
    type: Date
  },
  // Description and notes
  description: {
    type: String
  },
  notes: {
    type: String
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'won', 'lost', 'archived'],
    default: 'active'
  },
  // Reference to original MarketingLead if converted from marketing
  sourceMarketingLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketingLead'
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
salesLeadSchema.index({ organizationId: 1, stage: 1 });
salesLeadSchema.index({ organizationId: 1, status: 1 });
salesLeadSchema.index({ organizationId: 1, assignedTo: 1 });
salesLeadSchema.index({ organizationId: 1, createdAt: -1 });

// Virtual for formatted value
salesLeadSchema.virtual('formattedValue').get(function() {
  return `₹${this.value?.toLocaleString('en-IN') || '0'}`;
});

const SalesLead = mongoose.model('SalesLead', salesLeadSchema);

export default SalesLead;