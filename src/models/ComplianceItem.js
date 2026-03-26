import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['pdf', 'image', 'document', 'spreadsheet', 'other'],
    default: 'document'
  },
  size: Number,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

const complianceItemSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  itemId: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: [true, 'Compliance item title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  // Category
  category: {
    type: String,
    enum: [
      'statutory', 'regulatory', 'internal', 'certification',
      'audit', 'tax', 'labor', 'environmental', 'safety', 'other'
    ],
    default: 'other',
    index: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  // Compliance type
  type: {
    type: String,
    enum: ['filing', 'registration', 'license', 'certificate', 'audit', 'inspection', 'other'],
    default: 'other'
  },
  // Priority
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  // Due dates
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    index: true
  },
  reminderDate: {
    type: Date
  },
  // Recurrence
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'semi_annually', 'annually', 'custom'],
    default: 'annually'
  },
  recurrenceInterval: {
    type: Number,
    default: 1
  },
  nextDueDate: Date,
  // Authority
  authority: {
    name: {
      type: String,
      trim: true
    },
    department: String,
    contactPerson: String,
    contactEmail: String,
    contactPhone: String,
    website: String
  },
  // Requirements
  requirements: [{
    title: String,
    description: String,
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  // Documents
  documents: [documentSchema],
  // Assigned to
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  assignedDepartment: {
    type: String,
    trim: true
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  // Completion
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completionNotes: {
    type: String,
    trim: true
  },
  // Reference
  referenceNumber: {
    type: String,
    trim: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  // Penalties
  penaltyAmount: {
    type: Number,
    default: 0
  },
  penaltyCurrency: {
    type: String,
    default: 'INR'
  },
  penaltyApplied: {
    type: Boolean,
    default: false
  },
  // History
  history: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'assigned', 'completed', 'reopened', 'cancelled']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    previousStatus: String,
    newStatus: String,
    notes: String
  }],
  // Tags
  tags: [String],
  // Notifications
  notificationsSent: [{
    type: {
      type: String,
      enum: ['reminder', 'overdue', 'completion']
    },
    sentAt: Date,
    sentTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  // Created/Updated
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
complianceItemSchema.index({ organizationId: 1, dueDate: 1 });
complianceItemSchema.index({ organizationId: 1, status: 1 });
complianceItemSchema.index({ organizationId: 1, category: 1 });
complianceItemSchema.index({ assignedTo: 1 });

// Virtual for days until due
complianceItemSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const due = new Date(this.dueDate);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  return diff;
});

// Virtual for is overdue
complianceItemSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  return new Date() > new Date(this.dueDate);
});

// Virtual for completion percentage
complianceItemSchema.virtual('completionPercentage').get(function() {
  if (!this.requirements || this.requirements.length === 0) return 0;
  const completed = this.requirements.filter(r => r.isCompleted).length;
  return Math.round((completed / this.requirements.length) * 100);
});

// Pre-save hook to generate item ID and handle status
complianceItemSchema.pre('save', function(next) {
  // Generate item ID if new
  if (this.isNew && !this.itemId) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.itemId = `CMP${year}${random}`;
  }

  // Auto-set status to overdue if past due date
  if (this.isOverdue && this.status === 'pending') {
    this.status = 'overdue';
  }

  // Calculate next due date for recurring items
  if (this.isRecurring && this.isModified('dueDate')) {
    this.nextDueDate = this.calculateNextDueDate();
  }

  // Set reminder date if not set (7 days before due)
  if (!this.reminderDate && this.dueDate) {
    const reminder = new Date(this.dueDate);
    reminder.setDate(reminder.getDate() - 7);
    this.reminderDate = reminder;
  }

  next();
});

// Method to calculate next due date
complianceItemSchema.methods.calculateNextDueDate = function() {
  const due = new Date(this.dueDate);
  let next = new Date(due);

  switch (this.recurrenceFrequency) {
    case 'monthly':
      next.setMonth(next.getMonth() + this.recurrenceInterval);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + (3 * this.recurrenceInterval));
      break;
    case 'semi_annually':
      next.setMonth(next.getMonth() + (6 * this.recurrenceInterval));
      break;
    case 'annually':
      next.setFullYear(next.getFullYear() + this.recurrenceInterval);
      break;
    case 'custom':
      next.setDate(next.getDate() + this.recurrenceInterval);
      break;
  }

  return next;
};

// Static method to get upcoming items
complianceItemSchema.statics.getUpcoming = function(organizationId, days = 30) {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return this.find({
    organizationId,
    dueDate: { $gte: today, $lte: endDate },
    status: { $nin: ['completed', 'cancelled'] }
  }).sort({ dueDate: 1 });
};

// Static method to get overdue items
complianceItemSchema.statics.getOverdue = function(organizationId) {
  return this.find({
    organizationId,
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  }).sort({ dueDate: 1 });
};

// Static method to get by category
complianceItemSchema.statics.getByCategory = function(organizationId, category) {
  return this.find({ organizationId, category }).sort({ dueDate: 1 });
};

// Static method to get compliance summary
complianceItemSchema.statics.getSummary = async function(organizationId) {
  const summary = await this.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
    cancelled: 0
  };

  summary.forEach(item => {
    result[item._id] = item.count;
    result.total += item.count;
  });

  return result;
};

// Method to complete item
complianceItemSchema.methods.complete = function(userId, notes) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedBy = userId;
  this.completionNotes = notes;

  this.history.push({
    action: 'completed',
    performedBy: userId,
    performedAt: new Date(),
    newStatus: 'completed',
    notes
  });

  return this.save();
};

// Method to reopen item
complianceItemSchema.methods.reopen = function(userId, reason) {
  this.status = 'pending';
  this.completedAt = null;
  this.completedBy = null;

  this.history.push({
    action: 'reopened',
    performedBy: userId,
    performedAt: new Date(),
    previousStatus: 'completed',
    newStatus: 'pending',
    notes: reason
  });

  return this.save();
};

// Method to add document
complianceItemSchema.methods.addDocument = function(document) {
  this.documents.push(document);
  return this.save();
};

// Method to remove document
complianceItemSchema.methods.removeDocument = function(documentName) {
  this.documents = this.documents.filter(d => d.name !== documentName);
  return this.save();
};

// Method to complete requirement
complianceItemSchema.methods.completeRequirement = function(index) {
  if (this.requirements[index]) {
    this.requirements[index].isCompleted = true;
    this.requirements[index].completedAt = new Date();
    return this.save();
  }
  throw new Error('Requirement not found');
};

const ComplianceItem = mongoose.model('ComplianceItem', complianceItemSchema);

export default ComplianceItem;