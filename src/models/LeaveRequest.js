import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  requestId: {
    type: String,
    unique: true,
    sparse: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required'],
    index: true
  },
  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveType',
    required: [true, 'Leave type ID is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  totalDays: {
    type: Number,
    required: true,
    min: [0.5, 'Minimum leave duration is 0.5 day']
  },
  halfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['first_half', 'second_half'],
    default: null
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'hod_approved', 'hr_approved', 'approved', 'rejected', 'cancelled', 'withdrawn'],
    default: 'pending',
    index: true
  },
  appliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  approvalLevel: {
    type: Number,
    default: 1
  },
  currentApprover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvalHistory: [{
    level: {
      type: Number,
      required: true
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'forwarded'],
      required: true
    },
    comments: {
      type: String,
      trim: true
    },
    actionAt: {
      type: Date,
      default: Date.now
    }
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedAt: {
    type: Date
  },
  approvalNotes: {
    type: String,
    trim: true
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  documentUrl: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  handoverNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Handover notes cannot exceed 1000 characters']
  },
  isEmergency: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
leaveRequestSchema.index({ organizationId: 1, status: 1 });
leaveRequestSchema.index({ organizationId: 1, startDate: 1, endDate: 1 });
leaveRequestSchema.index({ employeeId: 1, startDate: 1 });
leaveRequestSchema.index({ currentApprover: 1, status: 1 });

// Virtual for duration in days
leaveRequestSchema.virtual('durationDays').get(function() {
  if (this.halfDay) return 0.5;
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
});

// Pre-save hook to generate request ID
leaveRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestId) {
    const count = await this.constructor.countDocuments({ organizationId: this.organizationId });
    const year = new Date().getFullYear();
    this.requestId = `LR${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Static method to get pending requests for approver
leaveRequestSchema.statics.getPendingForApprover = function(organizationId, approverId) {
  return this.find({
    organizationId,
    currentApprover: approverId,
    status: 'pending'
  })
    .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
    .populate('leaveTypeId', 'name code color')
    .sort({ appliedAt: -1 });
};

// Static method to check for overlapping leaves
leaveRequestSchema.statics.checkOverlap = async function(employeeId, startDate, endDate, excludeId = null) {
  const query = {
    employeeId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.findOne(query);
};

// Method to approve request - handles multi-level approval
leaveRequestSchema.methods.approve = async function(approverId, notes, approvalType = 'hod') {
  console.log('LeaveRequest.approve called:', {
    currentStatus: this.status,
    approvalType,
    approverId
  });

  // Determine the level and new status based on approval type
  const level = approvalType === 'hod' ? 1 : 2;

  if (approvalType === 'hod') {
    // HOD approval - move to hod_approved status
    this.status = 'hod_approved';
    console.log('Setting status to: hod_approved');
  } else if (approvalType === 'hr') {
    // HR approval - move to approved status
    this.status = 'approved';
    this.approvedBy = approverId;
    this.approvedAt = new Date();
    this.approvalNotes = notes;
    console.log('Setting status to: approved');
  }

  // Add to approval history
  this.approvalHistory.push({
    level: level,
    approverId,
    action: 'approved',
    comments: notes
  });

  console.log('Before save - status:', this.status);
  const result = await this.save();
  console.log('After save - status:', result.status);
  return result;
};

// Method to forward request to next approval level
leaveRequestSchema.methods.forward = async function(nextApproverId, currentApproverId, notes) {
  this.approvalLevel += 1;
  this.currentApprover = nextApproverId;

  // Add to approval history
  this.approvalHistory.push({
    level: this.approvalLevel - 1,
    approverId: currentApproverId,
    action: 'forwarded',
    comments: notes
  });

  return this.save();
};

// Method to reject request
leaveRequestSchema.methods.reject = async function(rejecterId, reason) {
  // Determine the level based on current status
  const level = this.status === 'hod_approved' ? 2 : 1;

  this.status = 'rejected';
  this.rejectedBy = rejecterId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;

  // Add to approval history
  this.approvalHistory.push({
    level: level,
    approverId: rejecterId,
    action: 'rejected',
    comments: reason
  });

  return this.save();
};

// Method to cancel request
leaveRequestSchema.methods.cancel = async function(cancelledBy, reason) {
  if (this.status === 'approved') {
    throw new Error('Cannot cancel an approved leave request');
  }

  this.status = 'cancelled';
  this.cancelledBy = cancelledBy;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;

  return this.save();
};

// Method to withdraw request
leaveRequestSchema.methods.withdraw = async function(withdrawnBy) {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be withdrawn');
  }

  this.status = 'withdrawn';
  this.cancelledBy = withdrawnBy;
  this.cancelledAt = new Date();

  return this.save();
};

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

export default LeaveRequest;