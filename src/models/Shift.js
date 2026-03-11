import mongoose from 'mongoose';
import { generateShiftCode } from '../utils/helpers.js';

const timingSchema = new mongoose.Schema({
  days: [{
    type: Number,
    min: 0,
    max: 6 // 0 = Sunday, 6 = Saturday
  }],
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  }
}, { _id: false });

const shiftSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Shift name is required'],
    trim: true,
    maxlength: [50, 'Shift name cannot exceed 50 characters']
  },
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  timings: [timingSchema],
  gracePeriodMinutes: {
    type: Number,
    default: 10,
    min: [0, 'Grace period cannot be negative'],
    max: [60, 'Grace period cannot exceed 60 minutes']
  },
  halfDayHours: {
    type: Number,
    default: 4,
    min: [1, 'Half day hours must be at least 1']
  },
  fullDayHours: {
    type: Number,
    default: 8,
    min: [1, 'Full day hours must be at least 1']
  },
  overtimeMultiplier: {
    type: Number,
    default: 1.5,
    min: [1, 'Overtime multiplier cannot be less than 1']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
shiftSchema.index({ organizationId: 1, isActive: 1 });

// Pre-save hook to generate shift code
shiftSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    const Shift = mongoose.model('Shift');
    const count = await Shift.countDocuments({ organizationId: this.organizationId });
    this.code = generateShiftCode(count + 1);
  }
  next();
});

// Virtual for employee count
shiftSchema.virtual('employeeCount', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'shiftId',
  count: true
});

// Method to get timing for a specific day
shiftSchema.methods.getTimingForDay = function(dayOfWeek) {
  return this.timings.find(timing => timing.days.includes(dayOfWeek));
};

// Method to calculate shift duration for a day
shiftSchema.methods.calculateDuration = function(dayOfWeek) {
  const timing = this.getTimingForDay(dayOfWeek);
  if (!timing) return 0;

  const [startHours, startMinutes] = timing.startTime.split(':').map(Number);
  const [endHours, endMinutes] = timing.endTime.split(':').map(Number);

  let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);

  // Handle overnight shifts
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }

  return durationMinutes / 60; // Return hours
};

// Method to check if time is within shift
shiftSchema.methods.isWithinShift = function(time, dayOfWeek) {
  const timing = this.getTimingForDay(dayOfWeek);
  if (!timing) return false;

  const [startHours, startMinutes] = timing.startTime.split(':').map(Number);
  const [endHours, endMinutes] = timing.endTime.split(':').map(Number);

  const timeMinutes = time.getHours() * 60 + time.getMinutes();
  const startMinutesTotal = startHours * 60 + startMinutes;
  const endMinutesTotal = endHours * 60 + endMinutes;

  // Handle overnight shifts
  if (startMinutesTotal > endMinutesTotal) {
    return timeMinutes >= startMinutesTotal || timeMinutes <= endMinutesTotal;
  }

  return timeMinutes >= startMinutesTotal && timeMinutes <= endMinutesTotal;
};

// Static method to find active shifts
shiftSchema.statics.findActive = function(organizationId) {
  return this.find({ organizationId, isActive: true });
};

const Shift = mongoose.model('Shift', shiftSchema);

export default Shift;