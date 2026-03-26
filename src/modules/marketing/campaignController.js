import Campaign from '../../models/Campaign.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';
import mongoose from 'mongoose';

class CampaignController {
  /**
   * Get all campaigns with pagination and filters
   */
  async getCampaigns(req, res, next) {
    try {
      const { organizationId } = req;
      const { page = 1, limit = 10, status, type, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const match = { organizationId: new mongoose.Types.ObjectId(organizationId) };

      // Apply filters
      if (status && status !== 'all') {
        match.status = status.toLowerCase();
      }

      if (type && type !== 'all') {
        match.type = type.toLowerCase();
      }

      if (search) {
        match.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { channel: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [campaigns, total] = await Promise.all([
        Campaign.find(match)
          .populate('assignedTo', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Campaign.countDocuments(match)
      ]);

      // Transform data for frontend
      const transformedCampaigns = campaigns.map(campaign => ({
        _id: campaign._id,
        name: campaign.name,
        type: campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1),
        status: campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1),
        budget: campaign.budget,
        spent: campaign.spent,
        leads: campaign.leads?.total || 0,
        roi: campaign.roi || 0,
        conversionRate: campaign.conversionRate || 0,
        startDate: campaign.startDate?.toISOString().split('T')[0] || '',
        endDate: campaign.endDate?.toISOString().split('T')[0] || '',
        location: campaign.location || '',
        channel: campaign.channel || '',
        description: campaign.description || '',
        targetAudience: campaign.targetAudience || '',
        assignedTo: campaign.assignedTo,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt
      }));

      return paginatedResponse(res, transformedCampaigns, parseInt(page), parseInt(limit), total, 'Campaigns retrieved successfully');
    } catch (error) {
      logger.error('Get campaigns error:', error);
      next(error);
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid campaign ID', 400);
      }

      const campaign = await Campaign.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      })
        .populate('assignedTo', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .lean();

      if (!campaign) {
        return errorResponse(res, 'Campaign not found', 404);
      }

      return successResponse(res, campaign, 'Campaign retrieved successfully');
    } catch (error) {
      logger.error('Get campaign by ID error:', error);
      next(error);
    }
  }

  /**
   * Create new campaign
   */
  async createCampaign(req, res, next) {
    try {
      const { organizationId } = req;
      const userId = req.user._id;

      const {
        name,
        type,
        channel,
        status = 'draft',
        description,
        startDate,
        endDate,
        budget = 0,
        spent = 0,
        location,
        vendor,
        trackingMethod,
        targetAudience,
        targetLocation,
        assignedTo
      } = req.body;

      // Validate required fields
      if (!name || !type || !channel || !startDate) {
        return errorResponse(res, 'Name, type, channel, and start date are required', 400);
      }

      // Validate type
      if (!['online', 'offline'].includes(type.toLowerCase())) {
        return errorResponse(res, 'Type must be either online or offline', 400);
      }

      // Create campaign
      const campaign = new Campaign({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        name,
        type: type.toLowerCase(),
        channel,
        status: status?.toLowerCase() || 'draft',
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budget: Number(budget) || 0,
        spent: Number(spent) || 0,
        location,
        vendor,
        trackingMethod,
        targetAudience,
        targetLocation,
        assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null,
        createdBy: new mongoose.Types.ObjectId(userId),
        leads: { total: 0, qualified: 0, converted: 0 },
        roi: 0,
        conversionRate: 0,
        costPerLead: 0
      });

      await campaign.save();

      logger.info(`Campaign created: ${campaign._id} by user ${userId}`);

      return successResponse(res, campaign, 'Campaign created successfully', 201);
    } catch (error) {
      logger.error('Create campaign error:', error);
      next(error);
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid campaign ID', 400);
      }

      const campaign = await Campaign.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      });

      if (!campaign) {
        return errorResponse(res, 'Campaign not found', 404);
      }

      const updateFields = [
        'name', 'type', 'channel', 'status', 'description',
        'startDate', 'endDate', 'budget', 'spent', 'location',
        'vendor', 'trackingMethod', 'targetAudience', 'targetLocation', 'assignedTo'
      ];

      const updates = {};
      updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (field === 'type' || field === 'status') {
            updates[field] = req.body[field].toLowerCase();
          } else if (field === 'startDate' || field === 'endDate') {
            updates[field] = req.body[field] ? new Date(req.body[field]) : null;
          } else if (field === 'budget' || field === 'spent') {
            updates[field] = Number(req.body[field]) || 0;
          } else if (field === 'assignedTo') {
            updates[field] = req.body[field] ? new mongoose.Types.ObjectId(req.body[field]) : null;
          } else {
            updates[field] = req.body[field];
          }
        }
      });

      Object.assign(campaign, updates);
      await campaign.save();

      logger.info(`Campaign updated: ${campaign._id}`);

      return successResponse(res, campaign, 'Campaign updated successfully');
    } catch (error) {
      logger.error('Update campaign error:', error);
      next(error);
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid campaign ID', 400);
      }

      const campaign = await Campaign.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      });

      if (!campaign) {
        return errorResponse(res, 'Campaign not found', 404);
      }

      logger.info(`Campaign deleted: ${id}`);

      return successResponse(res, null, 'Campaign deleted successfully');
    } catch (error) {
      logger.error('Delete campaign error:', error);
      next(error);
    }
  }

  /**
   * Update campaign leads (for internal use or manual update)
   */
  async updateCampaignLeads(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;
      const { total, qualified, converted } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid campaign ID', 400);
      }

      const campaign = await Campaign.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      });

      if (!campaign) {
        return errorResponse(res, 'Campaign not found', 404);
      }

      if (total !== undefined) campaign.leads.total = total;
      if (qualified !== undefined) campaign.leads.qualified = qualified;
      if (converted !== undefined) campaign.leads.converted = converted;

      // Recalculate conversion rate
      campaign.calculateConversionRate();

      await campaign.save();

      return successResponse(res, campaign, 'Campaign leads updated successfully');
    } catch (error) {
      logger.error('Update campaign leads error:', error);
      next(error);
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(req, res, next) {
    try {
      const { organizationId } = req;

      const stats = await Campaign.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: null,
            totalCampaigns: { $sum: 1 },
            activeCampaigns: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            completedCampaigns: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalBudget: { $sum: '$budget' },
            totalSpent: { $sum: '$spent' },
            totalLeads: { $sum: '$leads.total' },
            avgROI: { $avg: '$roi' }
          }
        }
      ]);

      const result = stats[0] || {
        totalCampaigns: 0,
        activeCampaigns: 0,
        completedCampaigns: 0,
        totalBudget: 0,
        totalSpent: 0,
        totalLeads: 0,
        avgROI: 0
      };

      return successResponse(res, result, 'Campaign statistics retrieved successfully');
    } catch (error) {
      logger.error('Get campaign stats error:', error);
      next(error);
    }
  }
}

export default new CampaignController();