import eventService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class EventController {
  async getEvents(req, res, next) {
    try {
      const { organizationId } = req;
      const { startDate, endDate, type, status } = req.query;

      const events = await eventService.getEvents(
        organizationId,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null,
        { type, status }
      );

      return successResponse(res, events, 'Events retrieved successfully');
    } catch (error) {
      logger.error('Get events error:', error);
      next(error);
    }
  }

  async getEventById(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const event = await eventService.getEventById(id, organizationId);

      if (!event) {
        return notFoundResponse(res, 'Event');
      }

      return successResponse(res, event, 'Event retrieved successfully');
    } catch (error) {
      logger.error('Get event error:', error);
      next(error);
    }
  }

  async createEvent(req, res, next) {
    try {
      const { organizationId, user } = req;

      const event = await eventService.createEvent({
        ...req.body,
        organizationId,
        createdBy: user._id
      });

      logger.info(`Event created: ${event.eventId} by user ${user._id}`);

      return createdResponse(res, event, 'Event created successfully');
    } catch (error) {
      logger.error('Create event error:', error);
      next(error);
    }
  }

  async updateEvent(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;

      const event = await eventService.updateEvent(id, organizationId, {
        ...req.body,
        updatedBy: user._id
      });

      if (!event) {
        return notFoundResponse(res, 'Event');
      }

      return successResponse(res, event, 'Event updated successfully');
    } catch (error) {
      logger.error('Update event error:', error);
      next(error);
    }
  }

  async deleteEvent(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const event = await eventService.deleteEvent(id, organizationId);

      if (!event) {
        return notFoundResponse(res, 'Event');
      }

      return successResponse(res, null, 'Event deleted successfully');
    } catch (error) {
      logger.error('Delete event error:', error);
      next(error);
    }
  }

  async addParticipant(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;
      const { participantId } = req.body;

      const event = await eventService.addParticipant(id, organizationId, participantId);

      return successResponse(res, event, 'Participant added successfully');
    } catch (error) {
      logger.error('Add participant error:', error);
      next(error);
    }
  }

  async removeParticipant(req, res, next) {
    try {
      const { organizationId } = req;
      const { id, participantId } = req.params;

      const event = await eventService.removeParticipant(id, organizationId, participantId);

      return successResponse(res, event, 'Participant removed successfully');
    } catch (error) {
      logger.error('Remove participant error:', error);
      next(error);
    }
  }

  async cancelEvent(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;
      const { reason } = req.body;

      const event = await eventService.cancelEvent(id, organizationId, reason);

      return successResponse(res, event, 'Event cancelled successfully');
    } catch (error) {
      logger.error('Cancel event error:', error);
      next(error);
    }
  }

  async getUpcomingEvents(req, res, next) {
    try {
      const { organizationId } = req;
      const { days = 7 } = req.query;

      const events = await eventService.getUpcomingEvents(organizationId, parseInt(days));

      return successResponse(res, events, 'Upcoming events retrieved successfully');
    } catch (error) {
      logger.error('Get upcoming events error:', error);
      next(error);
    }
  }

  async getEventsByType(req, res, next) {
    try {
      const { organizationId } = req;
      const { type } = req.params;
      const { startDate, endDate } = req.query;

      const events = await eventService.getEventsByType(
        organizationId,
        type,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      return successResponse(res, events, 'Events retrieved successfully');
    } catch (error) {
      logger.error('Get events by type error:', error);
      next(error);
    }
  }

  async getEventStats(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year } = req.query;

      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      const stats = await eventService.getEventStats(organizationId, currentMonth, currentYear);

      return successResponse(res, stats, 'Event stats retrieved successfully');
    } catch (error) {
      logger.error('Get event stats error:', error);
      next(error);
    }
  }
}

export default new EventController();