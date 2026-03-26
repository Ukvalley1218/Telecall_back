import Campaign from '../../models/Campaign.js';
import MarketingLead from '../../models/MarketingLead.js';
import mongoose from 'mongoose';

class MarketingService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(organizationId) {
    // Get campaign stats
    const campaignStats = await Campaign.getDashboardStats(organizationId);

    // Get lead stats
    const leadStats = await this.getLeadStats(organizationId);

    // Get previous period stats for comparison
    const previousPeriodStats = await this.getPreviousPeriodStats(organizationId);

    // Calculate trends
    const activeCampaignsTrend = this.calculateTrend(
      campaignStats.activeCampaigns,
      previousPeriodStats.activeCampaigns
    );

    const leadsTrend = this.calculateTrend(
      leadStats.total,
      previousPeriodStats.totalLeads
    );

    const conversionTrend = this.calculateTrend(
      leadStats.conversionRate,
      previousPeriodStats.conversionRate
    );

    const roiTrend = this.calculateTrend(
      campaignStats.avgROI || 0,
      previousPeriodStats.avgROI
    );

    return {
      stats: {
        activeCampaigns: {
          value: campaignStats.activeCampaigns,
          total: campaignStats.totalCampaigns,
          trend: activeCampaignsTrend,
          trendLabel: 'vs last month'
        },
        totalLeads: {
          value: leadStats.total,
          trend: leadsTrend,
          trendLabel: 'vs last month'
        },
        conversionRate: {
          value: `${leadStats.conversionRate.toFixed(1)}%`,
          trend: conversionTrend,
          trendLabel: 'vs last month'
        },
        marketingROI: {
          value: `${Math.round(campaignStats.avgROI || 0)}%`,
          trend: roiTrend,
          trendLabel: 'vs last month'
        }
      },
      campaignStats,
      leadStats
    };
  }

  /**
   * Get lead generation data for charts
   */
  async getLeadGenerationData(organizationId, period = 'week', startDate, endDate) {
    const match = { organizationId: new mongoose.Types.ObjectId(organizationId) };

    // Set default date range if not provided
    if (!startDate || !endDate) {
      const now = new Date();
      endDate = now.toISOString().split('T')[0];
      const start = new Date(now);
      start.setDate(start.getDate() - 28); // Last 4 weeks
      startDate = start.toISOString().split('T')[0];
    }

    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };

    // Group by period
    let dateFormat;
    let labelPrefix;
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        labelPrefix = '';
        break;
      case 'week':
      default:
        dateFormat = '%Y-W%V';
        labelPrefix = 'Week ';
    }

    const leads = await MarketingLead.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            sourceType: {
              $cond: {
                if: { $in: ['$source', ['online', 'social', 'email', 'paid', 'organic']] },
                then: 'Online',
                else: 'Offline'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.period',
          Online: {
            $sum: {
              $cond: [{ $eq: ['$_id.sourceType', 'Online'] }, '$count', 0]
            }
          },
          Offline: {
            $sum: {
              $cond: [{ $eq: ['$_id.sourceType', 'Offline'] }, '$count', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 10 }
    ]);

    // Format data for chart
    const data = leads.map((item, index) => ({
      name: period === 'week' ? `Week ${index + 1}` : item._id,
      Offline: item.Offline || 0,
      Online: item.Online || 0
    }));

    // If no data, return sample structure
    if (data.length === 0) {
      return {
        data: [
          { name: 'Week 1', Offline: 0, Online: 0 },
          { name: 'Week 2', Offline: 0, Online: 0 },
          { name: 'Week 3', Offline: 0, Online: 0 },
          { name: 'Week 4', Offline: 0, Online: 0 }
        ],
        period,
        startDate,
        endDate
      };
    }

    return { data, period, startDate, endDate };
  }

  /**
   * Get campaign ROI data for charts
   */
  async getCampaignROIData(organizationId, limit = 5) {
    const campaigns = await Campaign.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          status: { $ne: 'cancelled' }
        }
      },
      { $sort: { roi: -1 } },
      { $limit: limit },
      {
        $project: {
          name: 1,
          roi: 1,
          type: 1,
          status: 1,
          leads: '$leads.total',
          budget: 1,
          spent: 1
        }
      }
    ]);

    // Format data for chart
    const data = campaigns.map(campaign => ({
      name: campaign.name,
      roi: campaign.roi || 0,
      type: campaign.type,
      status: campaign.status,
      leads: campaign.leads || 0
    }));

    // If no data, return empty structure
    if (data.length === 0) {
      return {
        data: [
          { name: 'No campaigns', roi: 0 }
        ]
      };
    }

    return { data };
  }

  /**
   * Get recent campaign activity
   */
  async getRecentActivity(organizationId, limit = 5) {
    const campaigns = await Campaign.find({ organizationId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('name status leads.total type updatedAt')
      .lean();

    const activities = campaigns.map(campaign => ({
      id: campaign._id,
      name: campaign.name,
      leads: campaign.leads?.total || 0,
      status: this.formatStatus(campaign.status),
      type: campaign.type,
      updatedAt: campaign.updatedAt
    }));

    return { activities, total: await Campaign.countDocuments({ organizationId }) };
  }

  /**
   * Get campaign comparison data
   */
  async getCampaignComparison(organizationId) {
    const comparison = await Campaign.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          status: { $in: ['active', 'completed'] }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalLeads: { $sum: '$leads.total' },
          totalBudget: { $sum: '$budget' },
          totalSpent: { $sum: '$spent' },
          avgROI: { $avg: '$roi' }
        }
      }
    ]);

    return comparison;
  }

  /**
   * Get leads by source breakdown
   */
  async getLeadsBySource(organizationId, startDate, endDate) {
    const leads = await MarketingLead.getLeadsBySource(organizationId, startDate, endDate);
    return leads;
  }

  /**
   * Get lead stats
   */
  async getLeadStats(organizationId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = await MarketingLead.aggregate([
      {
        $match: { organizationId: new mongoose.Types.ObjectId(organizationId) }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: {
            $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
          },
          qualified: {
            $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] }
          },
          converted: {
            $sum: { $cond: [{ $eq: ['$isConverted', true] }, 1, 0] }
          },
          thisMonth: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, new: 0, qualified: 0, converted: 0, thisMonth: 0 };
    result.conversionRate = result.total > 0 ? (result.converted / result.total) * 100 : 0;

    return result;
  }

  /**
   * Get previous period stats for trend calculation
   */
  async getPreviousPeriodStats(organizationId) {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const campaigns = await Campaign.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      {
        $group: {
          _id: null,
          activeCampaigns: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          avgROI: { $avg: '$roi' }
        }
      }
    ]);

    const leads = await MarketingLead.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          conversionRate: {
            $avg: {
              $cond: [{ $eq: ['$isConverted', true] }, 100, 0]
            }
          }
        }
      }
    ]);

    return {
      activeCampaigns: campaigns[0]?.activeCampaigns || 0,
      avgROI: campaigns[0]?.avgROI || 0,
      totalLeads: leads[0]?.totalLeads || 0,
      conversionRate: leads[0]?.conversionRate || 0
    };
  }

  /**
   * Calculate trend percentage
   */
  calculateTrend(current, previous) {
    if (!previous || previous === 0) {
      return current > 0 ? '+100' : '0';
    }
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${Math.round(change)}`;
  }

  /**
   * Format status for display
   */
  formatStatus(status) {
    const statusMap = {
      draft: 'Draft',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
  }

  /**
   * Convert a qualified MarketingLead to SalesLead
   * This creates a seamless pipeline from marketing to sales
   */
  async convertToSalesLead(marketingLeadId, organizationId, convertedBy, additionalData = {}) {
    const marketingLead = await MarketingLead.findOne({
      _id: marketingLeadId,
      organizationId,
      isConverted: false
    });

    if (!marketingLead) {
      throw new Error('Marketing lead not found or already converted');
    }

    // Only qualified or proposal stage leads can be converted
    if (!['qualified', 'proposal', 'negotiation'].includes(marketingLead.status)) {
      throw new Error('Lead must be qualified before conversion');
    }

    // Create SalesLead from MarketingLead
    const SalesLead = (await import('../../models/SalesLead.js')).default;

    const salesLeadData = {
      organizationId,
      title: additionalData.title || `Lead: ${marketingLead.fullName || marketingLead.email}`,
      client: marketingLead.fullName || marketingLead.email.split('@')[0],
      company: additionalData.company || '',
      email: marketingLead.email,
      phone: marketingLead.phone || '',
      value: additionalData.value || marketingLead.conversion?.value || 0,
      stage: 'Marketing Lead Generation',
      source: this.mapMarketingSourceToSalesSource(marketingLead.source),
      leadType: 'new',
      priority: this.mapMarketingPriorityToSalesPriority(marketingLead.priority),
      contact: {
        name: marketingLead.fullName,
        email: marketingLead.email,
        phone: marketingLead.phone
      },
      description: marketingLead.interest?.notes || '',
      notes: `Converted from Marketing Lead. Campaign: ${marketingLead.campaignId || 'N/A'}`,
      sourceMarketingLeadId: marketingLeadId,
      assignedTo: marketingLead.assignedTo,
      assignedToName: marketingLead.assignedToName,
      createdBy: convertedBy
    };

    const salesLead = await SalesLead.create(salesLeadData);

    // Mark MarketingLead as converted
    marketingLead.isConverted = true;
    marketingLead.convertedToSalesLeadId = salesLead._id;
    marketingLead.convertedAt = new Date();
    marketingLead.convertedBy = convertedBy;
    await marketingLead.save();

    return {
      marketingLead: {
        id: marketingLead._id,
        status: marketingLead.status,
        isConverted: marketingLead.isConverted
      },
      salesLead: {
        id: salesLead._id,
        title: salesLead.title,
        client: salesLead.client,
        stage: salesLead.stage
      }
    };
  }

  /**
   * Get marketing leads eligible for conversion (qualified but not yet converted)
   */
  async getConvertibleLeads(organizationId) {
    const leads = await MarketingLead.find({
      organizationId,
      status: { $in: ['qualified', 'proposal', 'negotiation'] },
      isConverted: false
    })
    .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
    .sort({ createdAt: -1 })
    .lean();

    return leads.map(lead => ({
      id: lead._id,
      name: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      priority: lead.priority,
      source: lead.source,
      score: lead.score,
      assignedTo: lead.assignedToName || (lead.assignedTo?.personalInfo ?
        `${lead.assignedTo.personalInfo.firstName} ${lead.assignedTo.personalInfo.lastName}` : null),
      createdAt: lead.createdAt
    }));
  }

  /**
   * Map marketing source to sales source
   */
  mapMarketingSourceToSalesSource(marketingSource) {
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
    return sourceMapping[marketingSource] || 'Website';
  }

  /**
   * Map marketing priority to sales priority
   */
  mapMarketingPriorityToSalesPriority(marketingPriority) {
    const priorityMap = {
      'hot': 'High',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    return priorityMap[marketingPriority] || 'Medium';
  }
}

export default new MarketingService();