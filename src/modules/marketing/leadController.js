import MarketingLead from '../../models/MarketingLead.js';
import SalesLead from '../../models/SalesLead.js';
import Campaign from '../../models/Campaign.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';
import mongoose from 'mongoose';

class LeadController {
  /**
   * Get all leads with pagination and filters
   */
  async getLeads(req, res, next) {
    try {
      const { organizationId } = req;
      const { page = 1, limit = 20, status, source, campaignId, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const match = { organizationId: new mongoose.Types.ObjectId(organizationId) };

      // Apply filters
      if (status && status !== 'all') {
        match.status = status.toLowerCase();
      }

      if (source && source !== 'all') {
        match.source = source.toLowerCase();
      }

      if (campaignId && campaignId !== 'all') {
        match.campaignId = new mongoose.Types.ObjectId(campaignId);
      }

      if (search) {
        match.$or = [
          { 'name.first': { $regex: search, $options: 'i' } },
          { 'name.last': { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [leads, total] = await Promise.all([
        MarketingLead.find(match)
          .populate('campaignId', 'name type status')
          .populate('assignedTo', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        MarketingLead.countDocuments(match)
      ]);

      // Transform data for frontend
      const transformedLeads = leads.map(lead => ({
        _id: lead._id,
        name: `${lead.name?.first || ''} ${lead.name?.last || ''}`.trim(),
        firstName: lead.name?.first || '',
        lastName: lead.name?.last || '',
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        sourceDetail: lead.sourceDetail,
        campaign: lead.campaignId?.name || 'N/A',
        campaignId: lead.campaignId?._id,
        campaignType: lead.campaignId?.type,
        status: lead.status,
        statusDisplay: lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1),
        priority: lead.priority,
        score: lead.score,
        company: lead.interest?.product || '',
        location: '',
        notes: lead.interest?.notes || lead.followUpNotes || '',
        value: lead.conversion?.value ? `₹${lead.conversion.value.toLocaleString('en-IN')}` : 'N/A',
        conversionValue: lead.conversion?.value || 0,
        lastContact: lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : 'N/A',
        nextFollowUp: lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString() : 'N/A',
        isConverted: lead.isConverted,
        assignedTo: lead.assignedTo,
        tags: lead.tags,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      }));

      return paginatedResponse(res, transformedLeads, parseInt(page), parseInt(limit), total, 'Leads retrieved successfully');
    } catch (error) {
      logger.error('Get leads error:', error);
      next(error);
    }
  }

  /**
   * Get lead by ID
   */
  async getLeadById(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid lead ID', 400);
      }

      const lead = await MarketingLead.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      })
        .populate('campaignId', 'name type status budget spent')
        .populate('assignedTo', 'firstName lastName email')
        .lean();

      if (!lead) {
        return errorResponse(res, 'Lead not found', 404);
      }

      // Transform for frontend
      const transformedLead = {
        _id: lead._id,
        name: `${lead.name?.first || ''} ${lead.name?.last || ''}`.trim(),
        firstName: lead.name?.first || '',
        lastName: lead.name?.last || '',
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        sourceDetail: lead.sourceDetail,
        campaign: lead.campaignId,
        status: lead.status,
        priority: lead.priority,
        score: lead.score,
        interest: lead.interest,
        company: lead.interest?.product || '',
        notes: lead.interest?.notes || lead.followUpNotes || '',
        value: lead.conversion?.value || 0,
        lastContact: lead.lastContactDate,
        nextFollowUp: lead.nextFollowUp,
        isConverted: lead.isConverted,
        assignedTo: lead.assignedTo,
        tags: lead.tags,
        utm: lead.utm,
        conversion: lead.conversion,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      };

      return successResponse(res, transformedLead, 'Lead retrieved successfully');
    } catch (error) {
      logger.error('Get lead by ID error:', error);
      next(error);
    }
  }

  /**
   * Create new lead
   */
  async createLead(req, res, next) {
    try {
      const { organizationId } = req;
      const userId = req.user._id;

      const {
        firstName,
        lastName,
        email,
        phone,
        source,
        sourceDetail,
        campaignId,
        status = 'new',
        priority = 'medium',
        score = 0,
        product,
        budget,
        timeline,
        notes,
        assignedTo
      } = req.body;

      // Validate required fields
      if (!firstName || !email) {
        return errorResponse(res, 'First name and email are required', 400);
      }

      // Check if lead with same email exists
      const existingLead = await MarketingLead.findOne({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        email: email.toLowerCase()
      });

      if (existingLead) {
        return errorResponse(res, 'A lead with this email already exists', 400);
      }

      const lead = new MarketingLead({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        name: {
          first: firstName,
          last: lastName || ''
        },
        email: email.toLowerCase(),
        phone: phone || '',
        source: source?.toLowerCase() || 'organic',
        sourceDetail: sourceDetail || '',
        campaignId: campaignId ? new mongoose.Types.ObjectId(campaignId) : null,
        status: status?.toLowerCase() || 'new',
        priority: priority?.toLowerCase() || 'medium',
        score: score || 0,
        interest: {
          product: product || '',
          budget: budget || '',
          timeline: timeline || '',
          notes: notes || ''
        },
        assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null,
        createdBy: new mongoose.Types.ObjectId(userId),
        followUpNotes: notes || '',
        lastContactDate: new Date()
      });

      await lead.save();

      logger.info(`Lead created: ${lead._id} by user ${userId}`);

      return successResponse(res, lead, 'Lead created successfully', 201);
    } catch (error) {
      logger.error('Create lead error:', error);
      next(error);
    }
  }

  /**
   * Update lead
   */
  async updateLead(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid lead ID', 400);
      }

      const lead = await MarketingLead.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      });

      if (!lead) {
        return errorResponse(res, 'Lead not found', 404);
      }

      const updateFields = [
        'firstName', 'lastName', 'email', 'phone', 'source', 'sourceDetail',
        'campaignId', 'status', 'priority', 'score', 'product', 'budget',
        'timeline', 'notes', 'assignedTo', 'lastContactDate', 'nextFollowUp', 'followUpNotes'
      ];

      const updates = {};
      updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
          switch (field) {
            case 'firstName':
              lead.name = lead.name || {};
              lead.name.first = req.body[field];
              break;
            case 'lastName':
              lead.name = lead.name || {};
              lead.name.last = req.body[field];
              break;
            case 'email':
              lead.email = req.body[field].toLowerCase();
              break;
            case 'source':
            case 'status':
            case 'priority':
              lead[field] = req.body[field].toLowerCase();
              break;
            case 'campaignId':
            case 'assignedTo':
              lead[field] = req.body[field] ? new mongoose.Types.ObjectId(req.body[field]) : null;
              break;
            case 'product':
            case 'budget':
            case 'timeline':
            case 'notes':
              lead.interest = lead.interest || {};
              lead.interest[field] = req.body[field];
              break;
            case 'lastContactDate':
            case 'nextFollowUp':
              lead[field] = req.body[field] ? new Date(req.body[field]) : null;
              break;
            default:
              lead[field] = req.body[field];
          }
        }
      });

      // Handle status change to converted
      if (req.body.status?.toLowerCase() === 'converted' && lead.status !== 'converted') {
        lead.isConverted = true;
        lead.conversion = lead.conversion || {};
        lead.conversion.date = new Date();
        if (req.body.conversionValue) {
          lead.conversion.value = Number(req.body.conversionValue);
        }
      }

      await lead.save();

      logger.info(`Lead updated: ${lead._id}`);

      return successResponse(res, lead, 'Lead updated successfully');
    } catch (error) {
      logger.error('Update lead error:', error);
      next(error);
    }
  }

  /**
   * Delete lead
   */
  async deleteLead(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid lead ID', 400);
      }

      const lead = await MarketingLead.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      });

      if (!lead) {
        return errorResponse(res, 'Lead not found', 404);
      }

      logger.info(`Lead deleted: ${id}`);

      return successResponse(res, null, 'Lead deleted successfully');
    } catch (error) {
      logger.error('Delete lead error:', error);
      next(error);
    }
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(req, res, next) {
    try {
      const { organizationId } = req;

      const stats = await MarketingLead.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            newLeads: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
            contacted: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
            qualified: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
            proposal: { $sum: { $cond: [{ $eq: ['$status', 'proposal'] }, 1, 0] } },
            negotiation: { $sum: { $cond: [{ $eq: ['$status', 'negotiation'] }, 1, 0] } },
            converted: { $sum: { $cond: ['$isConverted', 1, 0] } },
            lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
            totalValue: { $sum: { $ifNull: ['$conversion.value', 0] } },
            avgScore: { $avg: '$score' }
          }
        }
      ]);

      // Get leads by source
      const leadsBySource = await MarketingLead.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            converted: { $sum: { $cond: ['$isConverted', 1, 0] } }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Get leads this week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const leadsThisWeek = await MarketingLead.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        createdAt: { $gte: startOfWeek }
      });

      // Get leads this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const leadsThisMonth = await MarketingLead.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        createdAt: { $gte: startOfMonth }
      });

      const result = {
        total: stats[0]?.totalLeads || 0,
        new: stats[0]?.newLeads || 0,
        contacted: stats[0]?.contacted || 0,
        qualified: stats[0]?.qualified || 0,
        proposal: stats[0]?.proposal || 0,
        negotiation: stats[0]?.negotiation || 0,
        converted: stats[0]?.converted || 0,
        lost: stats[0]?.lost || 0,
        totalValue: stats[0]?.totalValue || 0,
        avgScore: Math.round(stats[0]?.avgScore || 0),
        leadsThisWeek,
        leadsThisMonth,
        leadsBySource
      };

      return successResponse(res, result, 'Lead statistics retrieved successfully');
    } catch (error) {
      logger.error('Get lead stats error:', error);
      next(error);
    }
  }

  /**
   * Bulk create leads (for CSV upload)
   */
  async bulkCreateLeads(req, res, next) {
    try {
      const { organizationId } = req;
      const userId = req.user._id;
      const { leads } = req.body;

      if (!Array.isArray(leads) || leads.length === 0) {
        return errorResponse(res, 'Leads array is required', 400);
      }

      const createdLeads = [];
      const errors = [];

      for (let i = 0; i < leads.length; i++) {
        const leadData = leads[i];
        try {
          // Check for duplicate email
          const existing = await MarketingLead.findOne({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            email: leadData.email?.toLowerCase()
          });

          if (existing) {
            errors.push({ row: i + 1, email: leadData.email, error: 'Email already exists' });
            continue;
          }

          const lead = new MarketingLead({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            name: {
              first: leadData.firstName || leadData.name?.split(' ')[0] || '',
              last: leadData.lastName || leadData.name?.split(' ').slice(1).join(' ') || ''
            },
            email: leadData.email?.toLowerCase(),
            phone: leadData.phone || '',
            source: leadData.source?.toLowerCase() || 'organic',
            campaignId: leadData.campaignId ? new mongoose.Types.ObjectId(leadData.campaignId) : null,
            status: leadData.status?.toLowerCase() || 'new',
            priority: leadData.priority?.toLowerCase() || 'medium',
            interest: {
              product: leadData.product || leadData.company || '',
              notes: leadData.notes || ''
            },
            assignedTo: leadData.assignedTo ? new mongoose.Types.ObjectId(leadData.assignedTo) : null,
            createdBy: new mongoose.Types.ObjectId(userId)
          });

          await lead.save();
          createdLeads.push(lead);
        } catch (err) {
          errors.push({ row: i + 1, error: err.message });
        }
      }

      logger.info(`Bulk created ${createdLeads.length} leads for organization ${organizationId}`);

      return successResponse(res, {
        created: createdLeads.length,
        failed: errors.length,
        errors,
        leads: createdLeads
      }, `Successfully imported ${createdLeads.length} leads`, 201);
    } catch (error) {
      logger.error('Bulk create leads error:', error);
      next(error);
    }
  }

  /**
   * Get convertible leads (qualified leads ready for sales)
   */
  async getConvertibleLeads(req, res, next) {
    try {
      const { organizationId } = req;

      const leads = await MarketingLead.find({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: { $in: ['qualified', 'proposal', 'negotiation'] },
        isConverted: false
      })
        .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
        .sort({ createdAt: -1 })
        .lean();

      const transformedLeads = leads.map(lead => ({
        id: lead._id,
        name: `${lead.name?.first || ''} ${lead.name?.last || ''}`.trim(),
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        priority: lead.priority,
        source: lead.source,
        score: lead.score,
        value: lead.conversion?.value || 0,
        assignedTo: lead.assignedToName || (lead.assignedTo?.personalInfo ?
          `${lead.assignedTo.personalInfo.firstName} ${lead.assignedTo.personalInfo.lastName}` : null),
        createdAt: lead.createdAt
      }));

      return successResponse(res, transformedLeads, 'Convertible leads retrieved successfully');
    } catch (error) {
      logger.error('Get convertible leads error:', error);
      next(error);
    }
  }

  /**
   * Convert lead to SalesLead (seamless marketing → sales pipeline)
   */
  async convertLead(req, res, next) {
    try {
      const { organizationId } = req;
      const userId = req.user._id;
      const { id } = req.params;
      const {
        title,
        company,
        value,
        priority,
        assignedTo,
        assignedToName,
        expectedCloseDate,
        notes
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid lead ID', 400);
      }

      const marketingLead = await MarketingLead.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      });

      if (!marketingLead) {
        return errorResponse(res, 'Marketing lead not found', 404);
      }

      if (marketingLead.isConverted) {
        return errorResponse(res, 'Lead already converted to sales', 400);
      }

      // Only qualified or later stage leads can be converted
      if (!['qualified', 'proposal', 'negotiation'].includes(marketingLead.status)) {
        return errorResponse(res, 'Lead must be qualified before converting to sales pipeline', 400);
      }

      // Map marketing source to sales source
      const sourceMapping = {
        'online': 'Website',
        'offline': 'Other',
        'referral': 'Referral',
        'organic': 'Website',
        'paid': 'Google Ads',
        'social': 'Social Media',
        'email': 'Email Campaign',
        'other': 'Other'
      };

      // Map marketing priority to sales priority
      const priorityMap = {
        'hot': 'High',
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low'
      };

      // Create SalesLead from MarketingLead
      const salesLeadData = {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        title: title || `Lead: ${marketingLead.name?.first || ''} ${marketingLead.name?.last || ''} - ${marketingLead.email.split('@')[0]}`,
        client: `${marketingLead.name?.first || ''} ${marketingLead.name?.last || ''}`.trim() || marketingLead.email.split('@')[0],
        company: company || '',
        value: value || marketingLead.conversion?.value || 0,
        probability: '10%',
        stage: 'Marketing Lead Generation',
        leadType: 'new',
        source: sourceMapping[marketingLead.source] || 'Website',
        priority: priority || priorityMap[marketingLead.priority] || 'Medium',
        contact: {
          name: `${marketingLead.name?.first || ''} ${marketingLead.name?.last || ''}`.trim(),
          email: marketingLead.email,
          phone: marketingLead.phone || ''
        },
        description: marketingLead.interest?.notes || '',
        notes: notes || `Converted from Marketing Lead. Campaign: ${marketingLead.campaignId || 'N/A'}`,
        sourceMarketingLeadId: marketingLead._id,
        assignedTo: assignedTo || marketingLead.assignedTo,
        assignedToName: assignedToName || marketingLead.assignedToName,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        createdBy: new mongoose.Types.ObjectId(userId)
      };

      if (expectedCloseDate) {
        salesLeadData.expectedCloseDate = new Date(expectedCloseDate);
      }

      const salesLead = await SalesLead.create(salesLeadData);

      // Mark MarketingLead as converted
      marketingLead.isConverted = true;
      marketingLead.convertedToSalesLeadId = salesLead._id;
      marketingLead.convertedAt = new Date();
      marketingLead.convertedBy = new mongoose.Types.ObjectId(userId);
      marketingLead.status = 'converted';
      await marketingLead.save();

      logger.info(`Marketing lead ${id} converted to SalesLead ${salesLead._id} by user ${userId}`);

      return successResponse(res, {
        marketingLead: {
          id: marketingLead._id,
          status: marketingLead.status,
          isConverted: marketingLead.isConverted
        },
        salesLead: {
          id: salesLead._id,
          title: salesLead.title,
          client: salesLead.client,
          stage: salesLead.stage,
          value: salesLead.value
        }
      }, 'Lead successfully converted to sales pipeline', 201);
    } catch (error) {
      logger.error('Convert lead error:', error);
      next(error);
    }
  }

  /**
   * Assign lead to employee
   */
  async assignLead(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;
      const { assignedTo } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid lead ID', 400);
      }

      if (!assignedTo) {
        return errorResponse(res, 'Employee ID is required', 400);
      }

      // Get employee name
      const Employee = mongoose.model('Employee');
      const employee = await Employee.findById(assignedTo).select('personalInfo.firstName personalInfo.lastName');

      if (!employee) {
        return errorResponse(res, 'Employee not found', 404);
      }

      const lead = await MarketingLead.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), organizationId: new mongoose.Types.ObjectId(organizationId) },
        {
          $set: {
            assignedTo: new mongoose.Types.ObjectId(assignedTo),
            assignedToName: `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim()
          }
        },
        { new: true }
      );

      if (!lead) {
        return errorResponse(res, 'Lead not found', 404);
      }

      logger.info(`Lead ${id} assigned to ${assignedTo}`);

      return successResponse(res, lead, 'Lead assigned successfully');
    } catch (error) {
      logger.error('Assign lead error:', error);
      next(error);
    }
  }

  /**
   * Unassign lead from employee
   */
  async unassignLead(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid lead ID', 400);
      }

      const lead = await MarketingLead.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), organizationId: new mongoose.Types.ObjectId(organizationId) },
        { $unset: { assignedTo: 1, assignedToName: 1 } },
        { new: true }
      );

      if (!lead) {
        return errorResponse(res, 'Lead not found', 404);
      }

      logger.info(`Lead ${id} unassigned`);

      return successResponse(res, lead, 'Lead unassigned successfully');
    } catch (error) {
      logger.error('Unassign lead error:', error);
      next(error);
    }
  }
}

export default new LeadController();