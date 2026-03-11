import mongoose from 'mongoose';
import { CANDIDATE_STATUS } from '../config/constants.js';

const candidateSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  jobOpeningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobOpening',
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
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
    required: [true, 'Phone number is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  resumeUrl: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    default: 0,
    min: [0, 'Experience cannot be negative']
  },
  expectedSalary: {
    type: Number,
    min: [0, 'Expected salary cannot be negative']
  },
  currentSalary: {
    type: Number,
    min: [0, 'Current salary cannot be negative']
  },
  status: {
    type: String,
    enum: Object.values(CANDIDATE_STATUS),
    default: CANDIDATE_STATUS.APPLIED
  },
  screeningNotes: [{
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  interviewDetails: {
    scheduledAt: Date,
    interviewer: String,
    location: String,
    notes: String,
    completed: {
      type: Boolean,
      default: false
    },
    result: {
      type: String,
      enum: ['pending', 'selected', 'rejected']
    }
  },
  training: {
    startDate: Date,
    endDate: Date,
    days: Number,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    },
    notes: String,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  offerLetterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfferLetter'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'job_portal', 'walk_in', 'other'],
    default: 'website'
  },
  notes: String,
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
candidateSchema.index({ organizationId: 1, status: 1 });
candidateSchema.index({ organizationId: 1, email: 1 });
candidateSchema.index({ organizationId: 1, appliedAt: -1 });

// Virtual for offer letter
candidateSchema.virtual('offerLetter', {
  ref: 'OfferLetter',
  localField: 'offerLetterId',
  foreignField: '_id',
  justOne: true
});

// Method to check if candidate can be moved to next stage
candidateSchema.methods.canTransitionTo = function(newStatus) {
  const transitions = {
    [CANDIDATE_STATUS.APPLIED]: [CANDIDATE_STATUS.SHORTLISTED, CANDIDATE_STATUS.REJECTED],
    [CANDIDATE_STATUS.SHORTLISTED]: [CANDIDATE_STATUS.SCREENING, CANDIDATE_STATUS.REJECTED],
    [CANDIDATE_STATUS.SCREENING]: [CANDIDATE_STATUS.INTERVIEW_SCHEDULED, CANDIDATE_STATUS.REJECTED],
    [CANDIDATE_STATUS.INTERVIEW_SCHEDULED]: [CANDIDATE_STATUS.SELECTED, CANDIDATE_STATUS.REJECTED],
    [CANDIDATE_STATUS.SELECTED]: [CANDIDATE_STATUS.TRAINING, CANDIDATE_STATUS.OFFER_SENT],
    [CANDIDATE_STATUS.TRAINING]: [CANDIDATE_STATUS.OFFER_SENT, CANDIDATE_STATUS.REJECTED],
    [CANDIDATE_STATUS.OFFER_SENT]: [CANDIDATE_STATUS.REJECTED], // Can only be rejected from offer_sent
    [CANDIDATE_STATUS.REJECTED]: [] // Terminal state
  };

  return transitions[this.status]?.includes(newStatus) || false;
};

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;