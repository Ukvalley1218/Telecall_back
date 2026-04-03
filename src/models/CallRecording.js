import mongoose from 'mongoose';

const callRecordingSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  // Cloudinary file info
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  publicId: {
    type: String,
    required: [true, 'Public ID is required']
  },
  // File metadata
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number // in bytes
  },
  format: {
    type: String // mp3, wav, etc.
  },
  duration: {
    type: Number // in seconds
  },
  // Call details (optional)
  callType: {
    type: String,
    enum: ['incoming', 'outgoing', 'missed'],
    default: 'outgoing'
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesLead'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
callRecordingSchema.index({ organizationId: 1, createdAt: -1 });
callRecordingSchema.index({ uploadedBy: 1, createdAt: -1 });
callRecordingSchema.index({ phoneNumber: 1 });
callRecordingSchema.index({ leadId: 1 });

// Static method to find by organization
callRecordingSchema.statics.findByOrganization = function(organizationId, options = {}) {
  const query = { organizationId, isActive: true };

  if (options.callType) {
    query.callType = options.callType;
  }
  if (options.phoneNumber) {
    query.phoneNumber = new RegExp(options.phoneNumber, 'i');
  }
  if (options.uploadedBy) {
    query.uploadedBy = options.uploadedBy;
  }

  return this.find(query)
    .populate('uploadedBy', 'profile.firstName profile.lastName email')
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

// Static method to find by user
callRecordingSchema.statics.findByUser = function(userId, options = {}) {
  const query = { uploadedBy: userId, isActive: true };

  if (options.callType) {
    query.callType = options.callType;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

// Instance method to get public info
callRecordingSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const CallRecording = mongoose.model('CallRecording', callRecordingSchema);

export default CallRecording;