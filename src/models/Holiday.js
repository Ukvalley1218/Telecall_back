import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  holidayId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Holiday name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  // Date
  date: {
    type: Date,
    required: [true, 'Holiday date is required'],
    index: true
  },
  // Type
  type: {
    type: String,
    enum: ['national', 'regional', 'optional', 'company', 'restricted'],
    default: 'national',
    index: true
  },
  // Recurring
  isRecurring: {
    type: Boolean,
    default: true
  },
  // Year for filtering
  year: {
    type: Number,
    required: true,
    index: true
  },
  // Optional vs Mandatory
  isOptional: {
    type: Boolean,
    default: false
  },
  // Working day
  isWorkingDay: {
    type: Boolean,
    default: false
  },
  // Half day
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['first_half', 'second_half'],
    default: 'first_half'
  },
  // Applicable regions/departments
  applicableRegions: [{
    type: String,
    trim: true
  }],
  applicableDepartments: [{
    type: String,
    trim: true
  }],
  isOrganizationWide: {
    type: Boolean,
    default: true
  },
  // Color for calendar
  color: {
    type: String,
    default: '#EF4444',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format']
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Meta
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
holidaySchema.index({ organizationId: 1, year: 1 });
holidaySchema.index({ organizationId: 1, date: 1 });
holidaySchema.index({ organizationId: 1, type: 1, year: 1 });

// Virtual for day of week
holidaySchema.virtual('dayOfWeek').get(function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(this.date).getDay()];
});

// Virtual for is past
holidaySchema.virtual('isPast').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(this.date) < today;
});

// Pre-save hook to generate holiday ID and set year
holidaySchema.pre('save', function(next) {
  // Set year from date
  if (this.date) {
    this.year = new Date(this.date).getFullYear();
  }

  // Generate holiday ID if new
  if (this.isNew && !this.holidayId) {
    const year = this.year;
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.holidayId = `HOL${year}${random}`;
  }

  next();
});

// Static method to get holidays for year
holidaySchema.statics.getForYear = function(organizationId, year) {
  return this.find({
    organizationId,
    year,
    isActive: true
  }).sort({ date: 1 });
};

// Static method to get holidays for date range
holidaySchema.statics.getForDateRange = function(organizationId, startDate, endDate) {
  return this.find({
    organizationId,
    date: { $gte: startDate, $lte: endDate },
    isActive: true
  }).sort({ date: 1 });
};

// Static method to get upcoming holidays
holidaySchema.statics.getUpcoming = function(organizationId, limit = 10) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    organizationId,
    date: { $gte: today },
    isActive: true
  })
    .sort({ date: 1 })
    .limit(limit);
};

// Static method to get holiday calendar
holidaySchema.statics.getCalendar = async function(organizationId, year) {
  const holidays = await this.find({
    organizationId,
    year,
    isActive: true
  }).sort({ date: 1 });

  // Group by month
  const calendar = {};
  holidays.forEach(holiday => {
    const month = new Date(holiday.date).getMonth();
    if (!calendar[month]) {
      calendar[month] = [];
    }
    calendar[month].push(holiday);
  });

  return {
    year,
    holidays,
    calendar,
    totalHolidays: holidays.length,
    optionalHolidays: holidays.filter(h => h.isOptional).length,
    workingHolidays: holidays.filter(h => h.isWorkingDay).length
  };
};

// Static method to check if date is holiday
holidaySchema.statics.isHoliday = async function(organizationId, date) {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const holiday = await this.findOne({
    organizationId,
    date: checkDate,
    isActive: true,
    isWorkingDay: false
  });

  return holiday || null;
};

// Static method to get holiday summary for year
holidaySchema.statics.getYearSummary = async function(organizationId, year) {
  const holidays = await this.find({
    organizationId,
    year,
    isActive: true
  });

  return {
    total: holidays.length,
    byType: {
      national: holidays.filter(h => h.type === 'national').length,
      regional: holidays.filter(h => h.type === 'regional').length,
      optional: holidays.filter(h => h.type === 'optional').length,
      company: holidays.filter(h => h.type === 'company').length,
      restricted: holidays.filter(h => h.type === 'restricted').length
    },
    mandatory: holidays.filter(h => !h.isOptional).length,
    optional: holidays.filter(h => h.isOptional).length,
    halfDays: holidays.filter(h => h.isHalfDay).length,
    workingDays: holidays.filter(h => h.isWorkingDay).length
  };
};

// Static method to create recurring holidays
holidaySchema.statics.createRecurringForYear = async function(organizationId, year, userId) {
  const previousYear = year - 1;
  const recurringHolidays = await this.find({
    organizationId,
    year: previousYear,
    isRecurring: true,
    isActive: true
  });

  const newHolidays = [];
  for (const holiday of recurringHolidays) {
    // Check if already exists for the new year
    const existing = await this.findOne({
      organizationId,
      name: holiday.name,
      year: year
    });

    if (!existing) {
      const newDate = new Date(holiday.date);
      newDate.setFullYear(year);

      const newHoliday = new this({
        organizationId,
        name: holiday.name,
        description: holiday.description,
        date: newDate,
        type: holiday.type,
        isRecurring: holiday.isRecurring,
        isOptional: holiday.isOptional,
        isWorkingDay: holiday.isWorkingDay,
        isHalfDay: holiday.isHalfDay,
        halfDayType: holiday.halfDayType,
        applicableRegions: holiday.applicableRegions,
        applicableDepartments: holiday.applicableDepartments,
        isOrganizationWide: holiday.isOrganizationWide,
        color: holiday.color,
        createdBy: userId
      });

      await newHoliday.save();
      newHolidays.push(newHoliday);
    }
  }

  return newHolidays;
};

// Method to check if applies to department
holidaySchema.methods.appliesToDepartment = function(department) {
  if (this.isOrganizationWide) return true;
  if (!this.applicableDepartments || this.applicableDepartments.length === 0) return true;
  return this.applicableDepartments.includes(department);
};

// Method to check if applies to region
holidaySchema.methods.appliesToRegion = function(region) {
  if (this.isOrganizationWide) return true;
  if (!this.applicableRegions || this.applicableRegions.length === 0) return true;
  return this.applicableRegions.includes(region);
};

const Holiday = mongoose.model('Holiday', holidaySchema);

export default Holiday;