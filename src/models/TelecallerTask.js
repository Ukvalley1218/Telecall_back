import mongoose from 'mongoose';

const telecallerTaskSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Task details
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  // Task type
  type: {
    type: String,
    enum: ['call', 'follow_up', 'meeting', 'callback', 'reminder', 'other'],
    default: 'call'
  },
  // Priority
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium'
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'],
    default: 'pending',
    index: true
  },
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Related entities
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TelecallerLead'
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TelecallerCampaign'
  },
  callLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallLog'
  },
  // Phone number for call tasks
  phoneNumber: {
    type: String,
    trim: true
  },
  // Scheduling
  scheduledDate: {
    type: Date,
    index: true
  },
  scheduledTime: {
    type: String // HH:MM format
  },
  // Due date
  dueDate: {
    type: Date,
    index: true
  },
  // Completion
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completionNotes: {
    type: String,
    trim: true
  },
  // Follow-up
  isFollowUp: {
    type: Boolean,
    default: false
  },
  parentTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TelecallerTask'
  },
  // Reminders
  reminders: [{
    time: Date,
    sent: { type: Boolean, default: false }
  }],
  // Notes
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  // Tags
  tags: [{
    type: String,
    trim: true
  }],
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
telecallerTaskSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
telecallerTaskSchema.index({ organizationId: 1, dueDate: 1 });
telecallerTaskSchema.index({ organizationId: 1, scheduledDate: 1 });

// Static method to find by user
telecallerTaskSchema.statics.findByUser = function(userId, organizationId, options = {}) {
  const query = { assignedTo: userId, organizationId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }
  if (options.type) {
    query.type = options.type;
  }
  if (options.priority) {
    query.priority = options.priority;
  }
  if (options.dueToday) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    query.dueDate = { $gte: today, $lt: tomorrow };
  }

  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('assignedTo', 'profile.firstName profile.lastName email')
    .populate('leadId', 'name phone status')
    .populate('campaignId', 'name')
    .sort({ priority: 1, dueDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find by organization
telecallerTaskSchema.statics.findByOrganization = function(organizationId, options = {}) {
  const query = { organizationId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }
  if (options.assignedTo) {
    query.assignedTo = options.assignedTo;
  }

  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('assignedTo', 'profile.firstName profile.lastName email')
    .populate('leadId', 'name phone status')
    .populate('campaignId', 'name')
    .sort({ priority: 1, dueDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get today's tasks
telecallerTaskSchema.statics.getTodayTasks = function(userId, organizationId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    assignedTo: userId,
    organizationId,
    isActive: true,
    status: { $in: ['pending', 'in_progress'] },
    $or: [
      { scheduledDate: { $gte: today, $lt: tomorrow } },
      { dueDate: { $gte: today, $lt: tomorrow } }
    ]
  })
    .populate('leadId', 'name phone status')
    .populate('campaignId', 'name')
    .sort({ scheduledTime: 1, priority: 1 });
};

// Static method to get task counts by status
telecallerTaskSchema.statics.getTaskCounts = async function(userId, organizationId) {
  const counts = await this.aggregate([
    {
      $match: {
        assignedTo: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
        isActive: true
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
    total: 0
  };

  counts.forEach(item => {
    if (result.hasOwnProperty(item._id)) {
      result[item._id] = item.count;
    }
    result.total += item.count;
  });

  return result;
};

// Instance method to mark as complete
telecallerTaskSchema.methods.markComplete = async function(userId, notes) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedBy = userId;
  if (notes) {
    this.completionNotes = notes;
  }
  await this.save();
  return this;
};

// Instance method to public JSON
telecallerTaskSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const TelecallerTask = mongoose.model('TelecallerTask', telecallerTaskSchema);

export default TelecallerTask;