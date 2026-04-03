import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // User who made/received the call
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  // Lead associated with the call
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TelecallerLead',
    index: true
  },
  // Campaign associated with the call
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TelecallerCampaign'
  },
  // Call details
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    index: true
  },
  contactName: {
    type: String,
    trim: true
  },
  // Call type
  callType: {
    type: String,
    enum: ['incoming', 'outgoing', 'missed'],
    default: 'outgoing',
    index: true
  },
  // Call status
  status: {
    type: String,
    enum: ['connected', 'not_connected', 'busy', 'no_answer', 'rejected', 'failed', 'missed'],
    default: 'not_connected'
  },
  // Call duration in seconds
  duration: {
    type: Number,
    default: 0
  },
  // Start and end time
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  // Recording details
  recording: {
    url: String,
    publicId: String,
    duration: Number,
    fileSize: Number,
    format: String
  },
  // Disposition
  disposition: {
    type: String,
    enum: ['connected', 'not_connected', 'callback', 'not_interested', 'wrong_number', 'voicemail']
  },
  // Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  // Follow-up scheduled
  followUp: {
    scheduled: { type: Boolean, default: false },
    date: Date,
    time: String,
    notes: String
  },
  // Call outcome
  outcome: {
    type: String,
    enum: ['successful', 'unsuccessful', 'pending', 'rescheduled']
  },
  // Additional metadata
  metadata: {
    device: String,
    network: String,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  // Tags
  tags: [{
    type: String,
    trim: true
  }],
  // Created timestamp (call time)
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
callLogSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
callLogSchema.index({ organizationId: 1, leadId: 1, createdAt: -1 });
callLogSchema.index({ organizationId: 1, phoneNumber: 1 });
callLogSchema.index({ organizationId: 1, callType: 1, createdAt: -1 });

// Static method to find by user
callLogSchema.statics.findByUser = function(userId, organizationId, options = {}) {
  const query = { userId, organizationId };

  if (options.callType) {
    query.callType = options.callType;
  }
  if (options.status) {
    query.status = options.status;
  }
  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) query.createdAt.$gte = new Date(options.startDate);
    if (options.endDate) query.createdAt.$lte = new Date(options.endDate);
  }

  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('leadId', 'name phone status')
    .populate('campaignId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get call statistics
callLogSchema.statics.getStatistics = async function(organizationId, userId, startDate, endDate) {
  const matchStage = { organizationId: new mongoose.Types.ObjectId(organizationId) };

  if (userId) {
    matchStage.userId = new mongoose.Types.ObjectId(userId);
  }

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        incoming: {
          $sum: { $cond: [{ $eq: ['$callType', 'incoming'] }, 1, 0] }
        },
        outgoing: {
          $sum: { $cond: [{ $eq: ['$callType', 'outgoing'] }, 1, 0] }
        },
        missed: {
          $sum: { $cond: [{ $eq: ['$callType', 'missed'] }, 1, 0] }
        },
        connected: {
          $sum: { $cond: [{ $eq: ['$status', 'connected'] }, 1, 0] }
        },
        notConnected: {
          $sum: { $cond: [{ $eq: ['$status', 'not_connected'] }, 1, 0] }
        },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);

  return stats[0] || {
    totalCalls: 0,
    incoming: 0,
    outgoing: 0,
    missed: 0,
    connected: 0,
    notConnected: 0,
    totalDuration: 0,
    avgDuration: 0
  };
};

// Static method to get daily activity
callLogSchema.statics.getDailyActivity = async function(organizationId, userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const matchStage = {
    organizationId: new mongoose.Types.ObjectId(organizationId),
    userId: userId ? new mongoose.Types.ObjectId(userId) : { $exists: true },
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  };

  const activity = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          hour: { $hour: '$createdAt' },
          callType: '$callType',
          status: '$status'
        },
        count: { $sum: 1 },
        duration: { $sum: '$duration' }
      }
    },
    { $sort: { '_id.hour': 1 } }
  ]);

  return activity;
};

// Static method to get call timeline
callLogSchema.statics.getCallTimeline = async function(organizationId, userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    organizationId,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  };

  if (userId) {
    query.userId = userId;
  }

  return this.find(query)
    .populate('userId', 'profile.firstName profile.lastName')
    .populate('leadId', 'name phone')
    .sort({ createdAt: 1 });
};

// Instance method to format duration
callLogSchema.methods.getFormattedDuration = function() {
  const duration = this.duration || 0;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

// Instance method to public JSON
callLogSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const CallLog = mongoose.model('CallLog', callLogSchema);

export default CallLog;