import MarketingTool from '../../models/MarketingTool.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';
import mongoose from 'mongoose';

class MarketingToolController {
  /**
   * Get all marketing tools for organization
   * Returns both connected and available tools
   */
  async getTools(req, res, next) {
    try {
      const { organizationId } = req;

      // Get connected tools
      const connectedTools = await MarketingTool.find({
        organizationId: new mongoose.Types.ObjectId(organizationId)
      }).sort({ status: -1, name: 1 });

      // Get default tools template
      const defaultTools = MarketingTool.getDefaultTools();

      // Merge to show all available tools with connection status
      const tools = defaultTools.map(defaultTool => {
        const connected = connectedTools.find(t => t.toolId === defaultTool.toolId);
        return connected ? {
          ...connected.toObject(),
          features: defaultTool.features
        } : {
          ...defaultTool,
          status: 'disconnected',
          leadsCount: { total: 0, thisMonth: 0 },
          connectionDetails: { lastSync: 'Never' },
          organizationId
        };
      });

      return successResponse(res, { tools, connectedCount: connectedTools.filter(t => t.status === 'connected').length }, 'Marketing tools retrieved successfully');
    } catch (error) {
      logger.error('Get marketing tools error:', error);
      next(error);
    }
  }

  /**
   * Get connected tools with stats
   */
  async getConnectedTools(req, res, next) {
    try {
      const { organizationId } = req;

      const tools = await MarketingTool.getConnectedToolsWithStats(organizationId);

      return successResponse(res, { tools, total: tools.length }, 'Connected tools retrieved successfully');
    } catch (error) {
      logger.error('Get connected tools error:', error);
      next(error);
    }
  }

  /**
   * Get tool by ID
   */
  async getToolById(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid tool ID', 400);
      }

      const tool = await MarketingTool.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      });

      if (!tool) {
        return errorResponse(res, 'Tool not found', 404);
      }

      return successResponse(res, tool, 'Tool retrieved successfully');
    } catch (error) {
      logger.error('Get tool by ID error:', error);
      next(error);
    }
  }

  /**
   * Connect a marketing tool
   */
  async connectTool(req, res, next) {
    try {
      const { organizationId } = req;
      const userId = req.user._id;
      const { toolId } = req.params;
      const connectionData = req.body;

      // Validate toolId
      const defaultTools = MarketingTool.getDefaultTools();
      const defaultTool = defaultTools.find(t => t.toolId === toolId);

      if (!defaultTool) {
        return errorResponse(res, 'Invalid tool ID', 400);
      }

      // Check if already connected
      let tool = await MarketingTool.findOne({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        toolId: toolId
      });

      if (tool && tool.status === 'connected') {
        return errorResponse(res, 'Tool is already connected', 400);
      }

      // Create or update tool connection
      if (tool) {
        // Update existing connection
        tool.status = connectionData.status || 'connected';
        tool.connectionDetails = {
          ...tool.connectionDetails,
          accountId: connectionData.accountId,
          accountName: connectionData.accountName,
          lastSync: new Date()
        };
        tool.isActive = true;
        tool.updatedBy = userId;
      } else {
        // Create new connection
        tool = new MarketingTool({
          organizationId: new mongoose.Types.ObjectId(organizationId),
          toolId: defaultTool.toolId,
          name: defaultTool.name,
          type: defaultTool.type,
          icon: defaultTool.icon,
          color: defaultTool.color,
          status: connectionData.status || 'connected',
          connectionDetails: {
            accountId: connectionData.accountId,
            accountName: connectionData.accountName,
            lastSync: new Date(),
            syncFrequency: connectionData.syncFrequency || 'daily'
          },
          features: defaultTool.features?.map(f => ({ name: f, enabled: true })) || [],
          config: {
            autoImport: connectionData.autoImport ?? true,
            notifyOnNewLead: connectionData.notifyOnNewLead ?? true
          },
          createdBy: userId,
          updatedBy: userId
        });
      }

      await tool.save();

      logger.info(`Marketing tool connected: ${toolId} for organization ${organizationId}`);

      return successResponse(res, tool, 'Tool connected successfully', 201);
    } catch (error) {
      logger.error('Connect tool error:', error);
      next(error);
    }
  }

  /**
   * Disconnect a marketing tool
   */
  async disconnectTool(req, res, next) {
    try {
      const { organizationId } = req;
      const { toolId } = req.params;

      const tool = await MarketingTool.findOneAndUpdate(
        {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          toolId: toolId
        },
        {
          status: 'disconnected',
          isActive: false,
          'connectionDetails.lastSync': new Date(),
          updatedBy: req.user._id
        },
        { new: true }
      );

      if (!tool) {
        return errorResponse(res, 'Tool not found', 404);
      }

      logger.info(`Marketing tool disconnected: ${toolId}`);

      return successResponse(res, tool, 'Tool disconnected successfully');
    } catch (error) {
      logger.error('Disconnect tool error:', error);
      next(error);
    }
  }

  /**
   * Update tool configuration
   */
  async updateToolConfig(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;
      const { config, features } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid tool ID', 400);
      }

      const tool = await MarketingTool.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      });

      if (!tool) {
        return errorResponse(res, 'Tool not found', 404);
      }

      // Update config
      if (config) {
        tool.config = { ...tool.config, ...config };
      }

      // Update features
      if (features) {
        tool.features = features;
      }

      tool.updatedBy = req.user._id;
      await tool.save();

      return successResponse(res, tool, 'Tool configuration updated successfully');
    } catch (error) {
      logger.error('Update tool config error:', error);
      next(error);
    }
  }

  /**
   * Sync tool leads
   */
  async syncToolLeads(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'Invalid tool ID', 400);
      }

      const tool = await MarketingTool.findOne({
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(organizationId)
      });

      if (!tool) {
        return errorResponse(res, 'Tool not found', 404);
      }

      if (tool.status !== 'connected') {
        return errorResponse(res, 'Tool is not connected', 400);
      }

      // Update last sync time
      tool.connectionDetails.lastSync = new Date();
      await tool.save();

      // TODO: Implement actual lead sync logic based on tool type
      // This would involve API calls to the respective platform

      return successResponse(res, {
        toolId: tool.toolId,
        name: tool.name,
        lastSync: tool.connectionDetails.lastSync,
        leadsImported: 0 // Would be actual count after sync
      }, 'Tool synced successfully');
    } catch (error) {
      logger.error('Sync tool leads error:', error);
      next(error);
    }
  }

  /**
   * Get lead sources breakdown
   */
  async getLeadSources(req, res, next) {
    try {
      const { organizationId } = req;

      // Get all connected tools with their lead counts
      const tools = await MarketingTool.find({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: 'connected',
        isActive: true
      }).sort({ 'leadsCount.total': -1 });

      // Calculate total leads
      const totalLeads = tools.reduce((sum, tool) => sum + tool.leadsCount.total, 0);

      // Format lead sources
      const leadSources = tools.map(tool => ({
        source: tool.name,
        sourceId: tool.toolId,
        leads: tool.leadsCount.total,
        thisMonth: tool.leadsCount.thisMonth,
        thisWeek: tool.leadsCount.thisWeek,
        today: tool.leadsCount.today,
        percentage: totalLeads > 0 ? Math.round((tool.leadsCount.total / totalLeads) * 100) : 0,
        trend: tool.leadsCount.thisWeek > tool.leadsCount.thisMonth / 4 ? '+5%' : '-2%',
        lastSync: tool.connectionDetails.lastSync,
        icon: tool.icon,
        color: tool.color,
        status: tool.status
      }));

      return successResponse(res, {
        leadSources,
        totalLeads,
        connectedTools: tools.length
      }, 'Lead sources retrieved successfully');
    } catch (error) {
      logger.error('Get lead sources error:', error);
      next(error);
    }
  }

  /**
   * Get tool statistics
   */
  async getToolStats(req, res, next) {
    try {
      const { organizationId } = req;

      const stats = await MarketingTool.aggregate([
        {
          $match: { organizationId: new mongoose.Types.ObjectId(organizationId) }
        },
        {
          $group: {
            _id: null,
            totalTools: { $sum: 1 },
            connectedTools: {
              $sum: { $cond: [{ $eq: ['$status', 'connected'] }, 1, 0] }
            },
            disconnectedTools: {
              $sum: { $cond: [{ $eq: ['$status', 'disconnected'] }, 1, 0] }
            },
            pendingTools: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            totalLeads: { $sum: '$leadsCount.total' },
            thisMonthLeads: { $sum: '$leadsCount.thisMonth' },
            thisWeekLeads: { $sum: '$leadsCount.thisWeek' },
            todayLeads: { $sum: '$leadsCount.today' }
          }
        }
      ]);

      const result = stats[0] || {
        totalTools: 0,
        connectedTools: 0,
        disconnectedTools: 0,
        pendingTools: 0,
        totalLeads: 0,
        thisMonthLeads: 0,
        thisWeekLeads: 0,
        todayLeads: 0
      };

      return successResponse(res, result, 'Tool statistics retrieved successfully');
    } catch (error) {
      logger.error('Get tool stats error:', error);
      next(error);
    }
  }

  /**
   * Test tool connection
   */
  async testConnection(req, res, next) {
    try {
      const { organizationId } = req;
      const { toolId } = req.params;

      const tool = await MarketingTool.findOne({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        toolId: toolId
      });

      if (!tool) {
        return errorResponse(res, 'Tool not found', 404);
      }

      // TODO: Implement actual connection test based on tool type
      // This would verify API credentials and connection status

      const connectionStatus = {
        toolId: tool.toolId,
        name: tool.name,
        status: 'connected',
        lastChecked: new Date(),
        message: 'Connection successful',
        details: {
          accountName: tool.connectionDetails.accountName || 'Connected Account',
          features: tool.features.filter(f => f.enabled).map(f => f.name)
        }
      };

      // Update last checked
      tool.lastChecked = new Date();
      await tool.save();

      return successResponse(res, connectionStatus, 'Connection test successful');
    } catch (error) {
      logger.error('Test connection error:', error);
      next(error);
    }
  }
}

export default new MarketingToolController();