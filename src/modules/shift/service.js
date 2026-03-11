import Shift from '../../models/Shift.js';
import mongoose from 'mongoose';

class ShiftService {
  /**
   * Get shifts with filtering and pagination
   */
  async getShifts(organizationId, filters, options) {
    const query = { organizationId };

    // Apply filters
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    } else {
      query.isActive = true; // Default to active only
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const shifts = await Shift.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'profile.firstName profile.lastName email');

    const total = await Shift.countDocuments(query);

    return {
      shifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get shift by ID
   */
  async getShiftById(id, organizationId) {
    return Shift.findOne({ _id: id, organizationId })
      .populate('createdBy', 'profile.firstName profile.lastName email');
  }

  /**
   * Create shift
   */
  async createShift(data) {
    const shift = new Shift({
      organizationId: data.organizationId,
      name: data.name,
      code: data.code,
      timings: data.timings,
      gracePeriodMinutes: data.gracePeriodMinutes || 10,
      halfDayHours: data.halfDayHours || 4,
      fullDayHours: data.fullDayHours || 8,
      overtimeMultiplier: data.overtimeMultiplier || 1.5,
      description: data.description,
      createdBy: data.createdBy
    });

    await shift.save();
    return await this.getShiftById(shift._id, data.organizationId);
  }

  /**
   * Update shift
   */
  async updateShift(id, organizationId, data) {
    const update = {};

    if (data.name !== undefined) update.name = data.name;
    if (data.timings !== undefined) update.timings = data.timings;
    if (data.gracePeriodMinutes !== undefined) update.gracePeriodMinutes = data.gracePeriodMinutes;
    if (data.halfDayHours !== undefined) update.halfDayHours = data.halfDayHours;
    if (data.fullDayHours !== undefined) update.fullDayHours = data.fullDayHours;
    if (data.overtimeMultiplier !== undefined) update.overtimeMultiplier = data.overtimeMultiplier;
    if (data.description !== undefined) update.description = data.description;

    const shift = await Shift.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: update },
      { new: true, runValidators: true }
    ).populate('createdBy', 'profile.firstName profile.lastName email');

    return shift;
  }

  /**
   * Deactivate shift
   */
  async deactivateShift(id, organizationId) {
    // Check if any employees are assigned to this shift
    const Employee = mongoose.model('Employee');
    const employeesWithShift = await Employee.countDocuments({
      organizationId,
      shiftId: id,
      status: 'active'
    });

    if (employeesWithShift > 0) {
      throw new Error(`Cannot deactivate shift. ${employeesWithShift} employees are assigned to this shift.`);
    }

    const shift = await Shift.findOneAndUpdate(
      { _id: id, organizationId },
      { isActive: false },
      { new: true }
    );

    return shift;
  }

  /**
   * Get shift for a specific day and time
   */
  async getShiftForTime(shiftId, date) {
    const shift = await Shift.findById(shiftId);
    if (!shift) return null;

    const dayOfWeek = date.getDay();
    const timing = shift.getTimingForDay(dayOfWeek);

    return timing ? { shift, timing } : null;
  }

  /**
   * Get all active shifts for organization
   */
  async getActiveShifts(organizationId) {
    return Shift.find({ organizationId, isActive: true });
  }
}

export default new ShiftService();