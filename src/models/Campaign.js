import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['online', 'offline'],
    required: [true, 'Campaign type is required']
  },
  channel: {
    type: String,
    required: [true, 'Channel is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date
  },
  budget: {
    type: Number,
    default: 0,
    min: [0, 'Budget cannot be negative']
  },
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  location: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true
  },
  trackingMethod: {
    type: String,
    trim: true
  },
  // Lead tracking
  leads: {
    total: { type: Number, default: 0 },
    qualified: { type: Number, default: 0 },
    converted: { type: Number, default: 0 }
  },
  // ROI calculation
  roi: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  costPerLead: {
    type: Number,
    default: 0
  },
  // Targeting
  targetAudience: {
    type: String,
    trim: true
  },
  targetLocation: {
    type: String,
    trim: true
  },
  // Assigned to
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
campaignSchema.index({ organizationId: 1, status: 1 });
campaignSchema.index({ organizationId: 1, type: 1 });
campaignSchema.index({ organizationId: 1, startDate: -1 });

// Virtual for duration
campaignSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.endDate) return null;
  const diff = this.endDate - this.startDate;
  return Math.ceil(diff / (1000 * 60 * 60 * 24)); // days
});

// Method to calculate ROI
campaignSchema.methods.calculateROI = function() {
  if (this.budget === 0 || this.spent === 0) return 0;
  // ROI = ((Revenue - Cost) / Cost) * 100
  // For now, using a placeholder calculation
  const revenue = this.leads.converted * this.costPerLead * 3; // placeholder
  this.roi = Math.round(((revenue - this.spent) / this.spent) * 100);
  return this.roi;
};

// Method to calculate conversion rate
campaignSchema.methods.calculateConversionRate = function() {
  if (this.leads.total === 0) return 0;
  this.conversionRate = Math.round((this.leads.converted / this.leads.total) * 100);
  return this.conversionRate;
};

// Static method to find by organization
campaignSchema.statics.findByOrganization = function(organizationId, filters = {}) {
  const query = { organizationId, ...filters };
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get active campaigns
campaignSchema.statics.findActive = function(organizationId) {
  return this.find({ organizationId, status: 'active' });
};

// Static method to get dashboard stats
campaignSchema.statics.getDashboardStats = async function(organizationId) {
  const stats = await this.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: null,
        totalCampaigns: { $sum: 1 },
        activeCampaigns: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalLeads: { $sum: '$leads.total' },
        totalBudget: { $sum: '$budget' },
        totalSpent: { $sum: '$spent' },
        avgROI: { $avg: '$roi' },
        avgConversionRate: { $avg: '$conversionRate' }
      }
    }
  ]);

  return stats[0] || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalLeads: 0,
    totalBudget: 0,
    totalSpent: 0,
    avgROI: 0,
    avgConversionRate: 0
  };
};

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;