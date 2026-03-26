import mongoose from 'mongoose';

const thankYouCardSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Sender ID is required'],
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Receiver ID is required'],
    index: true
  },
  cardType: {
    type: String,
    required: [true, 'Card type is required'],
    enum: ['appreciation', 'teamwork', 'innovation', 'leadership', 'customer_service', 'going_above_beyond', 'custom'],
    default: 'appreciation'
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  month: {
    type: Number,
    min: 1,
    max: 12,
    default: () => new Date().getMonth() + 1
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
thankYouCardSchema.index({ organizationId: 1, createdAt: -1 });
thankYouCardSchema.index({ receiverId: 1, createdAt: -1 });
thankYouCardSchema.index({ senderId: 1, createdAt: -1 });
thankYouCardSchema.index({ organizationId: 1, month: 1, year: 1 });
thankYouCardSchema.index({ organizationId: 1, receiverId: 1, month: 1, year: 1 });

// Virtual for formatted date
thankYouCardSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Pre-save hook to set month and year
thankYouCardSchema.pre('save', function(next) {
  if (this.isNew || !this.month || !this.year) {
    const now = new Date();
    this.month = now.getMonth() + 1;
    this.year = now.getFullYear();
  }
  next();
});

// Static method to get top receivers for a month
thankYouCardSchema.statics.getTopReceivers = async function(organizationId, month, year, limit = 10) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  return this.aggregate([
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: '$receiverId',
        totalCards: { $sum: 1 },
        uniqueSenders: { $addToSet: '$senderId' },
        cardTypes: { $push: '$cardType' },
        messages: { $push: '$message' }
      }
    },
    {
      $addFields: {
        uniqueSenderCount: { $size: '$uniqueSenders' }
      }
    },
    {
      $sort: { totalCards: -1, uniqueSenderCount: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: '_id',
        as: 'employee'
      }
    },
    {
      $unwind: '$employee'
    },
    {
      $project: {
        employeeId: '$_id',
        name: { $concat: ['$employee.personalInfo.firstName', ' ', '$employee.personalInfo.lastName'] },
        department: '$employee.employment.department',
        designation: '$employee.employment.designation',
        employeeCode: '$employee.employeeId',
        totalCards: 1,
        uniqueSenderCount: 1,
        cardTypes: 1
      }
    }
  ]);
};

// Static method to get card statistics
thankYouCardSchema.statics.getCardStats = async function(organizationId, month, year) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const [totalCards, totalSenders, totalReceivers, cardsByType] = await Promise.all([
    this.countDocuments({
      organizationId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }),
    this.distinct('senderId', {
      organizationId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).then(ids => ids.length),
    this.distinct('receiverId', {
      organizationId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).then(ids => ids.length),
    this.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$cardType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])
  ]);

  return {
    totalCards,
    totalSenders,
    totalReceivers,
    cardsByType: cardsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

const ThankYouCard = mongoose.model('ThankYouCard', thankYouCardSchema);

export default ThankYouCard;