import mongoose from 'mongoose';
import Event from '../../models/Event.js';

class EventService {
  /**
   * Get events for date range
   */
  async getEvents(organizationId, startDate, endDate, filters = {}) {
    const query = { organizationId };

    if (startDate && endDate) {
      query.$or = [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ];
    }

    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.organizer) {
      query.organizer = filters.organizer;
    }

    return Event.find(query)
      .populate('organizer', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('participants', 'personalInfo.firstName personalInfo.lastName employeeId')
      .sort({ startDate: 1 });
  }

  /**
   * Get event by ID
   */
  async getEventById(id, organizationId) {
    return Event.findOne({ _id: id, organizationId })
      .populate('organizer', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
      .populate('participants', 'personalInfo.firstName personalInfo.lastName employeeId employment.department');
  }

  /**
   * Create event
   */
  async createEvent(data) {
    const event = new Event(data);
    await event.save();
    return this.getEventById(event._id, data.organizationId);
  }

  /**
   * Update event
   */
  async updateEvent(id, organizationId, data) {
    const event = await Event.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    );
    return event;
  }

  /**
   * Delete event
   */
  async deleteEvent(id, organizationId) {
    const event = await Event.findOneAndDelete({ _id: id, organizationId });
    return event;
  }

  /**
   * Add participant
   */
  async addParticipant(id, organizationId, participantId) {
    const event = await Event.findOne({ _id: id, organizationId });
    if (!event) {
      throw new Error('Event not found');
    }
    await event.addParticipant(participantId);
    return this.getEventById(id, organizationId);
  }

  /**
   * Remove participant
   */
  async removeParticipant(id, organizationId, participantId) {
    const event = await Event.findOne({ _id: id, organizationId });
    if (!event) {
      throw new Error('Event not found');
    }
    await event.removeParticipant(participantId);
    return this.getEventById(id, organizationId);
  }

  /**
   * Cancel event
   */
  async cancelEvent(id, organizationId, reason) {
    const event = await Event.findOne({ _id: id, organizationId });
    if (!event) {
      throw new Error('Event not found');
    }
    await event.cancel(reason);
    return this.getEventById(id, organizationId);
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(organizationId, days = 7) {
    return Event.getUpcoming(organizationId, days);
  }

  /**
   * Get events by type
   */
  async getEventsByType(organizationId, type, startDate, endDate) {
    return Event.getByType(organizationId, type, startDate, endDate);
  }

  /**
   * Get events for employee
   */
  async getEventsForEmployee(employeeId, startDate, endDate) {
    const query = {
      $or: [
        { organizer: employeeId },
        { participants: employeeId },
        { isOrganizationWide: true }
      ]
    };

    if (startDate && endDate) {
      query.$or = [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } }
      ];
    }

    return Event.find(query)
      .populate('organizer', 'personalInfo.firstName personalInfo.lastName')
      .sort({ startDate: 1 });
  }

  /**
   * Get event statistics
   */
  async getEventStats(organizationId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const stats = await Event.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          startDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = stats.reduce((sum, s) => sum + s.count, 0);

    return {
      total,
      byType: stats.map(s => ({
        type: s._id,
        count: s.count
      }))
    };
  }
}

export default new EventService();