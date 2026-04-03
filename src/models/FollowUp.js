import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Lead being followed up
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TelecallerLead',
    required: [true, 'Lead ID is required'],
    index: true
  },
  // Campaign reference
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TelecallerCampaign'
  },
  // Assigned telecaller
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Scheduled date and time
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
    index: true
  },
  scheduledTime: {
    type: String, // HH:MM format
    required: [true, 'Scheduled time is required']
  },
  // Follow-up type
  type: {
    type: String,
    enum: ['call', 'email', 'visit', 'meeting', 'other'],
    default: 'call'
  },
  // Purpose/reason for follow-up
  purpose: {
    type: String,
    trim: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters']
  },
  // Notes for the follow-up
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_answer'],
    default: 'scheduled',
    index: true
  },
  // Priority
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium'
  },
  // Completion details
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
  // Outcome
  outcome: {
    type: String,
    enum: ['successful', 'unsuccessful', 'callback_needed', 'not_interested', 'converted']
  },
  // Related call log
  callLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallLog'
  },
  // Rescheduled to
  rescheduledTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FollowUp'
  },
  // Reminders
  reminders: [{
    time: Date,
    type: { type: String, enum: ['email', 'push', 'sms'] },
    sent: { type: Boolean, default: false }
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
followUpSchema.index({ organizationId: 1, assignedTo: 1, scheduledDate: 1 });
followUpSchema.index({ organizationId: 1, leadId: 1 });
followUpSchema.index({ organizationId: 1, status: 1, scheduledDate: 1 });

// Static method to find by user
followUpSchema.statics.findByUser = function(userId, organizationId, options = {}) {
  const query = { assignedTo: userId, organizationId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }
  if (options.startDate || options.endDate) {
    query.scheduledDate = {};
    if (options.startDate) query.scheduledDate.$gte = new Date(options.startDate);
    if (options.endDate) query.scheduledDate.$lte = new Date(options.endDate);
  }

  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('leadId', 'name phone status')
    .populate('campaignId', 'name')
    .populate('assignedTo', 'profile.firstName profile.lastName email')
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get today's follow-ups
followUpSchema.statics.getTodayFollowUps = function(userId, organizationId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    assignedTo: userId,
    organizationId,
    isActive: true,
    status: 'scheduled',
    scheduledDate: { $gte: today, $lt: tomorrow }
  })
    .populate('leadId', 'name phone status')
    .populate('campaignId', 'name')
    .sort({ scheduledTime: 1 });
};

// Static method to get upcoming follow-ups
followUpSchema.statics.getUpcoming = function(userId, organizationId, days = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);

  return this.find({
    assignedTo: userId,
    organizationId,
    isActive: true,
    status: 'scheduled',
    scheduledDate: { $gte: today, $lte: endDate }
  })
    .populate('leadId', 'name phone status')
    .populate('campaignId', 'name')
    .sort({ scheduledDate: 1, scheduledTime: 1 });
};

// Static method to find by lead
followUpSchema.statics.findByLead = function(leadId, organizationId) {
  return this.find({ leadId, organizationId, isActive: true })
    .populate('assignedTo', 'profile.firstName profile.lastName email')
    .sort({ scheduledDate: -1 });
};

// Static method to get follow-up counts
followUpSchema.statics.getCounts = async function(userId, organizationId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const counts = await this.aggregate([
    {
      $match: {
        assignedTo: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
        isActive: true,
        status: 'scheduled'
      }
    },
    {
      $group: {
        _id: null,
        today: {
          $sum: {
            $cond: [
              { $and: [
                { $gte: ['$scheduledDate', today] },
                { $lt: ['$scheduledDate', tomorrow] }
              ]},
              1,
              0
            ]
          }
        },
        tomorrow: {
          $sum: {
            $cond: [
              { $and: [
                { $gte: ['$scheduledDate', tomorrow] },
                { $lt: ['$scheduledDate', new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)] }
              ]},
              1,
              0
            ]
          }
        },
        thisWeek: {
          $sum: {
            $cond: [
              { $and: [
                { $gte: ['$scheduledDate', today] },
                { $lt: ['$scheduledDate', nextWeek] }
              ]},
              1,
              0
            ]
          }
        },
        thisMonth: {
          $sum: {
            $cond: [
              { $and: [
                { $gte: ['$scheduledDate', today] },
                { $lt: ['$scheduledDate', nextMonth] }
              ]},
              1,
              0
            ]
          }
        },
        total: { $sum: 1 }
      }
    }
  ]);

  return counts[0] || { today: 0, tomorrow: 0, thisWeek: 0, thisMonth: 0, total: 0 };
};

// Instance method to complete
followUpSchema.methods.complete = async function(userId, notes, outcome) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedBy = userId;
  if (notes) this.completionNotes = notes;
  if (outcome) this.outcome = outcome;
  await this.save();
  return this;
};

// Instance method to reschedule
followUpSchema.methods.reschedule = async function(newDate, newTime, notes) {
  // Create new follow-up
  const newFollowUp = new this.constructor({
    organizationId: this.organizationId,
    leadId: this.leadId,
    campaignId: this.campaignId,
    assignedTo: this.assignedTo,
    scheduledDate: newDate,
    scheduledTime: newTime,
    type: this.type,
    purpose: this.purpose,
    notes: notes || this.notes,
    priority: this.priority,
    createdBy: this.assignedTo
  });

  await newFollowUp.save();

  // Update this follow-up
  this.status = 'rescheduled';
  this.rescheduledTo = newFollowUp._id;
  await this.save();

  return newFollowUp;
};

// Instance method to cancel
followUpSchema.methods.cancel = async function(reason) {
  this.status = 'cancelled';
  if (reason) this.completionNotes = reason;
  await this.save();
  return this;
};

// Instance method to public JSON
followUpSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const FollowUp = mongoose.model('FollowUp', followUpSchema);

export default FollowUp;