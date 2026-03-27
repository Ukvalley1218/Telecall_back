import Order from '../../models/Order.js';
import mongoose from 'mongoose';

class OrderService {
  // Production Stages
  static PRODUCTION_STAGES = [
    { id: 1, name: 'Material Received', color: '#3B82F6' },
    { id: 2, name: 'Vendor Purchase', color: '#8B5CF6' },
    { id: 3, name: 'Hardware Purchase', color: '#EC4899' },
    { id: 4, name: 'IT Team Planning', color: '#F59E0B' },
    { id: 5, name: 'Delivery', color: '#10B981' },
    { id: 6, name: 'Installation Start', color: '#6366F1' },
    { id: 7, name: 'Rework', color: '#14B8A6' },
    { id: 8, name: 'Quality Check', color: '#F97316' },
    { id: 9, name: 'Final', color: '#84CC16' },
    { id: 10, name: 'Handover', color: '#22C55E' }
  ];

  // FM (Factory Made) Stage Mapping
  static FM_STAGE_MAPPING = {
    'Material Received': ['Material Inspection', 'Quality Verification', 'Inventory Update'],
    'Vendor Purchase': ['Vendor Selection', 'PO Generation', 'Payment Processing'],
    'Hardware Purchase': ['Hardware List Finalization', 'Procurement', 'Quality Check'],
    'IT Team Planning': ['Design Review', 'Production Planning', 'Resource Allocation'],
    'Delivery': ['Packing', 'Dispatch', 'Transportation'],
    'Installation Start': ['Site Preparation', 'Installation', 'Testing'],
    'Rework': ['Issue Identification', 'Correction', 'Re-verification'],
    'Quality Check': ['Visual Inspection', 'Dimensional Check', 'Functionality Test'],
    'Final': ['Final Touch', 'Documentation', 'Client Preview'],
    'Handover': ['Client Walkthrough', 'Training', 'Handover Sign-off']
  };

  // HM (Hand Made) Stage Mapping
  static HM_STAGE_MAPPING = {
    'Material Received': ['Material Check', 'Supervisor Verification', 'Storage'],
    'Vendor Purchase': ['Vendor Contact', 'Order Placement', 'Material Receipt'],
    'Hardware Purchase': ['Hardware List', 'Purchase', 'Verification'],
    'IT Team Planning': ['Design Briefing', 'Team Allocation', 'Site Survey'],
    'Delivery': ['Material Transport', 'Site Delivery', 'Inventory Check'],
    'Installation Start': ['Carpenter Briefing', 'On-site Work', 'Assembly'],
    'Rework': ['Client Feedback', 'Modifications', 'Final Adjustments'],
    'Quality Check': ['Supervisor Check', 'Client Preview', 'QC Approval'],
    'Final': ['Polishing', 'Final Touch', 'Cleaning'],
    'Handover': ['Client Approval', 'Payment Collection', 'Feedback']
  };

  // Teams
  static TEAMS = [
    { id: 1, name: 'Team Alpha', lead: 'Rahul Sharma', type: 'FM' },
    { id: 2, name: 'Team Beta', lead: 'Priya Patel', type: 'HM' },
    { id: 3, name: 'Team Gamma', lead: 'Amit Kumar', type: 'FM' },
    { id: 4, name: 'Team Delta', lead: 'Sneha Reddy', type: 'HM' },
    { id: 5, name: 'Team Omega', lead: 'Vikram Singh', type: 'FM' }
  ];

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(organizationId) {
    const [
      totalOrders,
      newOrders,
      inProductionOrders,
      completedOrders,
      delayedOrders,
      onTrackOrders,
      fmOrders,
      hmOrders,
      nearCompletionOrders,
      stageWiseStats
    ] = await Promise.all([
      Order.countDocuments({ organizationId }),
      Order.countDocuments({ organizationId, status: 'new' }),
      Order.countDocuments({ organizationId, status: 'in_production' }),
      Order.countDocuments({ organizationId, status: 'completed' }),
      Order.countDocuments({ organizationId, trackingStatus: 'delayed' }),
      Order.countDocuments({ organizationId, trackingStatus: 'on_track' }),
      Order.countDocuments({ organizationId, orderType: 'FM' }),
      Order.countDocuments({ organizationId, orderType: 'HM' }),
      Order.countDocuments({ organizationId, completion: { $gte: 70 } }),
      this.getStageWiseStats(organizationId)
    ]);

    const completionRate = totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

    return {
      total: totalOrders,
      newOrders,
      inProduction: inProductionOrders,
      completed: completedOrders,
      delayed: delayedOrders,
      onTrack: onTrackOrders,
      fmOrders,
      hmOrders,
      nearCompletion: nearCompletionOrders,
      completionRate,
      stageWiseStats
    };
  }

  /**
   * Get stage-wise statistics
   */
  async getStageWiseStats(organizationId) {
    const stats = await Order.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: '$currentStage',
          count: { $sum: 1 },
          fmCount: {
            $sum: { $cond: [{ $eq: ['$orderType', 'FM'] }, 1, 0] }
          },
          hmCount: {
            $sum: { $cond: [{ $eq: ['$orderType', 'HM'] }, 1, 0] }
          },
          delayedCount: {
            $sum: { $cond: [{ $eq: ['$trackingStatus', 'delayed'] }, 1, 0] }
          },
          avgCompletion: { $avg: '$completion' }
        }
      }
    ]);

    return OrderService.PRODUCTION_STAGES.map(stage => {
      const stageStat = stats.find(s => s._id === stage.name) || {};
      return {
        ...stage,
        orders: stageStat.count || 0,
        fmCount: stageStat.fmCount || 0,
        hmCount: stageStat.hmCount || 0,
        delayedCount: stageStat.delayedCount || 0,
        avgCompletion: Math.round(stageStat.avgCompletion || 0)
      };
    });
  }

  /**
   * Get all orders with filtering and pagination
   */
  async getOrders(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Tracking status filter
    if (filters.trackingStatus && filters.trackingStatus !== 'all') {
      query.trackingStatus = filters.trackingStatus;
    }

    // Order type filter
    if (filters.orderType && filters.orderType !== 'all') {
      query.orderType = filters.orderType;
    }

    // Stage filter
    if (filters.stage && filters.stage !== 'all') {
      query.currentStage = filters.stage;
    }

    // Assigned team filter
    if (filters.assignedTeam && filters.assignedTeam !== 'all') {
      query.assignedTeam = filters.assignedTeam;
    }

    // Supervisor filter
    if (filters.supervisor && filters.supervisor !== 'all') {
      query.supervisor = filters.supervisor;
    }

    // Search filter
    if (filters.search) {
      query.$or = [
        { orderId: new RegExp(filters.search, 'i') },
        { 'customer.name': new RegExp(filters.search, 'i') },
        { 'product.name': new RegExp(filters.search, 'i') }
      ];
    }

    // Date range filter
    if (filters.startDate && filters.endDate) {
      query.orderDate = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('supervisorId', 'personalInfo.firstName personalInfo.lastName')
      .populate('createdBy', 'profile.firstName profile.lastName');

    const total = await Order.countDocuments(query);

    return {
      orders: orders.map(order => this.formatOrder(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(organizationId, status) {
    const orders = await Order.find({ organizationId, status })
      .sort({ createdAt: -1 })
      .populate('supervisorId', 'personalInfo.firstName personalInfo.lastName');

    return orders.map(order => this.formatOrder(order));
  }

  /**
   * Get delayed orders
   */
  async getDelayedOrders(organizationId) {
    const orders = await Order.find({
      organizationId,
      trackingStatus: 'delayed'
    })
      .sort({ delayDays: -1 })
      .populate('supervisorId', 'personalInfo.firstName personalInfo.lastName');

    return orders.map(order => this.formatOrder(order));
  }

  /**
   * Get order by ID
   */
  async getOrderById(id, organizationId) {
    const order = await Order.findOne({ _id: id, organizationId })
      .populate('supervisorId', 'personalInfo.firstName personalInfo.lastName')
      .populate('createdBy', 'profile.firstName profile.lastName');

    return order ? this.formatOrder(order) : null;
  }

  /**
   * Create order
   */
  async createOrder(data, createdBy) {
    const order = new Order({
      ...data,
      createdBy,
      stageProgress: 1,
      completion: data.completion || 0
    });

    await order.save();

    // Add history entry
    await order.addHistoryEntry(
      'order_created',
      { toStatus: data.status || 'new', toStage: data.currentStage || 'Material Received' },
      createdBy
    );

    return this.getOrderById(order._id, data.organizationId);
  }

  /**
   * Update order
   */
  async updateOrder(id, organizationId, data, updatedBy) {
    const order = await Order.findOne({ _id: id, organizationId });
    if (!order) return null;

    const oldStatus = order.status;
    const oldStage = order.currentStage;

    // Update fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        order[key] = data[key];
      }
    });

    order.updatedBy = updatedBy;
    await order.save();

    // Add history entry if status or stage changed
    if (data.status && data.status !== oldStatus) {
      await order.addHistoryEntry(
        'status_changed',
        { fromStatus: oldStatus, toStatus: data.status },
        updatedBy
      );
    }

    if (data.currentStage && data.currentStage !== oldStage) {
      await order.addHistoryEntry(
        'stage_changed',
        { fromStage: oldStage, toStage: data.currentStage },
        updatedBy
      );
    }

    return this.getOrderById(id, organizationId);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id, organizationId, status, updatedBy) {
    const order = await Order.findOne({ _id: id, organizationId });
    if (!order) return null;

    const oldStatus = order.status;
    order.status = status;

    if (status === 'completed') {
      order.trackingStatus = 'completed';
      order.completedDate = new Date();
      order.actualDelivery = new Date();
      order.completion = 100;
      order.stageProgress = 10;
      order.currentStage = 'Handover';
    }

    order.updatedBy = updatedBy;
    await order.save();

    await order.addHistoryEntry(
      'status_changed',
      { fromStatus: oldStatus, toStatus: status },
      updatedBy
    );

    return this.getOrderById(id, organizationId);
  }

  /**
   * Advance order to next stage
   */
  async advanceStage(id, organizationId, updatedBy) {
    const order = await Order.findOne({ _id: id, organizationId });
    if (!order) return null;

    const currentIndex = OrderService.PRODUCTION_STAGES.findIndex(
      s => s.name === order.currentStage
    );

    if (currentIndex < OrderService.PRODUCTION_STAGES.length - 1) {
      const oldStage = order.currentStage;
      const nextStage = OrderService.PRODUCTION_STAGES[currentIndex + 1];

      order.currentStage = nextStage.name;
      order.stageProgress = currentIndex + 2;
      order.completion = Math.min(100, order.completion + 10);

      order.updatedBy = updatedBy;
      await order.save();

      await order.addHistoryEntry(
        'stage_advanced',
        { fromStage: oldStage, toStage: nextStage.name },
        updatedBy
      );
    }

    return this.getOrderById(id, organizationId);
  }

  /**
   * Update order stage
   */
  async updateOrderStage(id, organizationId, stage, updatedBy) {
    const order = await Order.findOne({ _id: id, organizationId });
    if (!order) return null;

    const stageIndex = OrderService.PRODUCTION_STAGES.findIndex(s => s.name === stage);
    if (stageIndex === -1) return null;

    const oldStage = order.currentStage;
    order.currentStage = stage;
    order.stageProgress = stageIndex + 1;
    order.completion = Math.min(100, (stageIndex + 1) * 10);

    order.updatedBy = updatedBy;
    await order.save();

    await order.addHistoryEntry(
      'stage_changed',
      { fromStage: oldStage, toStage: stage },
      updatedBy
    );

    return this.getOrderById(id, organizationId);
  }

  /**
   * Mark order as delayed
   */
  async markAsDelayed(id, organizationId, delayDays, delayReason, updatedBy) {
    const order = await Order.findOne({ _id: id, organizationId });
    if (!order) return null;

    order.trackingStatus = 'delayed';
    order.delayDays = delayDays;
    order.delayReason = delayReason;
    order.updatedBy = updatedBy;

    await order.save();

    await order.addHistoryEntry(
      'marked_delayed',
      { notes: `Delayed by ${delayDays} days: ${delayReason}` },
      updatedBy
    );

    return this.getOrderById(id, organizationId);
  }

  /**
   * Add customer review
   */
  async addCustomerReview(id, organizationId, rating, review) {
    const order = await Order.findOne({ _id: id, organizationId });
    if (!order) return null;

    order.rating = rating;
    order.review = review;

    await order.save();

    return this.getOrderById(id, organizationId);
  }

  /**
   * Delete order (soft delete)
   */
  async deleteOrder(id, organizationId) {
    const order = await Order.findOneAndDelete({ _id: id, organizationId });
    return order;
  }

  /**
   * Get pipeline data (orders grouped by stage)
   */
  async getPipelineData(organizationId) {
    const orders = await Order.find({
      organizationId,
      status: { $ne: 'cancelled' }
    })
      .sort({ completion: -1 })
      .populate('supervisorId', 'personalInfo.firstName personalInfo.lastName');

    const pipelineData = OrderService.PRODUCTION_STAGES.map(stage => {
      const stageOrders = orders.filter(o => o.currentStage === stage.name);
      const delayedOrders = stageOrders.filter(o => o.trackingStatus === 'delayed');
      const avgCompletion = stageOrders.length > 0
        ? Math.round(stageOrders.reduce((acc, o) => acc + (o.completion || 0), 0) / stageOrders.length)
        : 0;

      return {
        ...stage,
        orders: stageOrders.map(order => this.formatOrder(order)),
        count: stageOrders.length,
        progress: avgCompletion,
        delayed: delayedOrders.length,
        fmCount: stageOrders.filter(o => o.orderType === 'FM').length,
        hmCount: stageOrders.filter(o => o.orderType === 'HM').length
      };
    });

    return pipelineData;
  }

  /**
   * Get delay alerts
   */
  async getDelayAlerts(organizationId) {
    const orders = await Order.find({
      organizationId,
      trackingStatus: 'delayed'
    })
      .sort({ delayDays: -1 })
      .populate('supervisorId', 'personalInfo.firstName personalInfo.lastName');

    return orders.map(order => ({
      id: order._id,
      orderId: order.orderId,
      customer: order.customer?.name,
      stage: order.currentStage,
      delayDays: order.delayDays || 0,
      reason: order.delayReason || 'No reason specified',
      severity: (order.delayDays || 0) >= 5 ? 'critical' :
                (order.delayDays || 0) >= 3 ? 'high' : 'medium',
      priority: order.priority
    }));
  }

  /**
   * Get teams
   */
  getTeams() {
    return OrderService.TEAMS;
  }

  /**
   * Get stage mappings
   */
  getStageMappings(orderType) {
    if (orderType === 'FM') {
      return OrderService.FM_STAGE_MAPPING;
    }
    return OrderService.HM_STAGE_MAPPING;
  }

  /**
   * Get KPI data
   */
  async getKPIData(organizationId) {
    const stats = await this.getDashboardStats(organizationId);

    return [
      { title: 'Total Orders', value: stats.total, change: 12, trend: 'up', color: 'blue' },
      { title: 'In Production', value: stats.inProduction, change: 8, trend: 'up', color: 'yellow' },
      { title: 'Completed', value: stats.completed, change: 15, trend: 'up', color: 'green' },
      { title: 'New Orders', value: stats.newOrders, change: -5, trend: 'down', color: 'orange' },
      { title: 'Delayed', value: stats.delayed, change: -2, trend: 'down', color: 'red' },
      { title: 'Completion %', value: `${stats.completionRate}%`, change: 5, trend: 'up', color: 'purple' }
    ];
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(organizationId, limit = 10) {
    const orders = await Order.find({ organizationId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('orderId customer product currentStage status updatedAt history');

    return orders.map(order => ({
      id: order._id,
      orderId: order.orderId,
      customer: order.customer?.name,
      product: order.product?.name,
      stage: order.currentStage,
      status: order.status,
      lastUpdated: order.updatedAt,
      lastAction: order.history?.[order.history.length - 1] || null
    }));
  }

  /**
   * Get dispatch tracking data
   */
  async getDispatchData(organizationId) {
    const readyForDispatch = await Order.countDocuments({
      organizationId,
      currentStage: { $in: ['Delivery', 'Final'] },
      status: 'in_production'
    });

    const dispatched = await Order.countDocuments({
      organizationId,
      status: 'completed',
      completedDate: { $exists: true }
    });

    const inTransit = await Order.countDocuments({
      organizationId,
      currentStage: 'Delivery',
      status: 'in_production'
    });

    const recentDispatches = await Order.find({
      organizationId,
      status: 'completed'
    })
      .sort({ completedDate: -1 })
      .limit(5)
      .select('orderId customer completedDate actualDelivery');

    return {
      readyForDispatch,
      dispatched,
      inTransit,
      items: recentDispatches.map(order => ({
        id: order._id,
        orderId: order.orderId,
        customer: order.customer?.name,
        dispatchDate: order.completedDate,
        deliveryDate: order.actualDelivery
      }))
    };
  }

  /**
   * Get statistics by date range
   */
  async getStatsByDateRange(organizationId, startDate, endDate) {
    const query = { organizationId };

    if (startDate && endDate) {
      query.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query);

    return {
      total: orders.length,
      byStatus: {
        new: orders.filter(o => o.status === 'new').length,
        inProduction: orders.filter(o => o.status === 'in_production').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      },
      byType: {
        FM: orders.filter(o => o.orderType === 'FM').length,
        HM: orders.filter(o => o.orderType === 'HM').length
      },
      totalValue: orders.reduce((sum, o) => sum + (o.amount || 0), 0),
      avgCompletion: orders.length > 0
        ? Math.round(orders.reduce((sum, o) => sum + (o.completion || 0), 0) / orders.length)
        : 0
    };
  }

  /**
   * Format order for response
   */
  formatOrder(order) {
    if (!order) return null;

    const stageMapping = order.orderType === 'FM'
      ? OrderService.FM_STAGE_MAPPING[order.currentStage]
      : OrderService.HM_STAGE_MAPPING[order.currentStage];

    return {
      id: order._id,
      orderId: order.orderId,
      customer: {
        name: order.customer?.name,
        email: order.customer?.email,
        phone: order.customer?.phone,
        address: order.customer?.address
      },
      product: {
        name: order.product?.name,
        description: order.product?.description,
        category: order.product?.category,
        type: order.product?.type || order.orderType
      },
      amount: order.amount,
      formattedAmount: `₹${order.amount?.toLocaleString('en-IN') || '0'}`,
      orderType: order.orderType,
      status: order.status,
      trackingStatus: order.trackingStatus,
      currentStage: order.currentStage,
      stageProgress: order.stageProgress,
      completion: order.completion,
      internalSteps: order.internalSteps || [],
      assignedTeam: order.assignedTeam,
      supervisor: order.supervisor,
      supervisorId: order.supervisorId?._id,
      priority: order.priority,
      source: order.source,
      delayDays: order.delayDays,
      delayReason: order.delayReason,
      orderDate: order.orderDate,
      expectedDelivery: order.expectedDelivery,
      actualDelivery: order.actualDelivery,
      completedDate: order.completedDate,
      rating: order.rating,
      review: order.review,
      notes: order.notes,
      remarks: order.remarks,
      model3d: order.model3d,
      documents: order.documents,
      history: order.history,
      stageMapping: stageMapping || [],
      createdBy: order.createdBy,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }
}

export default new OrderService();