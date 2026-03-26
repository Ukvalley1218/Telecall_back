import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  eventId: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['meeting', 'event', 'holiday', 'reminder', 'deadline', 'training', 'other'],
    default: 'event'
  },
  // Date and time
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  // Recurrence
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceRule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    count: Number,
    daysOfWeek: [Number], // 0-6, Sunday-Saturday
    dayOfMonth: Number, // 1-31
    monthOfYear: Number // 1-12
  },
  // Location
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  meetingLink: {
    type: String,
    trim: true
  },
  // Participants
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  departments: [{
    type: String,
    trim: true
  }],
  isOrganizationWide: {
    type: Boolean,
    default: false
  },
  // Organizer
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification', 'sms'],
      default: 'notification'
    },
    minutesBefore: {
      type: Number,
      default: 30
    }
  }],
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format']
  },
  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  // Visibility
  visibility: {
    type: String,
    enum: ['public', 'private', 'department'],
    default: 'public'
  },
  // Meta
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Indexes
eventSchema.index({ organizationId: 1, startDate: 1 });
eventSchema.index({ organizationId: 1, type: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ participants: 1 });

// Virtual for duration in minutes
eventSchema.virtual('durationMinutes').get(function() {
  if (this.isAllDay) return 0;
  const diff = new Date(this.endDate) - new Date(this.startDate);
  return Math.floor(diff / (1000 * 60));
});

// Pre-save hook to generate event ID
eventSchema.pre('save', async function(next) {
  if (this.isNew && !this.eventId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    const year = new Date().getFullYear();
    this.eventId = `EVT${year}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Static method to get events for date range
eventSchema.statics.getForDateRange = function(organizationId, startDate, endDate, employeeId = null) {
  const query = {
    organizationId,
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  };

  if (employeeId) {
    query.$or = [
      { isOrganizationWide: true },
      { participants: employeeId },
      { departments: { $in: ['*'] } } // Employee's department check
    ];
  }

  return this.find(query)
    .populate('organizer', 'personalInfo.firstName personalInfo.lastName employeeId')
    .populate('participants', 'personalInfo.firstName personalInfo.lastName employeeId')
    .sort({ startDate: 1 });
};

// Static method to get upcoming events
eventSchema.statics.getUpcoming = function(organizationId, days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return this.find({
    organizationId,
    startDate: { $gte: startDate, $lte: endDate },
    status: { $ne: 'cancelled' }
  })
    .sort({ startDate: 1 })
    .limit(20);
};

// Static method to get events by type
eventSchema.statics.getByType = function(organizationId, type, startDate, endDate) {
  const query = { organizationId, type };

  if (startDate && endDate) {
    query.$or = [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } }
    ];
  }

  return this.find(query).sort({ startDate: 1 });
};

// Method to add participant
eventSchema.methods.addParticipant = function(employeeId) {
  if (!this.participants.includes(employeeId)) {
    this.participants.push(employeeId);
    return this.save();
  }
  return this;
};

// Method to remove participant
eventSchema.methods.removeParticipant = function(employeeId) {
  this.participants.pull(employeeId);
  return this.save();
};

// Method to cancel event
eventSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.notes = reason ? `Cancelled: ${reason}` : 'Event cancelled';
  return this.save();
};

// Method to postpone event
eventSchema.methods.postpone = function(newStartDate, newEndDate) {
  this.startDate = newStartDate;
  this.endDate = newEndDate;
  this.status = 'postponed';
  return this.save();
};

// Method to mark as completed
eventSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

const Event = mongoose.model('Event', eventSchema);

export default Event;