import mongoose from 'mongoose';

const designProjectSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Project reference to Sales Lead (from won deals)
  salesLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesLead'
  },
  // Project Info
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  clientPhone: {
    type: String,
    trim: true
  },
  clientEmail: {
    type: String,
    trim: true
  },
  clientAddress: {
    type: String,
    trim: true
  },
  projectType: {
    type: String,
    enum: ['Kitchen', 'Wardrobe', 'Full Home', 'Office', 'Commercial', 'Other'],
    default: 'Kitchen'
  },
  description: {
    type: String,
    trim: true
  },
  // Project value
  projectValue: {
    type: Number,
    default: 0
  },
  // Design stage
  stage: {
    type: String,
    enum: [
      'New Request',
      'Assigned',
      'Design In Progress',
      'Pending Review',
      'Client Review',
      'Revision',
      'Approved',
      'Completed'
    ],
    default: 'New Request'
  },
  status: {
    type: String,
    enum: ['active', 'on_hold', 'completed', 'cancelled'],
    default: 'active'
  },
  // Priority
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  // Designer Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  assignedToName: {
    type: String
  },
  assignedAt: {
    type: Date
  },
  // Dates
  startDate: {
    type: Date
  },
  expectedCompletionDate: {
    type: Date
  },
  actualCompletionDate: {
    type: Date
  },
  // Design details
  designDetails: {
    style: {
      type: String,
      enum: ['Modern', 'Contemporary', 'Traditional', 'Minimalist', 'Industrial', 'Scandinavian', 'Other'],
      default: 'Modern'
    },
    roomType: {
      type: String,
      default: ''
    },
    requirements: {
      type: String,
      default: ''
    },
    materials: [{
      type: String
    }]
  },
  // Files and attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Design PDF for client approval (uploaded by ID employee)
  designPdf: {
    name: String,
    url: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  },
  // Final PDF with measurements (uploaded after client approval)
  finalPdf: {
    name: String,
    url: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  },
  // Client approval status
  clientApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  clientApprovedAt: {
    type: Date
  },
  clientApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Client feedback
  clientFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    feedbackDate: Date
  },
  // Notes
  notes: {
    type: String
  },
  internalNotes: {
    type: String
  },
  // Created/Updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
designProjectSchema.index({ organizationId: 1, stage: 1 });
designProjectSchema.index({ organizationId: 1, status: 1 });
designProjectSchema.index({ organizationId: 1, assignedTo: 1 });
designProjectSchema.index({ organizationId: 1, createdAt: -1 });

const DesignProject = mongoose.model('DesignProject', designProjectSchema);

export default DesignProject;