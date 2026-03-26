import Campaign from '../../models/Campaign.js';
import MarketingLead from '../../models/MarketingLead.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';
import mongoose from 'mongoose';

// Helper: Format channel name
const formatChannelName = (type) => {
  const names = {
    'google ads': 'Google Ads',
    'google': 'Google Ads',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'linkedin': 'LinkedIn',
    'billboard': 'Billboard',
    'event': 'Events',
    'events': 'Events',
    'email': 'Email Marketing',
    'sms': 'SMS Marketing',
    'referral': 'Referral',
    'organic': 'Organic',
    'other': 'Other'
  };
  return names[type?.toLowerCase()] || type || 'Other';
};

// Helper: Get channel key from source
const getChannelKeyFromSource = (source) => {
  const key = source?.toLowerCase() || 'other';
  const mapping = {
    'google ads': 'google ads',
    'google': 'google ads',
    'instagram': 'instagram',
    'facebook': 'facebook',
    'linkedin': 'linkedin',
    'billboard': 'billboard',
    'event': 'events',
    'events': 'events',
    'email': 'email',
    'sms': 'sms',
    'referral': 'referral',
    'organic': 'organic',
    'other': 'other'
  };
  return mapping[key] || 'other';
};

// Helper: Format currency
const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
};

class BudgetController {
  /**
   * Get budget and ROI statistics
   */
  async getBudgetStats(req, res, next) {
    try {
      const { organizationId } = req;

      // Get all campaigns for the organization
      const campaigns = await Campaign.find({
        organizationId: new mongoose.Types.ObjectId(organizationId)
      }).lean();

      // Calculate totals from campaigns
      let totalBudget = 0;
      let totalSpent = 0;
      let totalRevenue = 0;
      let activeChannels = new Set();

      // Channel-wise data aggregation
      const channelData = {};

      for (const campaign of campaigns) {
        const budget = campaign.budget || 0;
        const spent = campaign.spent || 0;
        const revenue = campaign.revenue || 0;

        totalBudget += budget;
        totalSpent += spent;
        totalRevenue += revenue;

        // Track active channels
        if (campaign.status === 'active') {
          activeChannels.add(campaign.channel || campaign.type);
        }

        // Aggregate by channel (use campaign.channel, not campaign.type)
        const channel = campaign.channel || campaign.type || 'other';
        const channelKey = getChannelKeyFromSource(channel);
        if (!channelData[channelKey]) {
          channelData[channelKey] = {
            channel: formatChannelName(channel),
            budget: 0,
            spent: 0,
            revenue: 0,
            leads: 0,
            conversions: 0
          };
        }
        channelData[channelKey].budget += budget;
        channelData[channelKey].spent += spent;
        channelData[channelKey].revenue += revenue;
      }

      // Get leads data for ROI calculation
      const leadsBySource = await MarketingLead.aggregate([
        {
          $match: { organizationId: new mongoose.Types.ObjectId(organizationId) }
        },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            converted: { $sum: { $cond: ['$isConverted', 1, 0] } },
            totalValue: { $sum: { $ifNull: ['$conversion.value', 0] } }
          }
        }
      ]);

      // Update channel data with leads info
      for (const leadSource of leadsBySource) {
        const source = leadSource._id || 'other';
        const channelKey = getChannelKeyFromSource(source);
        if (channelData[channelKey]) {
          channelData[channelKey].leads += leadSource.count;
          channelData[channelKey].conversions += leadSource.converted;
          channelData[channelKey].revenue += leadSource.totalValue;
        }
      }

      // Calculate ROI for each channel
      const budgetByChannel = Object.values(channelData).map(data => {
        const roi = data.spent > 0 ? Math.round(((data.revenue - data.spent) / data.spent) * 100) : 0;
        const roiDisplay = roi >= 0 ? `${roi}%` : `${roi}%`;
        const trend = roi >= 100 ? 'up' : roi >= 50 ? 'up' : 'down';

        return {
          channel: data.channel,
          budget: formatCurrency(data.budget),
          budgetRaw: data.budget,
          spent: formatCurrency(data.spent),
          spentRaw: data.spent,
          revenue: data.revenue,
          leads: data.leads,
          conversions: data.conversions,
          roi: roiDisplay,
          roiValue: roi,
          trend
        };
      });

      // If no campaigns, return default data
      if (budgetByChannel.length === 0) {
        budgetByChannel.push({
          channel: 'No Channels',
          budget: '₹0',
          budgetRaw: 0,
          spent: '₹0',
          spentRaw: 0,
          revenue: 0,
          leads: 0,
          conversions: 0,
          roi: '0%',
          roiValue: 0,
          trend: 'up'
        });
      }

      // Calculate average ROI
      const avgRoi = totalSpent > 0
        ? Math.round(((totalRevenue - totalSpent) / totalSpent) * 100)
        : 0;

      // Calculate budget utilization
      const utilization = totalBudget > 0
        ? Math.round((totalSpent / totalBudget) * 100)
        : 0;

      // Get active campaigns count
      const activeCampaignsCount = campaigns.filter(c => c.status === 'active').length;

      const result = {
        totalBudget,
        totalBudgetDisplay: formatCurrency(totalBudget),
        totalSpent,
        totalSpentDisplay: formatCurrency(totalSpent),
        utilization,
        averageRoi: avgRoi,
        activeChannels: activeChannels.size || campaigns.length,
        activeCampaigns: activeCampaignsCount,
        totalCampaigns: campaigns.length,
        totalRevenue,
        budgetByChannel
      };

      return successResponse(res, result, 'Budget statistics retrieved successfully');
    } catch (error) {
      logger.error('Get budget stats error:', error);
      next(error);
    }
  }

  /**
   * Get channel-wise ROI breakdown
   */
  async getChannelROI(req, res, next) {
    try {
      const { organizationId } = req;
      const { period = 'month' } = req.query;

      // Get campaigns with ROI data
      const campaigns = await Campaign.find({
        organizationId: new mongoose.Types.ObjectId(organizationId)
      }).lean();

      // Aggregate by channel
      const channelRoi = {};

      for (const campaign of campaigns) {
        const channel = campaign.channel || campaign.type || 'other';
        const channelKey = getChannelKeyFromSource(channel);

        if (!channelRoi[channelKey]) {
          channelRoi[channelKey] = {
            name: formatChannelName(channel),
            budget: 0,
            spent: 0,
            revenue: 0,
            leads: 0,
            conversions: 0,
            campaigns: 0
          };
        }

        channelRoi[channelKey].budget += campaign.budget || 0;
        channelRoi[channelKey].spent += campaign.spent || 0;
        channelRoi[channelKey].revenue += campaign.revenue || 0;
        channelRoi[channelKey].campaigns += 1;
      }

      // Get leads by source
      const leadsBySource = await MarketingLead.aggregate([
        {
          $match: { organizationId: new mongoose.Types.ObjectId(organizationId) }
        },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            converted: { $sum: { $cond: ['$isConverted', 1, 0] } },
            totalValue: { $sum: { $ifNull: ['$conversion.value', 0] } }
          }
        }
      ]);

      // Merge leads data
      for (const leadSource of leadsBySource) {
        const source = leadSource._id || 'other';
        const channelKey = getChannelKeyFromSource(source);
        if (channelRoi[channelKey]) {
          channelRoi[channelKey].leads += leadSource.count;
          channelRoi[channelKey].conversions += leadSource.converted;
          channelRoi[channelKey].revenue += leadSource.totalValue;
        }
      }

      // Calculate ROI and format response
      const result = Object.values(channelRoi).map(data => ({
        name: data.name,
        budget: data.budget,
        spent: data.spent,
        revenue: data.revenue,
        leads: data.leads,
        conversions: data.conversions,
        campaigns: data.campaigns,
        roi: data.spent > 0 ? Math.round(((data.revenue - data.spent) / data.spent) * 100) : 0,
        conversionRate: data.leads > 0 ? Math.round((data.conversions / data.leads) * 100) : 0
      }));

      return successResponse(res, result, 'Channel ROI retrieved successfully');
    } catch (error) {
      logger.error('Get channel ROI error:', error);
      next(error);
    }
  }
}

export default new BudgetController();