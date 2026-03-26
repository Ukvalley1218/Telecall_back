import mongoose from 'mongoose';

const kpiScoreSchema = new mongoose.Schema({
  kpiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KPI',
    required: true
  },
  kpiName: {
    type: String,
    required: true
  },
  group: {
    type: String,
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  achievedValue: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  weightage: {
    type: Number,
    default: 1
  },
  weightedScore: {
    type: Number,
    default: 0
  },
  comments: {
    type: String,
    trim: true
  }
}, { _id: false });

const performanceRecordSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required'],
    index: true
  },
  recordId: {
    type: String,
    unique: true,
    sparse: true
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2020,
    max: 2100
  },
  // KPI Scores
  kpiScores: [kpiScoreSchema],
  kpiScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  kpiWeightage: {
    type: Number,
    default: 0.6 // 60%
  },
  // Attendance Score
  attendance: {
    workingDays: {
      type: Number,
      default: 22
    },
    presentDays: {
      type: Number,
      default: 0
    },
    absentDays: {
      type: Number,
      default: 0
    },
    lateMarks: {
      type: Number,
      default: 0
    },
    halfDays: {
      type: Number,
      default: 0
    },
    paidLeaves: {
      type: Number,
      default: 0
    },
    unpaidLeaves: {
      type: Number,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  attendanceWeightage: {
    type: Number,
    default: 0.2 // 20%
  },
  // Incentive Score
  incentives: {
    totalIncentives: {
      type: Number,
      default: 0
    },
    incentiveCount: {
      type: Number,
      default: 0
    },
    targetIncentives: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  incentiveWeightage: {
    type: Number,
    default: 0.2 // 20%
  },
  // DWR Compliance
  dwrCompliance: {
    totalWorkingDays: {
      type: Number,
      default: 0
    },
    reportsSubmitted: {
      type: Number,
      default: 0
    },
    compliancePercentage: {
      type: Number,
      default: 0
    },
    pendingReports: {
      type: Number,
      default: 0
    }
  },
  // Final Score
  finalScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'],
    default: 'F'
  },
  // Manager Review
  managerReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    reviewedAt: Date,
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
    strengths: [String],
    areasOfImprovement: [String]
  },
  // Self Review
  selfReview: {
    submittedAt: Date,
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
    achievements: [String],
    challenges: [String],
    goals: [String]
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved', 'disputed'],
    default: 'draft'
  },
  // History
  history: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'submitted', 'reviewed', 'approved', 'disputed']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    previousScore: Number,
    newScore: Number,
    comments: String
  }],
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

// Compound indexes
performanceRecordSchema.index({ organizationId: 1, month: 1, year: 1 });
performanceRecordSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Virtual for period display
performanceRecordSchema.virtual('period').get(function() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[this.month - 1]} ${this.year}`;
});

// Pre-save hook to calculate scores and generate record ID
performanceRecordSchema.pre('save', function(next) {
  // Calculate KPI Score
  if (this.kpiScores && this.kpiScores.length > 0) {
    let totalWeightedScore = 0;
    let totalWeightage = 0;

    this.kpiScores.forEach(kpi => {
      // Calculate individual score (achieved/target * 100)
      if (kpi.targetValue > 0) {
        kpi.score = Math.min(100, (kpi.achievedValue / kpi.targetValue) * 100);
      }
      // Calculate weighted score
      kpi.weightedScore = kpi.score * kpi.weightage;
      totalWeightedScore += kpi.weightedScore;
      totalWeightage += kpi.weightage;
    });

    this.kpiScore = totalWeightage > 0 ? totalWeightedScore / totalWeightage : 0;
  }

  // Calculate Attendance Score
  if (this.attendance.workingDays > 0) {
    this.attendance.attendancePercentage =
      ((this.attendance.presentDays + this.attendance.paidLeaves + (this.attendance.halfDays * 0.5)) /
        this.attendance.workingDays) * 100;

    // Deduct for absences and late marks
    let penalty = 0;
    penalty += this.attendance.unpaidLeaves * 5; // 5% per unpaid leave
    penalty += this.attendance.lateMarks * 1; // 1% per late mark

    this.attendance.score = Math.max(0, this.attendance.attendancePercentage - penalty);
  }

  // Calculate Incentive Score
  if (this.incentives.targetIncentives > 0) {
    this.incentives.score = Math.min(100,
      (this.incentives.totalIncentives / this.incentives.targetIncentives) * 100);
  } else if (this.incentives.incentiveCount > 0) {
    // If no target, give base score for having incentives
    this.incentives.score = Math.min(100, 50 + (this.incentives.incentiveCount * 10));
  }

  // Calculate Final Score
  this.finalScore =
    (this.kpiScore * this.kpiWeightage) +
    (this.attendance.score * this.attendanceWeightage) +
    (this.incentives.score * this.incentiveWeightage);

  // Assign Grade
  if (this.finalScore >= 95) this.grade = 'A+';
  else if (this.finalScore >= 90) this.grade = 'A';
  else if (this.finalScore >= 80) this.grade = 'B+';
  else if (this.finalScore >= 70) this.grade = 'B';
  else if (this.finalScore >= 60) this.grade = 'C';
  else if (this.finalScore >= 50) this.grade = 'D';
  else this.grade = 'F';

  // Generate record ID if new
  if (this.isNew && !this.recordId) {
    const year = this.year;
    const month = String(this.month).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.recordId = `PERF${year}${month}${random}`;
  }

  next();
});

// Static method to get employee performance history
performanceRecordSchema.statics.getEmployeeHistory = function(employeeId, year) {
  const query = { employeeId };
  if (year) query.year = year;
  return this.find(query).sort({ year: -1, month: -1 });
};

// Static method to get organization performance summary
performanceRecordSchema.statics.getOrganizationSummary = async function(organizationId, month, year) {
  const records = await this.find({ organizationId, month, year });

  return {
    totalEmployees: records.length,
    averageScore: records.length > 0
      ? records.reduce((sum, r) => sum + r.finalScore, 0) / records.length
      : 0,
    gradeDistribution: {
      'A+': records.filter(r => r.grade === 'A+').length,
      'A': records.filter(r => r.grade === 'A').length,
      'B+': records.filter(r => r.grade === 'B+').length,
      'B': records.filter(r => r.grade === 'B').length,
      'C': records.filter(r => r.grade === 'C').length,
      'D': records.filter(r => r.grade === 'D').length,
      'F': records.filter(r => r.grade === 'F').length
    },
    topPerformers: records
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 10)
      .map(r => ({
        employeeId: r.employeeId,
        score: r.finalScore,
        grade: r.grade
      }))
  };
};

// Method to add to history
performanceRecordSchema.methods.addHistory = function(action, userId, comments) {
  this.history.push({
    action,
    performedBy: userId,
    performedAt: new Date(),
    previousScore: this.finalScore,
    comments
  });
  return this;
};

// Method to submit self review
performanceRecordSchema.methods.submitSelfReview = function(data, userId) {
  this.selfReview = {
    submittedAt: new Date(),
    rating: data.rating,
    comments: data.comments,
    achievements: data.achievements || [],
    challenges: data.challenges || [],
    goals: data.goals || []
  };
  this.status = 'submitted';
  this.addHistory('submitted', userId, 'Self review submitted');
  return this.save();
};

// Method to add manager review
performanceRecordSchema.methods.addManagerReview = function(managerId, data) {
  this.managerReview = {
    reviewedBy: managerId,
    reviewedAt: new Date(),
    rating: data.rating,
    comments: data.comments,
    strengths: data.strengths || [],
    areasOfImprovement: data.areasOfImprovement || []
  };
  this.status = 'reviewed';
  this.addHistory('reviewed', managerId, 'Manager review added');
  return this.save();
};

const PerformanceRecord = mongoose.model('PerformanceRecord', performanceRecordSchema);

export default PerformanceRecord;