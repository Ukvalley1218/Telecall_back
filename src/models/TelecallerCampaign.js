import mongoose from 'mongoose';

const telecallerCampaignSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
    maxlength: [100, 'Campaign name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  // Campaign type
  type: {
    type: String,
    enum: ['outbound', 'inbound', 'mixed'],
    default: 'outbound'
  },
  // Priority level
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium'
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  // Date range
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  // Assigned telecallers
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Script for telecallers
  script: {
    type: String,
    trim: true
  },
  // Questions to ask
  questions: [{
    question: String,
    type: { type: String, enum: ['text', 'radio', 'checkbox', 'select'] },
    options: [String],
    required: { type: Boolean, default: false }
  }],
  // Tags
  tags: [{
    type: String,
    trim: true
  }],
  // Statistics (computed)
  stats: {
    totalLeads: { type: Number, default: 0 },
    assignedLeads: { type: Number, default: 0 },
    openLeads: { type: Number, default: 0 },
    inProgressLeads: { type: Number, default: 0 },
    closedLeads: { type: Number, default: 0 },
    unAssignedLeads: { type: Number, default: 0 },
    totalCalls: { type: Number, default: 0 },
    connectedCalls: { type: Number, default: 0 },
    missedCalls: { type: Number, default: 0 }
  },
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
telecallerCampaignSchema.index({ organizationId: 1, status: 1 });
telecallerCampaignSchema.index({ organizationId: 1, createdAt: -1 });
telecallerCampaignSchema.index({ assignedTo: 1 });

// Static method to find by organization
telecallerCampaignSchema.statics.findByOrganization = function(organizationId, options = {}) {
  const query = { organizationId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }
  if (options.priority) {
    query.priority = options.priority;
  }

  return this.find(query)
    .populate('assignedTo', 'profile.firstName profile.lastName email')
    .populate('createdBy', 'profile.firstName profile.lastName email')
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

// Static method to find by user (assigned)
telecallerCampaignSchema.statics.findByUser = function(userId, organizationId, options = {}) {
  const query = {
    organizationId,
    assignedTo: userId,
    isActive: true,
    status: 'active'
  };

  return this.find(query)
    .populate('assignedTo', 'profile.firstName profile.lastName email')
    .populate('createdBy', 'profile.firstName profile.lastName email')
    .sort({ priority: 1, createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

// Instance method to update stats
telecallerCampaignSchema.methods.updateStats = async function() {
  const TelecallerLead = mongoose.model('TelecallerLead');

  const stats = await TelecallerLead.aggregate([
    { $match: { campaignId: this._id } },
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        assignedLeads: {
          $sum: { $cond: [{ $ne: ['$assignedTo', null] }, 1, 0] }
        },
        unAssignedLeads: {
          $sum: { $cond: [{ $eq: ['$assignedTo', null] }, 1, 0] }
        }
      }
    }
  ]);

  const statusStats = await TelecallerLead.aggregate([
    { $match: { campaignId: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.stats.totalLeads = stats[0].totalLeads || 0;
    this.stats.assignedLeads = stats[0].assignedLeads || 0;
    this.stats.unAssignedLeads = stats[0].unAssignedLeads || 0;
  }

  statusStats.forEach(s => {
    switch (s._id) {
      case 'new':
        this.stats.openLeads = s.count;
        break;
      case 'in_progress':
        this.stats.inProgressLeads = s.count;
        break;
      case 'closed':
      case 'converted':
        this.stats.closedLeads = s.count;
        break;
    }
  });

  await this.save();
};

const TelecallerCampaign = mongoose.model('TelecallerCampaign', telecallerCampaignSchema);

export default TelecallerCampaign;