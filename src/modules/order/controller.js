import orderService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class OrderController {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await orderService.getDashboardStats(organizationId);

      return successResponse(res, stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      next(error);
    }
  }

  /**
   * Get pipeline data (orders grouped by stage)
   */
  async getPipeline(req, res, next) {
    try {
      const { organizationId } = req;
      const pipeline = await orderService.getPipelineData(organizationId);

      return successResponse(res, pipeline, 'Pipeline data retrieved successfully');
    } catch (error) {
      logger.error('Get pipeline error:', error);
      next(error);
    }
  }

  /**
   * Get delay alerts
   */
  async getDelayAlerts(req, res, next) {
    try {
      const { organizationId } = req;
      const alerts = await orderService.getDelayAlerts(organizationId);

      return successResponse(res, alerts, 'Delay alerts retrieved successfully');
    } catch (error) {
      logger.error('Get delay alerts error:', error);
      next(error);
    }
  }

  /**
   * Get KPI data
   */
  async getKPIData(req, res, next) {
    try {
      const { organizationId } = req;
      const kpiData = await orderService.getKPIData(organizationId);

      return successResponse(res, kpiData, 'KPI data retrieved successfully');
    } catch (error) {
      logger.error('Get KPI data error:', error);
      next(error);
    }
  }

  /**
   * Get dispatch tracking data
   */
  async getDispatchData(req, res, next) {
    try {
      const { organizationId } = req;
      const data = await orderService.getDispatchData(organizationId);

      return successResponse(res, data, 'Dispatch data retrieved successfully');
    } catch (error) {
      logger.error('Get dispatch data error:', error);
      next(error);
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(req, res, next) {
    try {
      const { organizationId } = req;
      const { limit } = req.query;
      const activity = await orderService.getRecentActivity(organizationId, parseInt(limit) || 10);

      return successResponse(res, activity, 'Recent activity retrieved successfully');
    } catch (error) {
      logger.error('Get recent activity error:', error);
      next(error);
    }
  }

  /**
   * Get all orders with filters and pagination
   */
  async getOrders(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status,
        trackingStatus: req.query.trackingStatus,
        orderType: req.query.orderType,
        stage: req.query.stage,
        assignedTeam: req.query.assignedTeam,
        supervisor: req.query.supervisor,
        search: req.query.search,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await orderService.getOrders(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.orders,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Orders retrieved successfully'
      );
    } catch (error) {
      logger.error('Get orders error:', error);
      next(error);
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(req, res, next) {
    try {
      const { organizationId } = req;
      const { status } = req.params;

      const validStatuses = ['new', 'in_production', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 'Invalid status', 400);
      }

      const orders = await orderService.getOrdersByStatus(organizationId, status);

      return successResponse(res, orders, `${status} orders retrieved successfully`);
    } catch (error) {
      logger.error('Get orders by status error:', error);
      next(error);
    }
  }

  /**
   * Get delayed orders
   */
  async getDelayedOrders(req, res, next) {
    try {
      const { organizationId } = req;
      const orders = await orderService.getDelayedOrders(organizationId);

      return successResponse(res, orders, 'Delayed orders retrieved successfully');
    } catch (error) {
      logger.error('Get delayed orders error:', error);
      next(error);
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(req, res, next) {
    try {
      const { organizationId } = req;
      const order = await orderService.getOrderById(req.params.id, organizationId);

      if (!order) {
        return notFoundResponse(res, 'Order');
      }

      return successResponse(res, order, 'Order retrieved successfully');
    } catch (error) {
      logger.error('Get order error:', error);
      next(error);
    }
  }

  /**
   * Create order
   */
  async createOrder(req, res, next) {
    try {
      const { organizationId, user } = req;
      const order = await orderService.createOrder(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Order created: ${order.orderId} by user ${user._id}`);

      return createdResponse(res, order, 'Order created successfully');
    } catch (error) {
      logger.error('Create order error:', error);
      next(error);
    }
  }

  /**
   * Update order
   */
  async updateOrder(req, res, next) {
    try {
      const { organizationId, user } = req;
      const order = await orderService.updateOrder(
        req.params.id,
        organizationId,
        req.body,
        user._id
      );

      if (!order) {
        return notFoundResponse(res, 'Order');
      }

      return successResponse(res, order, 'Order updated successfully');
    } catch (error) {
      logger.error('Update order error:', error);
      next(error);
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { status } = req.body;

      const validStatuses = ['new', 'in_production', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 'Invalid status', 400);
      }

      const order = await orderService.updateOrderStatus(
        req.params.id,
        organizationId,
        status,
        user._id
      );

      if (!order) {
        return notFoundResponse(res, 'Order');
      }

      return successResponse(res, order, 'Order status updated successfully');
    } catch (error) {
      logger.error('Update order status error:', error);
      next(error);
    }
  }

  /**
   * Advance order to next stage
   */
  async advanceStage(req, res, next) {
    try {
      const { organizationId, user } = req;
      const order = await orderService.advanceStage(
        req.params.id,
        organizationId,
        user._id
      );

      if (!order) {
        return notFoundResponse(res, 'Order');
      }

      return successResponse(res, order, 'Order advanced to next stage successfully');
    } catch (error) {
      logger.error('Advance stage error:', error);
      next(error);
    }
  }

  /**
   * Update order stage
   */
  async updateOrderStage(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { stage } = req.body;

      const validStages = [
        'Material Received',
        'Vendor Purchase',
        'Hardware Purchase',
        'IT Team Planning',
        'Delivery',
        'Installation Start',
        'Rework',
        'Quality Check',
        'Final',
        'Handover'
      ];

      if (!stage || !validStages.includes(stage)) {
        return errorResponse(res, 'Invalid stage', 400);
      }

      const order = await orderService.updateOrderStage(
        req.params.id,
        organizationId,
        stage,
        user._id
      );

      if (!order) {
        return notFoundResponse(res, 'Order');
      }

      return successResponse(res, order, 'Order stage updated successfully');
    } catch (error) {
      logger.error('Update order stage error:', error);
      next(error);
    }
  }

  /**
   * Mark order as delayed
   */
  async markAsDelayed(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { delayDays, delayReason } = req.body;

      if (delayDays === undefined || delayDays < 0) {
        return errorResponse(res, 'Valid delay days required', 400);
      }

      const order = await orderService.markAsDelayed(
        req.params.id,
        organizationId,
        delayDays,
        delayReason,
        user._id
      );

      if (!order) {
        return notFoundResponse(res, 'Order');
      }

      return successResponse(res, order, 'Order marked as delayed successfully');
    } catch (error) {
      logger.error('Mark as delayed error:', error);
      next(error);
    }
  }

  /**
   * Add customer review
   */
  async addCustomerReview(req, res, next) {
    try {
      const { organizationId } = req;
      const { rating, review } = req.body;

      if (rating < 1 || rating > 5) {
        return errorResponse(res, 'Rating must be between 1 and 5', 400);
      }

      const order = await orderService.addCustomerReview(
        req.params.id,
        organizationId,
        rating,
        review
      );

      if (!order) {
        return notFoundResponse(res, 'Order');
      }

      return successResponse(res, order, 'Review added successfully');
    } catch (error) {
      logger.error('Add customer review error:', error);
      next(error);
    }
  }

  /**
   * Delete order
   */
  async deleteOrder(req, res, next) {
    try {
      const { organizationId } = req;
      const order = await orderService.deleteOrder(req.params.id, organizationId);

      if (!order) {
        return notFoundResponse(res, 'Order');
      }

      return successResponse(res, null, 'Order deleted successfully');
    } catch (error) {
      logger.error('Delete order error:', error);
      next(error);
    }
  }

  /**
   * Get teams
   */
  async getTeams(req, res, next) {
    try {
      const teams = orderService.getTeams();
      return successResponse(res, teams, 'Teams retrieved successfully');
    } catch (error) {
      logger.error('Get teams error:', error);
      next(error);
    }
  }

  /**
   * Get stage mappings
   */
  async getStageMappings(req, res, next) {
    try {
      const { orderType } = req.query;
      const mappings = orderService.getStageMappings(orderType || 'FM');
      return successResponse(res, mappings, 'Stage mappings retrieved successfully');
    } catch (error) {
      logger.error('Get stage mappings error:', error);
      next(error);
    }
  }

  /**
   * Get production stages
   */
  async getProductionStages(req, res, next) {
    try {
      return successResponse(res, orderService.constructor.PRODUCTION_STAGES, 'Production stages retrieved successfully');
    } catch (error) {
      logger.error('Get production stages error:', error);
      next(error);
    }
  }

  /**
   * Get stage-wise statistics
   */
  async getStageWiseStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await orderService.getStageWiseStats(organizationId);
      return successResponse(res, stats, 'Stage-wise stats retrieved successfully');
    } catch (error) {
      logger.error('Get stage-wise stats error:', error);
      next(error);
    }
  }

  /**
   * Get statistics by date range
   */
  async getStatsByDateRange(req, res, next) {
    try {
      const { organizationId } = req;
      const { startDate, endDate } = req.query;
      const stats = await orderService.getStatsByDateRange(organizationId, startDate, endDate);
      return successResponse(res, stats, 'Stats retrieved successfully');
    } catch (error) {
      logger.error('Get stats by date range error:', error);
      next(error);
    }
  }
}

export default new OrderController();