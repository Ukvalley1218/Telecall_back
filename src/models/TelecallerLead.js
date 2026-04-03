import mongoose from 'mongoose';

const telecallerLeadSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Campaign association
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TelecallerCampaign',
    index: true
  },
  // Contact information
  name: {
    type: String,
    required: [true, 'Lead name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  // Lead source
  source: {
    type: String,
    enum: ['website', 'referral', 'campaign', 'social_media', 'cold_call', 'event', 'other'],
    default: 'other'
  },
  sourceDetails: {
    type: String,
    trim: true
  },
  // Lead status and stage
  status: {
    type: String,
    enum: ['new', 'open', 'in_progress', 'follow_up', 'cold', 'warm', 'hot', 'converted', 'closed', 'lost', 'not_connected'],
    default: 'new',
    index: true
  },
  stage: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'],
    default: 'new',
    index: true
  },
  // Priority
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium'
  },
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedAt: {
    type: Date
  },
  // Lead details
  company: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  // Notes and remarks
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  // Call history
  callHistory: [{
    callId: { type: mongoose.Schema.Types.ObjectId, ref: 'CallLog' },
    phoneNumber: String,
    duration: Number,
    status: String,
    notes: String,
    disposition: String,
    createdAt: { type: Date, default: Date.now }
  }],
  // Last contact
  lastContactedAt: {
    type: Date
  },
  lastContactedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Follow-up
  nextFollowUp: {
    date: Date,
    time: String,
    notes: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  // Disposition
  disposition: {
    status: { type: String, enum: ['connected', 'not_connected', 'busy', 'callback', 'not_interested'] },
    reason: String,
    remarks: String,
    disposedAt: Date,
    disposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  // Additional questions/responses
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Tags
  tags: [{
    type: String,
    trim: true
  }],
  // Lead score
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Conversion
  convertedAt: Date,
  convertedTo: {
    type: mongoose.Schema.Types.ObjectId // Reference to customer/sale
  },
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Active status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
telecallerLeadSchema.index({ organizationId: 1, status: 1 });
telecallerLeadSchema.index({ organizationId: 1, stage: 1 });
telecallerLeadSchema.index({ organizationId: 1, assignedTo: 1 });
telecallerLeadSchema.index({ organizationId: 1, campaignId: 1 });
telecallerLeadSchema.index({ phone: 1, organizationId: 1 }, { unique: false });

// Virtual for full name
telecallerLeadSchema.virtual('fullName').get(function() {
  return this.name;
});

// Static method to find by organization
telecallerLeadSchema.statics.findByOrganization = function(organizationId, options = {}) {
  const query = { organizationId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }
  if (options.stage) {
    query.stage = options.stage;
  }
  if (options.assignedTo) {
    query.assignedTo = options.assignedTo;
  }
  if (options.campaignId) {
    query.campaignId = options.campaignId;
  }
  if (options.priority) {
    query.priority = options.priority;
  }
  if (options.search) {
    query.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { phone: { $regex: options.search, $options: 'i' } },
      { email: { $regex: options.search, $options: 'i' } },
      { company: { $regex: options.search, $options: 'i' } }
    ];
  }

  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('assignedTo', 'profile.firstName profile.lastName email')
    .populate('campaignId', 'name')
    .populate('createdBy', 'profile.firstName profile.lastName email')
    .sort({ priority: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find by user (assigned)
telecallerLeadSchema.statics.findByUser = function(userId, organizationId, options = {}) {
  const query = { organizationId, assignedTo: userId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }
  if (options.stage) {
    query.stage = options.stage;
  }

  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('assignedTo', 'profile.firstName profile.lastName email')
    .populate('campaignId', 'name')
    .sort({ priority: 1, nextFollowUp: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get leads by status category
telecallerLeadSchema.statics.getLeadsByCategory = function(organizationId, userId, category) {
  const query = { organizationId, isActive: true };

  // Map frontend categories to statuses
  const categoryMap = {
    'new': { status: 'new' },
    'follow_up': { status: 'follow_up' },
    'cold': { status: 'cold' },
    'warm': { status: 'warm' },
    'hot': { status: 'hot' },
    'not_connected': { status: 'not_connected' },
    'assigned': { assignedTo: { $ne: null } },
    'unassigned': { assignedTo: null }
  };

  const categoryFilter = categoryMap[category] || {};
  Object.assign(query, categoryFilter);

  // If userId provided, filter by user assignment
  if (userId) {
    query.assignedTo = userId;
  }

  return this.find(query)
    .populate('assignedTo', 'profile.firstName profile.lastName email')
    .populate('campaignId', 'name')
    .sort({ priority: 1, createdAt: -1 });
};

// Static method to get lead counts by category
telecallerLeadSchema.statics.getCategoryCounts = async function(organizationId, userId) {
  const matchStage = { organizationId: new mongoose.Types.ObjectId(organizationId), isActive: true };

  if (userId) {
    matchStage.assignedTo = new mongoose.Types.ObjectId(userId);
  }

  const counts = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    new: 0,
    follow_up: 0,
    cold: 0,
    warm: 0,
    hot: 0,
    not_connected: 0,
    total: 0
  };

  counts.forEach(item => {
    const status = item._id;
    if (result.hasOwnProperty(status)) {
      result[status] = item.count;
    }
    result.total += item.count;
  });

  return result;
};

// Instance method to add note
telecallerLeadSchema.methods.addNote = async function(content, userId) {
  this.notes.push({
    content,
    createdBy: userId,
    createdAt: new Date()
  });
  await this.save();
  return this;
};

// Instance method to update status
telecallerLeadSchema.methods.updateStatus = async function(status, stage, userId) {
  if (status) this.status = status;
  if (stage) this.stage = stage;
  this.lastContactedAt = new Date();
  this.lastContactedBy = userId;
  await this.save();
  return this;
};

// Instance method to add call log
telecallerLeadSchema.methods.addCallLog = async function(callLogId, callData) {
  this.callHistory.push({
    callId: callLogId,
    ...callData,
    createdAt: new Date()
  });
  this.lastContactedAt = new Date();
  await this.save();
  return this;
};

// Instance method to toPublicJSON
telecallerLeadSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const TelecallerLead = mongoose.model('TelecallerLead', telecallerLeadSchema);

export default TelecallerLead;