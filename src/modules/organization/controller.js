import Organization from '../../models/Organization.js';
import { successResponse, notFoundResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class OrganizationController {
  /**
   * Get organization details
   */
  async getOrganization(req, res, next) {
    try {
      const organizationId = req.organizationId;

      const organization = await Organization.findById(organizationId);

      if (!organization) {
        return notFoundResponse(res, 'Organization');
      }

      return successResponse(res, organization, 'Organization retrieved successfully');
    } catch (error) {
      logger.error('Get organization error:', error);
      next(error);
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(req, res, next) {
    try {
      const organizationId = req.organizationId;
      const update = {};

      if (req.body.name !== undefined) update.name = req.body.name;
      if (req.body.settings !== undefined) {
        update.settings = req.body.settings;
      }
      if (req.body.contactDetails !== undefined) {
        update.contactDetails = req.body.contactDetails;
      }

      const organization = await Organization.findByIdAndUpdate(
        organizationId,
        { $set: update },
        { new: true, runValidators: true }
      );

      if (!organization) {
        return notFoundResponse(res, 'Organization');
      }

      return successResponse(res, organization, 'Organization updated successfully');
    } catch (error) {
      logger.error('Update organization error:', error);
      next(error);
    }
  }

  /**
   * Check if organization can add employees
   */
  async canAddEmployee(req, res, next) {
    try {
      const organizationId = req.organizationId;

      const organization = await Organization.findById(organizationId);

      if (!organization) {
        return notFoundResponse(res, 'Organization');
      }

      const Employee = (await import('../../models/Employee.js')).default;
      const currentCount = await Employee.countDocuments({
        organizationId,
        status: 'active'
      });

      const canAdd = await organization.canAddEmployee();

      return successResponse(res, {
        canAdd,
        currentCount,
        maxEmployees: organization.maxEmployees,
        remaining: organization.maxEmployees - currentCount
      }, 'Employee limit check completed');
    } catch (error) {
      logger.error('Can add employee check error:', error);
      next(error);
    }
  }
}

export default new OrganizationController();