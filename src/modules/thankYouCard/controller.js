import thankYouCardService from './service.js';
import Employee from '../../models/Employee.js';
import { successResponse, createdResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class ThankYouCardController {
  /**
   * Get all employees list (for selecting recipient)
   */
  async getEmployees(req, res, next) {
    try {
      const { organizationId } = req;
      const { search, department } = req.query;

      const query = { organizationId, status: 'active' };

      if (department && department !== 'all') {
        query['employment.department'] = new RegExp(department, 'i');
      }

      let employees = await Employee.find(query)
        .select('personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
        .sort({ 'personalInfo.firstName': 1 });

      // Filter by search term
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        employees = employees.filter(emp =>
          searchRegex.test(`${emp.personalInfo?.firstName} ${emp.personalInfo?.lastName}`) ||
          searchRegex.test(emp.employeeId) ||
          searchRegex.test(emp.employment?.department)
        );
      }

      // Remove current user from list
      const currentUserId = req.user?._id;
      employees = employees.filter(emp => emp.userId?.toString() !== currentUserId?.toString());

      return successResponse(res, employees, 'Employees retrieved successfully');
    } catch (error) {
      logger.error('Get employees error:', error);
      next(error);
    }
  }

  /**
   * Get card templates
   */
  async getCardTemplates(req, res, next) {
    try {
      const templates = thankYouCardService.getCardTemplates();
      return successResponse(res, templates, 'Card templates retrieved successfully');
    } catch (error) {
      logger.error('Get card templates error:', error);
      next(error);
    }
  }

  /**
   * Send a thank you card
   */
  async sendCard(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { receiverId, cardType, title, message, tags, isPublic } = req.body;

      // Get sender employee ID
      const employee = await Employee.findOne({ userId: user._id, organizationId });
      if (!employee) {
        return errorResponse(res, 'Employee record not found', 404);
      }

      const card = await thankYouCardService.sendCard(organizationId, employee._id, {
        receiverId,
        cardType,
        title,
        message,
        tags,
        isPublic
      });

      return createdResponse(res, card, 'Thank you card sent successfully');
    } catch (error) {
      logger.error('Send thank you card error:', error);
      next(error);
    }
  }

  /**
   * Get cards sent by current user
   */
  async getSentCards(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { page, limit } = req.query;

      const employee = await Employee.findOne({ userId: user._id, organizationId });
      if (!employee) {
        return errorResponse(res, 'Employee record not found', 404);
      }

      const result = await thankYouCardService.getSentCards(employee._id, organizationId, { page, limit });
      return successResponse(res, result, 'Sent cards retrieved successfully');
    } catch (error) {
      logger.error('Get sent cards error:', error);
      next(error);
    }
  }

  /**
   * Get cards received by current user
   */
  async getReceivedCards(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { page, limit, unreadOnly } = req.query;

      const employee = await Employee.findOne({ userId: user._id, organizationId });
      if (!employee) {
        return errorResponse(res, 'Employee record not found', 404);
      }

      const result = await thankYouCardService.getReceivedCards(employee._id, organizationId, {
        page,
        limit,
        unreadOnly: unreadOnly === 'true'
      });
      return successResponse(res, result, 'Received cards retrieved successfully');
    } catch (error) {
      logger.error('Get received cards error:', error);
      next(error);
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(req, res, next) {
    try {
      const { organizationId, user } = req;

      const employee = await Employee.findOne({ userId: user._id, organizationId });
      if (!employee) {
        return errorResponse(res, 'Employee record not found', 404);
      }

      const count = await thankYouCardService.getUnreadCount(employee._id, organizationId);
      return successResponse(res, { count }, 'Unread count retrieved successfully');
    } catch (error) {
      logger.error('Get unread count error:', error);
      next(error);
    }
  }

  /**
   * Mark card as read
   */
  async markAsRead(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;

      const employee = await Employee.findOne({ userId: user._id, organizationId });
      if (!employee) {
        return errorResponse(res, 'Employee record not found', 404);
      }

      const card = await thankYouCardService.markAsRead(id, employee._id);
      return successResponse(res, card, 'Card marked as read');
    } catch (error) {
      logger.error('Mark as read error:', error);
      next(error);
    }
  }

  /**
   * Get top receivers (for leaderboard)
   */
  async getTopReceivers(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year, limit } = req.query;

      const topReceivers = await thankYouCardService.getTopReceivers(
        organizationId,
        month ? parseInt(month) : null,
        year ? parseInt(year) : null,
        limit ? parseInt(limit) : 10
      );

      return successResponse(res, topReceivers, 'Top receivers retrieved successfully');
    } catch (error) {
      logger.error('Get top receivers error:', error);
      next(error);
    }
  }

  /**
   * Get card statistics (admin view)
   */
  async getCardStats(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year } = req.query;

      const stats = await thankYouCardService.getCardStats(
        organizationId,
        month ? parseInt(month) : null,
        year ? parseInt(year) : null
      );

      return successResponse(res, stats, 'Card statistics retrieved successfully');
    } catch (error) {
      logger.error('Get card stats error:', error);
      next(error);
    }
  }

  /**
   * Get all cards (admin view)
   */
  async getAllCards(req, res, next) {
    try {
      const { organizationId } = req;
      const { page, limit, month, year, cardType } = req.query;

      const result = await thankYouCardService.getAllCards(organizationId, {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        month,
        year,
        cardType
      });

      return successResponse(res, result, 'Cards retrieved successfully');
    } catch (error) {
      logger.error('Get all cards error:', error);
      next(error);
    }
  }

  /**
   * Delete a card
   */
  async deleteCard(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;

      const employee = await Employee.findOne({ userId: user._id, organizationId });
      if (!employee) {
        return errorResponse(res, 'Employee record not found', 404);
      }

      const result = await thankYouCardService.deleteCard(id, employee._id, organizationId);
      return successResponse(res, result, 'Card deleted successfully');
    } catch (error) {
      logger.error('Delete card error:', error);
      next(error);
    }
  }
}

export default new ThankYouCardController();