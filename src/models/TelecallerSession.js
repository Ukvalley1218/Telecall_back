import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number
}, { _id: false });

const checkSchema = new mongoose.Schema({
  time: Date,
  location: locationSchema,
  ip: String,
  device: String
}, { _id: false });

const telecallerSessionSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  checkIn: {
    type: checkSchema,
    default: null
  },
  checkOut: {
    type: checkSchema,
    default: null
  },
  workingHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'incomplete'],
    default: 'active'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique session per user per day
telecallerSessionSchema.index({ organizationId: 1, userId: 1, date: 1 }, { unique: true });

// Method to calculate working hours
telecallerSessionSchema.methods.calculateWorkingHours = function() {
  if (this.checkIn && this.checkIn.time && this.checkOut && this.checkOut.time) {
    const checkInTime = new Date(this.checkIn.time);
    const checkOutTime = new Date(this.checkOut.time);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    this.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  return this.workingHours;
};

// Static method to get or create today's session
telecallerSessionSchema.statics.getOrCreateToday = async function(organizationId, userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let session = await this.findOne({
    organizationId,
    userId,
    date: today
  });

  if (!session) {
    session = new this({
      organizationId,
      userId,
      date: today,
      status: 'active'
    });
  }

  return session;
};

const TelecallerSession = mongoose.model('TelecallerSession', telecallerSessionSchema);

export default TelecallerSession;