import mongoose from 'mongoose';
import { JOB_OPENING_STATUS, EMPLOYMENT_TYPES } from '../config/constants.js';

const jobOpeningSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  employmentType: {
    type: String,
    enum: Object.values(EMPLOYMENT_TYPES),
    default: EMPLOYMENT_TYPES.FULL_TIME
  },
  experienceRequired: {
    min: {
      type: Number,
      default: 0,
      min: [0, 'Minimum experience cannot be negative']
    },
    max: {
      type: Number,
      default: 0,
      min: [0, 'Maximum experience cannot be negative']
    }
  },
  salaryRange: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    isNegotiable: {
      type: Boolean,
      default: true
    }
  },
  skills: [{
    type: String,
    trim: true
  }],
  qualifications: [{
    type: String,
    trim: true
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: Object.values(JOB_OPENING_STATUS),
    default: JOB_OPENING_STATUS.DRAFT
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Posted by is required']
  },
  applicationDeadline: {
    type: Date
  },
  vacancies: {
    type: Number,
    default: 1,
    min: [1, 'Vacancies must be at least 1']
  },
  filledPositions: {
    type: Number,
    default: 0,
    min: [0, 'Filled positions cannot be negative']
  },
  applicationsCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
jobOpeningSchema.index({ organizationId: 1, status: 1 });
jobOpeningSchema.index({ organizationId: 1, department: 1 });
jobOpeningSchema.index({ organizationId: 1, createdAt: -1 });
jobOpeningSchema.index({ title: 'text', description: 'text' });

// Virtual for applications
jobOpeningSchema.virtual('applications', {
  ref: 'Candidate',
  localField: '_id',
  foreignField: 'jobOpeningId',
  justOne: false
});

// Method to check if job opening is accepting applications
jobOpeningSchema.methods.isAcceptingApplications = function() {
  return this.status === JOB_OPENING_STATUS.ACTIVE &&
         this.isActive &&
         (!this.applicationDeadline || new Date() < this.applicationDeadline) &&
         this.filledPositions < this.vacancies;
};

// Method to increment application count
jobOpeningSchema.methods.incrementApplications = function() {
  this.applicationsCount += 1;
  return this.save();
};

// Method to increment filled positions
jobOpeningSchema.methods.incrementFilledPositions = function() {
  this.filledPositions += 1;
  if (this.filledPositions >= this.vacancies) {
    this.status = JOB_OPENING_STATUS.CLOSED;
  }
  return this.save();
};

const JobOpening = mongoose.model('JobOpening', jobOpeningSchema);

export default JobOpening;