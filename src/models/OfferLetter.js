import mongoose from 'mongoose';
import { OFFER_STATUS } from '../config/constants.js';

const offerLetterSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Candidate ID is required'],
    index: true
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
  salary: {
    basic: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: [0, 'Salary cannot be negative']
    },
    allowances: {
      type: Number,
      default: 0,
      min: [0, 'Allowances cannot be negative']
    },
    total: {
      type: Number,
      required: [true, 'Total salary is required'],
      min: [0, 'Total salary cannot be negative']
    }
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required']
  },
  probationPeriod: {
    type: Number,
    default: 6,
    min: [0, 'Probation period cannot be negative']
  },
  status: {
    type: String,
    enum: Object.values(OFFER_STATUS),
    default: OFFER_STATUS.PENDING
  },
  sentAt: Date,
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  terms: {
    workingHours: {
      start: String,
      end: String
    },
    workLocation: String,
    reportingManager: String,
    benefits: [String],
    notes: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
offerLetterSchema.index({ organizationId: 1, status: 1 });

// Virtual for candidate
offerLetterSchema.virtual('candidateDetails', {
  ref: 'Candidate',
  localField: 'candidateId',
  foreignField: '_id',
  justOne: true
});

// Method to mark as sent
offerLetterSchema.methods.markAsSent = async function() {
  this.status = OFFER_STATUS.SENT;
  this.sentAt = new Date();
  return this.save();
};

// Method to mark as accepted
offerLetterSchema.methods.markAsAccepted = async function() {
  this.status = OFFER_STATUS.ACCEPTED;
  this.acceptedAt = new Date();
  return this.save();
};

// Method to mark as rejected
offerLetterSchema.methods.markAsRejected = async function(reason) {
  this.status = OFFER_STATUS.REJECTED;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

const OfferLetter = mongoose.model('OfferLetter', offerLetterSchema);

export default OfferLetter;