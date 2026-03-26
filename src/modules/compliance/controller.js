import complianceService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class ComplianceController {
  async getComplianceItems(req, res, next) {
    try {
      const { organizationId } = req;
      const { category, status, priority, assignedTo, dueBefore, dueAfter, page, limit } = req.query;

      const result = await complianceService.getComplianceItems(organizationId, {
        category, status, priority, assignedTo, dueBefore, dueAfter
      }, { page: parseInt(page) || 1, limit: parseInt(limit) || 20 });

      return paginatedResponse(
        res,
        result.items,
        parseInt(page) || 1,
        parseInt(limit) || 20,
        result.pagination.total,
        'Compliance items retrieved successfully'
      );
    } catch (error) {
      logger.error('Get compliance items error:', error);
      next(error);
    }
  }

  async getComplianceItemById(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const item = await complianceService.getComplianceItemById(id, organizationId);

      if (!item) {
        return notFoundResponse(res, 'Compliance item');
      }

      return successResponse(res, item, 'Compliance item retrieved successfully');
    } catch (error) {
      logger.error('Get compliance item error:', error);
      next(error);
    }
  }

  async createComplianceItem(req, res, next) {
    try {
      const { organizationId, user } = req;

      const item = await complianceService.createComplianceItem({
        ...req.body,
        organizationId,
        createdBy: user._id
      });

      logger.info(`Compliance item created: ${item.itemId} by user ${user._id}`);

      return createdResponse(res, item, 'Compliance item created successfully');
    } catch (error) {
      logger.error('Create compliance item error:', error);
      next(error);
    }
  }

  async updateComplianceItem(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;

      const item = await complianceService.updateComplianceItem(id, organizationId, {
        ...req.body,
        updatedBy: user._id
      });

      if (!item) {
        return notFoundResponse(res, 'Compliance item');
      }

      return successResponse(res, item, 'Compliance item updated successfully');
    } catch (error) {
      logger.error('Update compliance item error:', error);
      next(error);
    }
  }

  async deleteComplianceItem(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const item = await complianceService.deleteComplianceItem(id, organizationId);

      if (!item) {
        return notFoundResponse(res, 'Compliance item');
      }

      return successResponse(res, null, 'Compliance item deleted successfully');
    } catch (error) {
      logger.error('Delete compliance item error:', error);
      next(error);
    }
  }

  async getUpcomingItems(req, res, next) {
    try {
      const { organizationId } = req;
      const { days = 30 } = req.query;

      const items = await complianceService.getUpcomingItems(organizationId, parseInt(days));

      return successResponse(res, items, 'Upcoming compliance items retrieved successfully');
    } catch (error) {
      logger.error('Get upcoming items error:', error);
      next(error);
    }
  }

  async getOverdueItems(req, res, next) {
    try {
      const { organizationId } = req;

      const items = await complianceService.getOverdueItems(organizationId);

      return successResponse(res, items, 'Overdue compliance items retrieved successfully');
    } catch (error) {
      logger.error('Get overdue items error:', error);
      next(error);
    }
  }

  async getItemsByCategory(req, res, next) {
    try {
      const { organizationId } = req;
      const { category } = req.params;

      const items = await complianceService.getItemsByCategory(organizationId, category);

      return successResponse(res, items, 'Compliance items retrieved successfully');
    } catch (error) {
      logger.error('Get items by category error:', error);
      next(error);
    }
  }

  async completeItem(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { notes } = req.body;

      const item = await complianceService.completeItem(id, organizationId, user._id, notes);

      return successResponse(res, item, 'Compliance item completed successfully');
    } catch (error) {
      logger.error('Complete item error:', error);
      next(error);
    }
  }

  async reopenItem(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { id } = req.params;
      const { reason } = req.body;

      const item = await complianceService.reopenItem(id, organizationId, user._id, reason);

      return successResponse(res, item, 'Compliance item reopened successfully');
    } catch (error) {
      logger.error('Reopen item error:', error);
      next(error);
    }
  }

  async addDocument(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;
      const { name, url, type, size } = req.body;

      const item = await complianceService.addDocument(id, organizationId, {
        name, url, type, size
      });

      return successResponse(res, item, 'Document added successfully');
    } catch (error) {
      logger.error('Add document error:', error);
      next(error);
    }
  }

  async removeDocument(req, res, next) {
    try {
      const { organizationId } = req;
      const { id, documentName } = req.params;

      const item = await complianceService.removeDocument(id, organizationId, documentName);

      return successResponse(res, item, 'Document removed successfully');
    } catch (error) {
      logger.error('Remove document error:', error);
      next(error);
    }
  }

  async completeRequirement(req, res, next) {
    try {
      const { organizationId } = req;
      const { id, requirementIndex } = req.params;

      const item = await complianceService.completeRequirement(id, organizationId, parseInt(requirementIndex));

      return successResponse(res, item, 'Requirement completed successfully');
    } catch (error) {
      logger.error('Complete requirement error:', error);
      next(error);
    }
  }

  async getComplianceSummary(req, res, next) {
    try {
      const { organizationId } = req;

      const summary = await complianceService.getComplianceSummary(organizationId);

      return successResponse(res, summary, 'Compliance summary retrieved successfully');
    } catch (error) {
      logger.error('Get compliance summary error:', error);
      next(error);
    }
  }

  async getComplianceCalendar(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year } = req.query;

      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      const calendar = await complianceService.getComplianceCalendar(organizationId, currentMonth, currentYear);

      return successResponse(res, calendar, 'Compliance calendar retrieved successfully');
    } catch (error) {
      logger.error('Get compliance calendar error:', error);
      next(error);
    }
  }

  async getItemsByAssignee(req, res, next) {
    try {
      const { assigneeId } = req.params;

      const items = await complianceService.getItemsByAssignee(assigneeId);

      return successResponse(res, items, 'Assigned compliance items retrieved successfully');
    } catch (error) {
      logger.error('Get items by assignee error:', error);
      next(error);
    }
  }
}

export default new ComplianceController();