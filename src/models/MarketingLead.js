import mongoose from 'mongoose';

const marketingLeadSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    index: true
  },
  // Lead source
  source: {
    type: String,
    enum: ['online', 'offline', 'referral', 'organic', 'paid', 'social', 'email', 'other'],
    required: [true, 'Lead source is required']
  },
  sourceDetail: {
    type: String,
    trim: true
  },
  // Contact information
  name: {
    first: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    last: {
      type: String,
      trim: true
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    trim: true
  },
  // Lead details
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'hot'],
    default: 'medium'
  },
  // Lead scoring
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Interest and requirements
  interest: {
    product: String,
    budget: String,
    timeline: String,
    notes: String
  },
  // UTM parameters (for online leads)
  utm: {
    source: String,
    medium: String,
    campaign: String,
    content: String,
    term: String
  },
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  // Conversion details
  conversion: {
    date: Date,
    value: Number,
    notes: String
  },
  // Follow-up
  lastContactDate: Date,
  nextFollowUp: Date,
  followUpNotes: String,
  // Conversion tracking - when lead is converted to SalesLead
  isConverted: {
    type: Boolean,
    default: false
  },
  convertedToSalesLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesLead'
  },
  convertedAt: Date,
  convertedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
marketingLeadSchema.index({ organizationId: 1, status: 1 });
marketingLeadSchema.index({ organizationId: 1, source: 1 });
marketingLeadSchema.index({ organizationId: 1, createdAt: -1 });
marketingLeadSchema.index({ organizationId: 1, campaignId: 1 });

// Virtual for full name
marketingLeadSchema.virtual('fullName').get(function() {
  return `${this.name.first} ${this.name.last || ''}`.trim();
});

// Static method to get leads by source
marketingLeadSchema.statics.getLeadsBySource = async function(organizationId, startDate, endDate) {
  const match = { organizationId: new mongoose.Types.ObjectId(organizationId) };
  if (startDate && endDate) {
    match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
        converted: {
          $sum: { $cond: ['$isConverted', 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get leads over time
marketingLeadSchema.statics.getLeadsOverTime = async function(organizationId, groupBy = 'week') {
  let dateFormat;
  switch (groupBy) {
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-W%V';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-W%V';
  }

  return this.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: {
          period: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          source: '$source'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.period',
        online: {
          $sum: {
            $cond: [
              { $in: ['$_id.source', ['online', 'social', 'email', 'paid']] },
              '$count',
              0
            ]
          }
        },
        offline: {
          $sum: {
            $cond: [
              { $in: ['$_id.source', ['offline', 'referral']] },
              '$count',
              0
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get conversion funnel
marketingLeadSchema.statics.getConversionFunnel = async function(organizationId) {
  return this.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const MarketingLead = mongoose.model('MarketingLead', marketingLeadSchema);

export default MarketingLead;