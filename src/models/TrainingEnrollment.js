import mongoose from 'mongoose';

const trainingEnrollmentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  enrollmentId: {
    type: String,
    unique: true,
    sparse: true
  },
  trainingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Training',
    required: [true, 'Training ID is required'],
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required'],
    index: true
  },
  // Enrollment details
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  enrolledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  enrollmentType: {
    type: String,
    enum: ['self', 'assigned', 'mandatory'],
    default: 'self'
  },
  // Status
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed', 'failed', 'cancelled', 'no_show'],
    default: 'enrolled',
    index: true
  },
  // Progress
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  sessionsAttended: {
    type: Number,
    default: 0
  },
  sessionsTotal: {
    type: Number,
    default: 0
  },
  // Completion
  startedAt: Date,
  completedAt: Date,
  completionPercentage: {
    type: Number,
    default: 0
  },
  // Assessment
  assessmentScore: {
    type: Number,
    min: 0,
    max: 100
  },
  assessmentAttemptedAt: Date,
  assessmentAttempts: {
    type: Number,
    default: 0
  },
  passedAssessment: {
    type: Boolean,
    default: false
  },
  // Certificate
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: String,
  certificateIssuedAt: Date,
  certificateExpiryAt: Date,
  // Feedback
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comments cannot exceed 1000 characters']
    },
    submittedAt: Date,
    // Detailed feedback
    content: {
      type: Number,
      min: 1,
      max: 5
    },
    instructor: {
      type: Number,
      min: 1,
      max: 5
    },
    materials: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  // Notes
  notes: {
    type: String,
    trim: true
  },
  // Cancel/No-show
  cancelledAt: Date,
  cancellationReason: String,
  noShowReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
trainingEnrollmentSchema.index({ trainingId: 1, employeeId: 1 }, { unique: true });
trainingEnrollmentSchema.index({ organizationId: 1, status: 1 });

// Virtual for training status
trainingEnrollmentSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for can take assessment
trainingEnrollmentSchema.virtual('canTakeAssessment').get(function() {
  return this.progress >= 100 && this.status === 'in_progress';
});

// Pre-save hook to generate enrollment ID
trainingEnrollmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.enrollmentId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    const year = new Date().getFullYear();
    this.enrollmentId = `ENR${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Static method to get employee enrollments
trainingEnrollmentSchema.statics.getEmployeeEnrollments = function(employeeId, status = null) {
  const query = { employeeId };
  if (status) query.status = status;

  return this.find(query)
    .populate('trainingId', 'title type startDate endDate status')
    .sort({ enrolledAt: -1 });
};

// Static method to get training enrollments
trainingEnrollmentSchema.statics.getTrainingEnrollments = function(trainingId, status = null) {
  const query = { trainingId };
  if (status) query.status = status;

  return this.find(query)
    .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
    .sort({ enrolledAt: 1 });
};

// Static method to get upcoming enrollments
trainingEnrollmentSchema.statics.getUpcomingForEmployee = function(employeeId) {
  return this.find({
    employeeId,
    status: 'enrolled'
  })
    .populate({
      path: 'trainingId',
      match: { startDate: { $gte: new Date() } }
    })
    .sort({ enrolledAt: 1 });
};

// Method to start training
trainingEnrollmentSchema.methods.start = function() {
  if (this.status !== 'enrolled') {
    throw new Error('Only enrolled users can start training');
  }
  this.status = 'in_progress';
  this.startedAt = new Date();
  return this.save();
};

// Method to update progress
trainingEnrollmentSchema.methods.updateProgress = function(progress, sessionsAttended = null) {
  this.progress = Math.min(100, Math.max(0, progress));
  if (sessionsAttended !== null) {
    this.sessionsAttended = sessionsAttended;
  }

  if (this.progress >= 100) {
    this.completionPercentage = 100;
    if (!this.trainingId || !this.trainingId.hasAssessment) {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }

  return this.save();
};

// Method to complete training
trainingEnrollmentSchema.methods.complete = function() {
  if (this.status === 'in_progress' || this.status === 'enrolled') {
    this.status = 'completed';
    this.progress = 100;
    this.completionPercentage = 100;
    this.completedAt = new Date();
    return this.save();
  }
  throw new Error('Cannot complete training in current status');
};

// Method to submit assessment
trainingEnrollmentSchema.methods.submitAssessment = function(score, passed) {
  this.assessmentScore = score;
  this.passedAssessment = passed;
  this.assessmentAttemptedAt = new Date();
  this.assessmentAttempts += 1;

  if (passed) {
    this.status = 'completed';
    this.completedAt = new Date();
  } else {
    this.status = 'failed';
  }

  return this.save();
};

// Method to issue certificate
trainingEnrollmentSchema.methods.issueCertificate = function(certificateId, validityMonths = 0) {
  this.certificateIssued = true;
  this.certificateId = certificateId;
  this.certificateIssuedAt = new Date();

  if (validityMonths > 0) {
    this.certificateExpiryAt = new Date();
    this.certificateExpiryAt.setMonth(this.certificateExpiryAt.getMonth() + validityMonths);
  }

  return this.save();
};

// Method to submit feedback
trainingEnrollmentSchema.methods.submitFeedback = function(feedbackData) {
  this.feedback = {
    ...feedbackData,
    submittedAt: new Date()
  };
  return this.save();
};

// Method to cancel enrollment
trainingEnrollmentSchema.methods.cancel = function(reason) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel completed training');
  }
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Method to mark as no-show
trainingEnrollmentSchema.methods.markNoShow = function(reason) {
  this.status = 'no_show';
  this.noShowReason = reason;
  return this.save();
};

const TrainingEnrollment = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);

export default TrainingEnrollment;