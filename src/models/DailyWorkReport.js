import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [500, 'Task description cannot exceed 500 characters']
  },
  done: {
    type: Boolean,
    default: false
  },
  proof: {
    type: String, // URL or file path to proof/document
    trim: true
  },
  timeSlots: [{
    type: String, // e.g., "09:00-10:00", "10:00-11:00"
    match: [/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Invalid time slot format']
  }],
  hours: {
    type: Number,
    min: 0,
    max: 24,
    default: 1
  }
}, { _id: true });

// Hourly report schema for the new hourly DWR system
const hourlyReportSchema = new mongoose.Schema({
  hourSlot: {
    type: String,
    required: [true, 'Hour slot is required'],
    match: [/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Invalid hour slot format']
  },
  workDescription: {
    type: String,
    required: [true, 'Work description is required'],
    trim: true,
    maxlength: [1000, 'Work description cannot exceed 1000 characters']
  },
  proofUrl: {
    type: String, // URL/path to uploaded file
    trim: true
  },
  proofType: {
    type: String,
    enum: ['image', 'document', 'video', 'other'],
    default: 'document'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const dailyWorkReportSchema = new mongoose.Schema({
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
  reportId: {
    type: String,
    unique: true,
    sparse: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  // Tasks for the day (legacy - kept for backwards compatibility)
  tasks: [taskSchema],
  // Hourly reports for the new hourly DWR system
  hourlyReports: [hourlyReportSchema],
  // Summary
  summary: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    pendingTasks: {
      type: Number,
      default: 0
    },
    inProgressTasks: {
      type: Number,
      default: 0
    },
    blockedTasks: {
      type: Number,
      default: 0
    },
    totalHoursWorked: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  // General notes
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  // Next day plan
  nextDayPlan: {
    type: String,
    trim: true,
    maxlength: [1000, 'Next day plan cannot exceed 1000 characters']
  },
  // Challenges faced
  challenges: {
    type: String,
    trim: true,
    maxlength: [500, 'Challenges cannot exceed 500 characters']
  },
  // Review status
  reviewStatus: {
    type: String,
    enum: ['pending', 'reviewed', 'needs_attention'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  reviewedAt: {
    type: Date
  },
  reviewComments: {
    type: String,
    trim: true,
    maxlength: [500, 'Review comments cannot exceed 500 characters']
  },
  managerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  submittedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  // Metadata
  isLate: {
    type: Boolean,
    default: false
  },
  lateByMinutes: {
    type: Number,
    default: 0
  },
  submittedFrom: {
    type: String,
    enum: ['web', 'mobile', 'api'],
    default: 'web'
  },
  location: {
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

// Compound indexes
dailyWorkReportSchema.index({ organizationId: 1, date: 1 });
dailyWorkReportSchema.index({ employeeId: 1, date: 1 }, { unique: true });
dailyWorkReportSchema.index({ organizationId: 1, reviewStatus: 1 });

// Virtual for day of week
dailyWorkReportSchema.virtual('dayOfWeek').get(function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(this.date).getDay()];
});

// Virtual for is working day (Mon-Fri)
dailyWorkReportSchema.virtual('isWorkingDay').get(function() {
  const day = new Date(this.date).getDay();
  return day >= 1 && day <= 5;
});

// Pre-save hook to calculate summary and generate report ID
dailyWorkReportSchema.pre('save', function(next) {
  // Calculate summary
  if (this.tasks && this.tasks.length > 0) {
    this.summary.totalTasks = this.tasks.length;
    this.summary.completedTasks = this.tasks.filter(t => t.done).length;
    this.summary.pendingTasks = this.tasks.filter(t => !t.done).length;
    this.summary.inProgressTasks = 0; // No longer used
    this.summary.blockedTasks = 0; // No longer used
    this.summary.totalHoursWorked = this.tasks.reduce((sum, t) => sum + (t.hours || 0), 0);
    this.summary.completionRate = (this.summary.completedTasks / this.summary.totalTasks) * 100;
  } else {
    this.summary = {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      blockedTasks: 0,
      totalHoursWorked: 0,
      completionRate: 0
    };
  }

  // Generate report ID if new
  if (this.isNew && !this.reportId) {
    const dateStr = new Date(this.date).toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.reportId = `DWR${dateStr}${random}`;
  }

  next();
});

// Static method to get employee reports for month
dailyWorkReportSchema.statics.getEmployeeMonthlyReports = function(employeeId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return this.find({
    employeeId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
};

// Static method to get compliance statistics
dailyWorkReportSchema.statics.getComplianceStats = async function(organizationId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Get all working days in the month
  const workingDays = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    if (day >= 1 && day <= 5) { // Monday to Friday
      workingDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const reports = await this.find({
    organizationId,
    date: { $gte: startDate, $lte: endDate }
  });

  const totalWorkingDays = workingDays.length;
  const submittedReports = reports.length;
  const compliancePercentage = (submittedReports / totalWorkingDays) * 100;

  return {
    totalWorkingDays,
    submittedReports,
    pendingReports: totalWorkingDays - submittedReports,
    compliancePercentage
  };
};

// Static method to get pending reviews for manager
dailyWorkReportSchema.statics.getPendingReviews = function(managerId) {
  // Get all employees under this manager
  return this.aggregate([
    {
      $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: '_id',
        as: 'employee'
      }
    },
    {
      $unwind: '$employee'
    },
    {
      $match: {
        'employee.employment.reportingManager': managerId,
        reviewStatus: 'pending',
        status: 'submitted'
      }
    },
    {
      $sort: { date: -1 }
    }
  ]);
};

// Static method to get DWR performance stats for organization
dailyWorkReportSchema.statics.getDWRPerformanceStats = async function(organizationId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  // Get all DWRs for the period
  const dwrs = await this.find({
    organizationId,
    date: { $gte: startDate, $lte: endDate }
  }).populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department');

  // Calculate working days in the month
  const workingDays = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    if (day >= 1 && day <= 5) { // Monday to Friday
      workingDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Group by employee
  const employeeStats = {};
  dwrs.forEach(dwr => {
    const empId = dwr.employeeId._id.toString();
    if (!employeeStats[empId]) {
      employeeStats[empId] = {
        employee: dwr.employeeId,
        totalDays: 0,
        totalHoursFilled: 0,
        reportsSubmitted: 0,
        hourlyReportsCount: 0
      };
    }
    employeeStats[empId].totalDays++;
    employeeStats[empId].reportsSubmitted++;
    employeeStats[empId].hourlyReportsCount += dwr.hourlyReports?.length || 0;
    employeeStats[empId].totalHoursFilled += dwr.hourlyReports?.length || 0;
  });

  // Convert to array and calculate rates
  const stats = Object.values(employeeStats).map(stat => ({
    ...stat,
    submissionRate: workingDays.length > 0 ? (stat.reportsSubmitted / workingDays.length) * 100 : 0,
    averageHoursPerDay: stat.reportsSubmitted > 0 ? stat.totalHoursFilled / stat.reportsSubmitted : 0
  }));

  return {
    totalWorkingDays: workingDays.length,
    totalDWRsSubmitted: dwrs.length,
    employees: stats,
    overallSubmissionRate: workingDays.length > 0 ? (dwrs.length / workingDays.length) * (Object.keys(employeeStats).length || 1) : 0
  };
};

// Method to submit report
dailyWorkReportSchema.methods.submit = function(userId) {
  this.status = 'submitted';
  this.submittedAt = new Date();
  this.updatedBy = userId;

  // Check if late (submitted after 6 PM)
  const now = new Date();
  const reportDate = new Date(this.date);
  const deadline = new Date(reportDate);
  deadline.setHours(18, 0, 0, 0); // 6 PM deadline

  if (now > deadline) {
    this.isLate = true;
    this.lateByMinutes = Math.floor((now - deadline) / (1000 * 60));
  }

  return this.save();
};

// Method to add review
dailyWorkReportSchema.methods.addReview = function(reviewerId, data) {
  this.reviewStatus = data.needsAttention ? 'needs_attention' : 'reviewed';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewComments = data.comments;
  this.managerRating = data.rating;
  this.status = 'approved';
  this.approvedAt = new Date();

  return this.save();
};

// Method to add task
dailyWorkReportSchema.methods.addTask = function(task) {
  this.tasks.push(task);
  return this.save();
};

// Method to update task
dailyWorkReportSchema.methods.updateTask = function(taskId, updates) {
  const task = this.tasks.id(taskId);
  if (task) {
    Object.assign(task, updates);
    return this.save();
  }
  throw new Error('Task not found');
};

// Method to remove task
dailyWorkReportSchema.methods.removeTask = function(taskId) {
  this.tasks.pull(taskId);
  return this.save();
};

// Method to add hourly report
dailyWorkReportSchema.methods.addHourlyReport = function(report) {
  // Check if hour slot already exists
  const existingReport = this.hourlyReports.find(r => r.hourSlot === report.hourSlot);
  if (existingReport) {
    // Update existing report
    existingReport.workDescription = report.workDescription;
    existingReport.proofUrl = report.proofUrl;
    existingReport.proofType = report.proofType;
    existingReport.submittedAt = new Date();
  } else {
    // Add new report
    this.hourlyReports.push(report);
  }
  return this.save();
};

// Method to get hourly report for a specific hour slot
dailyWorkReportSchema.methods.getHourlyReport = function(hourSlot) {
  return this.hourlyReports.find(r => r.hourSlot === hourSlot);
};

const DailyWorkReport = mongoose.model('DailyWorkReport', dailyWorkReportSchema);

export default DailyWorkReport;