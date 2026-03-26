import mongoose from 'mongoose';

const trainingSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  trainingId: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: [true, 'Training title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  // Training type
  type: {
    type: String,
    enum: ['onboarding', 'technical', 'soft_skills', 'compliance', 'safety', 'leadership', 'product', 'other'],
    default: 'other'
  },
  category: {
    type: String,
    trim: true
  },
  // Training details
  objectives: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  // Duration
  duration: {
    value: {
      type: Number,
      default: 1
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      default: 'hours'
    }
  },
  totalHours: {
    type: Number,
    default: 0
  },
  // Schedule
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  sessions: [{
    title: String,
    description: String,
    date: Date,
    startTime: String,
    endTime: String,
    venue: String,
    instructor: String
  }],
  // Venue
  venue: {
    type: String,
    trim: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  onlineLink: {
    type: String,
    trim: true
  },
  // Instructor
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  externalInstructor: {
    name: String,
    email: String,
    phone: String,
    organization: String
  },
  // Capacity
  maxParticipants: {
    type: Number,
    default: 0
  },
  minParticipants: {
    type: Number,
    default: 0
  },
  // Enrollment
  enrollmentStartDate: Date,
  enrollmentEndDate: Date,
  isMandatory: {
    type: Boolean,
    default: false
  },
  targetAudience: {
    departments: [String],
    designations: [String],
    employeeIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }]
  },
  // Prerequisites
  prerequisites: [{
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training'
    },
    name: String
  }],
  // Materials
  materials: [{
    title: String,
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'presentation', 'other']
    },
    url: String,
    description: String
  }],
  // Assessment
  hasAssessment: {
    type: Boolean,
    default: false
  },
  passingScore: {
    type: Number,
    default: 70
  },
  assessmentQuestions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    marks: {
      type: Number,
      default: 1
    }
  }],
  // Certification
  providesCertificate: {
    type: Boolean,
    default: false
  },
  certificateTemplate: {
    type: String
  },
  certificateValidity: {
    type: Number, // in months
    default: 0
  },
  // Cost
  cost: {
    perParticipant: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  // Enrollment stats (computed)
  enrolledCount: {
    type: Number,
    default: 0
  },
  completedCount: {
    type: Number,
    default: 0
  },
  // Feedback
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalFeedbacks: {
    type: Number,
    default: 0
  },
  // Meta
  tags: [String],
  notes: {
    type: String,
    trim: true
  },
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
trainingSchema.index({ organizationId: 1, startDate: 1 });
trainingSchema.index({ organizationId: 1, status: 1 });
trainingSchema.index({ type: 1 });
trainingSchema.index({ 'targetAudience.departments': 1 });

// Virtual for available seats
trainingSchema.virtual('availableSeats').get(function() {
  if (this.maxParticipants === 0) return Infinity;
  return Math.max(0, this.maxParticipants - this.enrolledCount);
});

// Virtual for is enrollment open
trainingSchema.virtual('isEnrollmentOpen').get(function() {
  const now = new Date();
  if (this.status !== 'scheduled') return false;
  if (this.enrollmentStartDate && now < this.enrollmentStartDate) return false;
  if (this.enrollmentEndDate && now > this.enrollmentEndDate) return false;
  if (this.maxParticipants > 0 && this.enrolledCount >= this.maxParticipants) return false;
  return true;
});

// Pre-save hook to generate training ID and calculate total hours
trainingSchema.pre('save', function(next) {
  // Generate training ID if new
  if (this.isNew && !this.trainingId) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.trainingId = `TRN${year}${random}`;
  }

  // Calculate total hours based on duration
  if (this.duration && this.duration.value) {
    switch (this.duration.unit) {
      case 'hours':
        this.totalHours = this.duration.value;
        break;
      case 'days':
        this.totalHours = this.duration.value * 8; // 8 hours per day
        break;
      case 'weeks':
        this.totalHours = this.duration.value * 40; // 40 hours per week
        break;
      case 'months':
        this.totalHours = this.duration.value * 160; // 160 hours per month
        break;
    }
  }

  next();
});

// Static method to get upcoming trainings
trainingSchema.statics.getUpcoming = function(organizationId, limit = 10) {
  const now = new Date();
  return this.find({
    organizationId,
    startDate: { $gte: now },
    status: { $in: ['scheduled', 'in_progress'] }
  })
    .sort({ startDate: 1 })
    .limit(limit)
    .populate('instructor', 'personalInfo.firstName personalInfo.lastName');
};

// Static method to get trainings by department
trainingSchema.statics.getByDepartment = function(organizationId, department) {
  return this.find({
    organizationId,
    $or: [
      { 'targetAudience.departments': department },
      { 'targetAudience.departments': { $size: 0 } }, // Open for all
      { isMandatory: false } // Optional trainings
    ],
    status: { $ne: 'cancelled' }
  }).sort({ startDate: 1 });
};

// Static method to get mandatory trainings
trainingSchema.statics.getMandatory = function(organizationId) {
  return this.find({
    organizationId,
    isMandatory: true,
    status: { $ne: 'cancelled' }
  }).sort({ startDate: 1 });
};

// Method to check if employee can enroll
trainingSchema.methods.canEnroll = function(employeeId, department) {
  // Check if enrollment is open
  if (!this.isEnrollmentOpen) return { canEnroll: false, reason: 'Enrollment is closed' };

  // Check if already enrolled
  // This would need to check TrainingEnrollment model

  // Check target audience
  if (this.targetAudience.departments.length > 0) {
    if (!this.targetAudience.departments.includes(department)) {
      return { canEnroll: false, reason: 'Not eligible for this training' };
    }
  }

  // Check capacity
  if (this.maxParticipants > 0 && this.enrolledCount >= this.maxParticipants) {
    return { canEnroll: false, reason: 'Training is full' };
  }

  return { canEnroll: true };
};

// Method to start training
trainingSchema.methods.start = function() {
  if (this.status === 'scheduled') {
    this.status = 'in_progress';
    return this.save();
  }
  throw new Error('Only scheduled trainings can be started');
};

// Method to complete training
trainingSchema.methods.complete = function() {
  if (this.status === 'in_progress') {
    this.status = 'completed';
    return this.save();
  }
  throw new Error('Only in-progress trainings can be completed');
};

// Method to cancel training
trainingSchema.methods.cancel = function(reason) {
  if (this.status === 'completed') {
    throw new Error('Completed trainings cannot be cancelled');
  }
  this.status = 'cancelled';
  this.notes = reason;
  return this.save();
};

// Method to update stats
trainingSchema.methods.updateStats = async function() {
  const TrainingEnrollment = mongoose.model('TrainingEnrollment');
  const stats = await TrainingEnrollment.aggregate([
    { $match: { trainingId: this._id } },
    {
      $group: {
        _id: null,
        enrolledCount: { $sum: 1 },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        avgRating: { $avg: '$feedback.rating' },
        totalFeedbacks: {
          $sum: { $cond: [{ $ne: ['$feedback.rating', null] }, 1, 0] }
        }
      }
    }
  ]);

  if (stats.length > 0) {
    this.enrolledCount = stats[0].enrolledCount;
    this.completedCount = stats[0].completedCount;
    this.averageRating = Math.round(stats[0].avgRating * 10) / 10 || 0;
    this.totalFeedbacks = stats[0].totalFeedbacks;
  }

  return this.save();
};

const Training = mongoose.model('Training', trainingSchema);

export default Training;