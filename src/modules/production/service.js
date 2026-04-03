import ProductionWorkOrder from '../../models/ProductionWorkOrder.js';
import ProductionBatchOrder from '../../models/ProductionBatchOrder.js';
import ProductionArtisan from '../../models/ProductionArtisan.js';
import ProductionMaterial from '../../models/ProductionMaterial.js';
import ProductionQualityCheck from '../../models/ProductionQualityCheck.js';
import ProductionLine from '../../models/ProductionLine.js';
import ProductionMachine from '../../models/ProductionMachine.js';
import ProductionInventory from '../../models/ProductionInventory.js';

/**
 * Production Service
 * Handles all business logic for production module
 */
class ProductionService {
  // ==================== HM STAGES CONFIG ====================
  static HM_STAGES = [
    { id: 1, name: 'Supervisor', key: 'supervisor' },
    { id: 2, name: 'Working Team', key: 'workingTeam' },
    { id: 3, name: 'Purchase', key: 'purchase' },
    { id: 4, name: 'Delivery', key: 'delivery' },
    { id: 5, name: 'Start Work', key: 'startWork' },
    { id: 6, name: 'Stage', key: 'stage' },
    { id: 7, name: 'S1 - All Structure Done', key: 's1Structure' },
    { id: 8, name: 'S2 - All Laminate Done', key: 's2Laminate' },
    { id: 9, name: 'S3 - Hardware Fitting', key: 's3Hardware' },
    { id: 10, name: 'QC', key: 'qc' },
    { id: 11, name: 'Remark', key: 'remark' },
    { id: 12, name: 'Handover', key: 'handover' },
    { id: 13, name: 'Client Satisfaction %', key: 'clientSatisfaction' }
  ];

  // ==================== FM STAGES CONFIG ====================
  static FM_STAGES = [
    { id: 1, name: '100% Material Received', key: 'materialReceived' },
    { id: 2, name: 'Pre Installation', key: 'preInstallation' },
    { id: 3, name: 'Vendor Purchase', key: 'vendorPurchase' },
    { id: 4, name: 'Hardware Purchase', key: 'hardwarePurchase' },
    { id: 5, name: 'IT Team Planning', key: 'itPlanning' },
    { id: 6, name: 'Supervisor', key: 'supervisor' },
    { id: 7, name: 'Measurement Team', key: 'measurementTeam' },
    { id: 8, name: 'Delivery', key: 'delivery' },
    { id: 9, name: 'Installation Start', key: 'installationStart' },
    { id: 10, name: 'Rework', key: 'rework' },
    { id: 11, name: 'Quality Check', key: 'qualityCheck' },
    { id: 12, name: 'Final', key: 'final' },
    { id: 13, name: 'Handover', key: 'handover' }
  ];

  // ==================== DASHBOARD ====================

  /**
   * Get HM Dashboard Stats
   */
  async getHMDashboardStats(organizationId) {
    const workOrders = await ProductionWorkOrder.find({ organizationId });
    const artisans = await ProductionArtisan.find({ organizationId, isActive: true });
    const materials = await ProductionMaterial.find({ organizationId });
    const qualityChecks = await ProductionQualityCheck.find({ organizationId, workOrderRef: { $exists: true } });

    // Calculate costing stats
    const totalEstimated = workOrders.reduce((sum, wo) => sum + (wo.estimatedCost || 0), 0);
    const totalActual = workOrders.reduce((sum, wo) => sum + (wo.actualCost || 0), 0);
    const variance = totalActual - totalEstimated;
    const variancePercentage = totalEstimated > 0 ? Math.round((variance / totalEstimated) * 100) : 0;

    return {
      workOrders: {
        total: workOrders.length,
        active: workOrders.filter(wo => wo.status === 'Active').length,
        delayed: workOrders.filter(wo => wo.status === 'Delayed').length,
        completed: workOrders.filter(wo => wo.status === 'Completed').length,
        onHold: workOrders.filter(wo => wo.status === 'On Hold').length,
        avgCompletionTime: this._calculateAvgCompletionTime(workOrders)
      },
      artisans: {
        total: artisans.length,
        available: artisans.filter(a => a.status === 'Available').length,
        onProject: artisans.filter(a => a.status === 'On Project').length,
        onLeave: artisans.filter(a => a.status === 'On Leave').length,
        overloaded: artisans.filter(a => a.status === 'Overloaded').length,
        avgEfficiency: Math.round(artisans.reduce((sum, a) => sum + a.efficiency, 0) / artisans.length) || 0
      },
      materials: {
        total: materials.length,
        ready: materials.filter(m => m.status === 'Ready').length,
        partial: materials.filter(m => m.status === 'Partial').length,
        missing: materials.filter(m => m.status === 'Missing').length,
        ordered: materials.filter(m => m.status === 'Ordered' || m.status === 'In Transit').length,
        totalValue: materials.reduce((sum, m) => sum + m.totalCost, 0)
      },
      qualityCheck: {
        total: qualityChecks.length,
        pending: qualityChecks.filter(qc => qc.status === 'Pending').length,
        inProgress: qualityChecks.filter(qc => qc.status === 'In Progress').length,
        passed: qualityChecks.filter(qc => qc.status === 'Passed').length,
        failed: qualityChecks.filter(qc => qc.status === 'Failed').length,
        rework: qualityChecks.filter(qc => qc.status === 'Rework').length
      },
      costing: {
        totalEstimated,
        totalActual,
        variance,
        variancePercentage
      }
    };
  }

  /**
   * Get FM Dashboard Stats
   */
  async getFMDashboardStats(organizationId) {
    const batchOrders = await ProductionBatchOrder.find({ organizationId });
    const productionLines = await ProductionLine.find({ organizationId, isActive: true });
    const inventory = await ProductionInventory.find({ organizationId, isActive: true });
    const qualityChecks = await ProductionQualityCheck.find({ organizationId, batchOrderRef: { $exists: true } });

    // Calculate output stats (units produced)
    const todayOutput = productionLines.reduce((sum, pl) => sum + (pl.output || 0), 0);

    return {
      workOrders: {
        total: batchOrders.length,
        inProgress: batchOrders.filter(bo => bo.status === 'In Progress').length,
        completed: batchOrders.filter(bo => bo.status === 'Completed').length,
        delayed: batchOrders.filter(bo => bo.status === 'Delayed').length,
        avgCompletionTime: this._calculateAvgCompletionTime(batchOrders)
      },
      productionLines: {
        total: productionLines.length,
        running: productionLines.filter(pl => pl.status === 'Running').length,
        maintenance: productionLines.filter(pl => pl.status === 'Maintenance').length,
        avgEfficiency: Math.round(productionLines.reduce((sum, pl) => sum + pl.efficiency, 0) / productionLines.length) || 0
      },
      inventory: {
        total: inventory.length,
        inStock: inventory.filter(i => i.status === 'In Stock').length,
        lowStock: inventory.filter(i => i.status === 'Low Stock').length,
        critical: inventory.filter(i => i.status === 'Critical' || i.status === 'Out of Stock').length,
        totalValue: inventory.reduce((sum, i) => sum + i.totalValue, 0)
      },
      quality: {
        total: qualityChecks.length,
        passed: qualityChecks.filter(qc => qc.status === 'Passed').length,
        inProgress: qualityChecks.filter(qc => qc.status === 'In Progress').length,
        avgScore: Math.round(qualityChecks.reduce((sum, qc) => sum + (qc.overallScore || 0), 0) / qualityChecks.length) || 0
      },
      output: {
        today: todayOutput,
        week: Math.round(todayOutput * 5), // Estimate
        month: Math.round(todayOutput * 22) // Estimate based on working days
      }
    };
  }

  // ==================== WORK ORDERS (HM) ====================

  /**
   * Get all work orders with filters
   */
  async getWorkOrders(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.qcStatus) query.qcStatus = filters.qcStatus;
    if (filters.materialStatus) query.materialStatus = filters.materialStatus;
    if (filters.assignedArtisan) query.assignedArtisan = filters.assignedArtisan;

    if (filters.search) {
      query.$or = [
        { workOrderId: { $regex: filters.search, $options: 'i' } },
        { clientName: { $regex: filters.search, $options: 'i' } },
        { projectName: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.startDate || filters.endDate) {
      query.dueDate = {};
      if (filters.startDate) query.dueDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.dueDate.$lte = new Date(filters.endDate);
    }

    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      ProductionWorkOrder.find(query)
        .populate('assignedArtisan', 'name skillCategory status efficiency')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ProductionWorkOrder.countDocuments(query)
    ]);

    return {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get work order by ID
   */
  async getWorkOrderById(id, organizationId) {
    return await ProductionWorkOrder.findOne({ _id: id, organizationId })
      .populate('assignedArtisan')
      .populate('materialIds')
      .populate('qcId');
  }

  /**
   * Create work order
   */
  async createWorkOrder(data, userId) {
    const order = new ProductionWorkOrder({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    return await order.save();
  }

  /**
   * Update work order
   */
  async updateWorkOrder(id, organizationId, data, userId) {
    const order = await ProductionWorkOrder.findOneAndUpdate(
      { _id: id, organizationId },
      { ...data, updatedBy: userId, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    return order;
  }

  /**
   * Update work order stage
   */
  async updateWorkOrderStage(id, organizationId, stageKey, stageData, userId) {
    const order = await ProductionWorkOrder.findOne({ _id: id, organizationId });
    if (!order) return null;

    // Update stage data
    if (!order.stageData) order.stageData = {};
    order.stageData[stageKey] = {
      ...order.stageData[stageKey],
      ...stageData,
      updatedAt: new Date()
    };

    // Calculate completion
    const stageKeys = this.constructor.HM_STAGES.map(s => s.key);
    const completedStages = stageKeys.filter(key =>
      order.stageData[key]?.status === 'Completed'
    ).length;
    order.completedStages = completedStages;
    order.completion = Math.round((completedStages / stageKeys.length) * 100);

    // Update current stage
    const currentIndex = stageKeys.indexOf(stageKey);
    if (currentIndex > order.currentStageIndex) {
      order.currentStageIndex = currentIndex;
      order.currentStage = this.constructor.HM_STAGES[currentIndex].name;
    }

    order.updatedBy = userId;
    order.updatedAt = new Date();

    // Add activity
    order.activityLog.push({
      action: 'stage_update',
      details: `Stage ${stageKey} updated to ${stageData.status}`,
      performedBy: userId
    });

    return await order.save();
  }

  /**
   * Delete work order
   */
  async deleteWorkOrder(id, organizationId) {
    return await ProductionWorkOrder.findOneAndDelete({ _id: id, organizationId });
  }

  // ==================== BATCH ORDERS (FM) ====================

  /**
   * Get all batch orders with filters
   */
  async getBatchOrders(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.productionLine) query.productionLine = filters.productionLine;

    if (filters.search) {
      query.$or = [
        { batchId: { $regex: filters.search, $options: 'i' } },
        { clientName: { $regex: filters.search, $options: 'i' } },
        { projectName: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      ProductionBatchOrder.find(query)
        .populate('productionLine', 'name status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ProductionBatchOrder.countDocuments(query)
    ]);

    return {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get batch order by ID
   */
  async getBatchOrderById(id, organizationId) {
    return await ProductionBatchOrder.findOne({ _id: id, organizationId })
      .populate('productionLine')
      .populate('qualityCheckId');
  }

  /**
   * Create batch order
   */
  async createBatchOrder(data, userId) {
    const order = new ProductionBatchOrder({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    return await order.save();
  }

  /**
   * Update batch order
   */
  async updateBatchOrder(id, organizationId, data, userId) {
    return await ProductionBatchOrder.findOneAndUpdate(
      { _id: id, organizationId },
      { ...data, updatedBy: userId, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Update batch order stage
   */
  async updateBatchOrderStage(id, organizationId, stageKey, stageData, userId) {
    const order = await ProductionBatchOrder.findOne({ _id: id, organizationId });
    if (!order) return null;

    if (!order.stageData) order.stageData = {};
    order.stageData[stageKey] = {
      ...order.stageData[stageKey],
      ...stageData,
      updatedAt: new Date()
    };

    // Calculate completion
    const stageKeys = this.constructor.FM_STAGES.map(s => s.key);
    const completedStages = stageKeys.filter(key =>
      order.stageData[key]?.status === 'Completed'
    ).length;
    order.completion = Math.round((completedStages / stageKeys.length) * 100);

    order.updatedBy = userId;
    return await order.save();
  }

  /**
   * Delete batch order
   */
  async deleteBatchOrder(id, organizationId) {
    return await ProductionBatchOrder.findOneAndDelete({ _id: id, organizationId });
  }

  // ==================== ARTISANS ====================

  /**
   * Get all artisans
   */
  async getArtisans(organizationId, filters = {}) {
    const query = { organizationId, isActive: true };
    console.log('ProductionService: getArtisans query:', JSON.stringify(query));

    if (filters.status) query.status = filters.status;
    if (filters.skillCategory) query.skillCategory = filters.skillCategory;

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { skillCategory: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const results = await ProductionArtisan.find(query).sort({ name: 1 });
    console.log(`ProductionService: getArtisans found ${results.length} results`);
    return results;
  }

  /**
   * Get artisan by ID
   */
  async getArtisanById(id, organizationId) {
    return await ProductionArtisan.findOne({ _id: id, organizationId });
  }

  /**
   * Create artisan
   */
  async createArtisan(data, userId) {
    const artisan = new ProductionArtisan({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    return await artisan.save();
  }

  /**
   * Update artisan
   */
  async updateArtisan(id, organizationId, data, userId) {
    return await ProductionArtisan.findOneAndUpdate(
      { _id: id, organizationId },
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete artisan (soft delete)
   */
  async deleteArtisan(id, organizationId) {
    return await ProductionArtisan.findOneAndUpdate(
      { _id: id, organizationId },
      { isActive: false },
      { new: true }
    );
  }

  // ==================== MATERIALS ====================

  /**
   * Get all materials
   */
  async getMaterials(organizationId, filters = {}) {
    const query = { organizationId };

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.workOrderId) query.workOrderId = filters.workOrderId;

    if (filters.search) {
      query.$or = [
        { materialId: { $regex: filters.search, $options: 'i' } },
        { materialName: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return await ProductionMaterial.find(query)
      .sort({ createdAt: -1 });
  }

  /**
   * Get material by ID
   */
  async getMaterialById(id, organizationId) {
    return await ProductionMaterial.findOne({ _id: id, organizationId });
  }

  /**
   * Create material
   */
  async createMaterial(data, userId) {
    const material = new ProductionMaterial({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    return await material.save();
  }

  /**
   * Update material
   */
  async updateMaterial(id, organizationId, data, userId) {
    return await ProductionMaterial.findOneAndUpdate(
      { _id: id, organizationId },
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete material
   */
  async deleteMaterial(id, organizationId) {
    return await ProductionMaterial.findOneAndDelete({ _id: id, organizationId });
  }

  // ==================== QUALITY CHECKS ====================

  /**
   * Get all quality checks
   */
  async getQualityChecks(organizationId, filters = {}) {
    const query = { organizationId };

    if (filters.status) query.status = filters.status;
    if (filters.qcType) query.qcType = filters.qcType;
    if (filters.workOrderId) query.workOrderId = filters.workOrderId;

    if (filters.search) {
      query.$or = [
        { qcId: { $regex: filters.search, $options: 'i' } },
        { workOrderRef: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return await ProductionQualityCheck.find(query)
      .populate('workOrderId')
      .populate('batchOrderId')
      .sort({ createdAt: -1 });
  }

  /**
   * Get quality check by ID
   */
  async getQualityCheckById(id, organizationId) {
    return await ProductionQualityCheck.findOne({ _id: id, organizationId });
  }

  /**
   * Create quality check
   */
  async createQualityCheck(data, userId) {
    const qc = new ProductionQualityCheck({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    return await qc.save();
  }

  /**
   * Update quality check
   */
  async updateQualityCheck(id, organizationId, data, userId) {
    return await ProductionQualityCheck.findOneAndUpdate(
      { _id: id, organizationId },
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete quality check
   */
  async deleteQualityCheck(id, organizationId) {
    return await ProductionQualityCheck.findOneAndDelete({ _id: id, organizationId });
  }

  // ==================== PRODUCTION LINES ====================

  /**
   * Get all production lines
   */
  async getProductionLines(organizationId, filters = {}) {
    const query = { organizationId, isActive: true };

    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;

    if (filters.search) {
      query.$or = [
        { lineId: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } }
      ];
    }

    try {
      const lines = await ProductionLine.find(query)
        .populate('machines')
        .sort({ name: 1 });
      console.log(`ProductionService: Found ${lines.length} production lines for org ${organizationId}`);
      return lines;
    } catch (error) {
      console.error('ProductionService: Error fetching production lines:', error);
      // Fallback: fetch without populate if populate fails
      return await ProductionLine.find(query).sort({ name: 1 });
    }
  }

  /**
   * Get production line by ID
   */
  async getProductionLineById(id, organizationId) {
    try {
      const line = await ProductionLine.findOne({ _id: id, organizationId })
        .populate('machines')
        .populate('workOrderId');
      return line;
    } catch (error) {
      console.error('ProductionService: Error fetching production line by ID:', error);
      // Fallback: fetch without populate
      return await ProductionLine.findOne({ _id: id, organizationId });
    }
  }

  /**
   * Create production line
   */
  async createProductionLine(data, userId) {
    const line = new ProductionLine({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    return await line.save();
  }

  /**
   * Update production line
   */
  async updateProductionLine(id, organizationId, data, userId) {
    return await ProductionLine.findOneAndUpdate(
      { _id: id, organizationId },
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
  }

  // ==================== INVENTORY ====================

  /**
   * Get all inventory
   */
  async getInventory(organizationId, filters = {}) {
    const query = { organizationId, isActive: true };

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;

    if (filters.search) {
      query.$or = [
        { inventoryId: { $regex: filters.search, $options: 'i' } },
        { itemName: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return await ProductionInventory.find(query).sort({ itemName: 1 });
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryById(id, organizationId) {
    return await ProductionInventory.findOne({ _id: id, organizationId });
  }

  /**
   * Create inventory item
   */
  async createInventoryItem(data, userId) {
    const item = new ProductionInventory({
      ...data,
      createdBy: userId,
      updatedBy: userId
    });
    return await item.save();
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(id, organizationId, data, userId) {
    return await ProductionInventory.findOneAndUpdate(
      { _id: id, organizationId },
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
  }

  /**
   * Add stock to inventory
   */
  async addStock(id, organizationId, quantity, reference, userId, remarks) {
    const item = await ProductionInventory.findOne({ _id: id, organizationId });
    if (!item) return null;
    return await item.addStock(quantity, reference, userId, remarks);
  }

  /**
   * Remove stock from inventory
   */
  async removeStock(id, organizationId, quantity, reference, userId, remarks) {
    const item = await ProductionInventory.findOne({ _id: id, organizationId });
    if (!item) return null;
    return await item.removeStock(quantity, reference, userId, remarks);
  }

  // ==================== CONFIG ====================

  /**
   * Get HM stages configuration
   */
  getHMStages() {
    return this.constructor.HM_STAGES;
  }

  /**
   * Get FM stages configuration
   */
  getFMStages() {
    return this.constructor.FM_STAGES;
  }

  // ==================== PHOTOS ====================

  /**
   * Upload photo to work order
   * @param {string} id - Work order ID
   * @param {string} organizationId - Organization ID
   * @param {string} photoType - 'beforeDispatch', 'beforeInstallation', or 'afterInstallation'
   * @param {object} photoData - { url, publicId, remarks }
   * @param {string} userId - User ID who uploaded
   */
  async uploadWorkOrderPhoto(id, organizationId, photoType, photoData, userId) {
    const order = await ProductionWorkOrder.findOne({ _id: id, organizationId });
    if (!order) return null;

    // Validate photo type
    if (!['beforeDispatch', 'beforeInstallation', 'afterInstallation'].includes(photoType)) {
      throw new Error('Invalid photo type. Must be beforeDispatch, beforeInstallation, or afterInstallation');
    }

    // Initialize photos object if not exists
    if (!order.photos) {
      order.photos = {
        beforeDispatch: null,
        beforeInstallation: null,
        afterInstallation: null
      };
    }

    // Set photo data
    order.photos[photoType] = {
      url: photoData.url,
      publicId: photoData.publicId,
      uploadedBy: userId,
      uploadedAt: new Date(),
      remarks: photoData.remarks || ''
    };

    // Add activity log
    const photoTypeLabels = {
      beforeDispatch: 'Before Dispatch',
      beforeInstallation: 'Before Installation',
      afterInstallation: 'After Installation'
    };
    order.activityLog.push({
      action: 'photo_upload',
      details: `${photoTypeLabels[photoType]} photo uploaded`,
      performedBy: userId
    });

    order.updatedBy = userId;
    order.updatedAt = new Date();

    return await order.save();
  }

  /**
   * Delete photo from work order
   * @param {string} id - Work order ID
   * @param {string} organizationId - Organization ID
   * @param {string} photoType - 'beforeDispatch', 'beforeInstallation', or 'afterInstallation'
   * @param {string} userId - User ID who deleted
   */
  async deleteWorkOrderPhoto(id, organizationId, photoType, userId) {
    const order = await ProductionWorkOrder.findOne({ _id: id, organizationId });
    if (!order) return null;

    // Validate photo type
    if (!['beforeDispatch', 'beforeInstallation', 'afterInstallation'].includes(photoType)) {
      throw new Error('Invalid photo type');
    }

    // Clear photo data
    if (order.photos) {
      order.photos[photoType] = null;
    }

    // Add activity log
    const photoTypeLabels = {
      beforeDispatch: 'Before Dispatch',
      beforeInstallation: 'Before Installation',
      afterInstallation: 'After Installation'
    };
    order.activityLog.push({
      action: 'photo_delete',
      details: `${photoTypeLabels[photoType]} photo deleted`,
      performedBy: userId
    });

    order.updatedBy = userId;
    order.updatedAt = new Date();

    return await order.save();
  }

  /**
   * Upload photo to batch order (FM)
   */
  async uploadBatchOrderPhoto(id, organizationId, photoType, photoData, userId) {
    const order = await ProductionBatchOrder.findOne({ _id: id, organizationId });
    if (!order) return null;

    if (!['beforeDispatch', 'beforeInstallation', 'afterInstallation'].includes(photoType)) {
      throw new Error('Invalid photo type');
    }

    if (!order.photos) {
      order.photos = {
        beforeDispatch: null,
        beforeInstallation: null,
        afterInstallation: null
      };
    }

    order.photos[photoType] = {
      url: photoData.url,
      publicId: photoData.publicId,
      uploadedBy: userId,
      uploadedAt: new Date(),
      remarks: photoData.remarks || ''
    };

    order.activityLog = order.activityLog || [];
    order.activityLog.push({
      action: 'photo_upload',
      details: `${photoType} photo uploaded`,
      performedBy: userId,
      performedAt: new Date()
    });

    order.updatedBy = userId;
    order.updatedAt = new Date();

    return await order.save();
  }

  /**
   * Delete photo from batch order
   */
  async deleteBatchOrderPhoto(id, organizationId, photoType, userId) {
    const order = await ProductionBatchOrder.findOne({ _id: id, organizationId });
    if (!order) return null;

    if (order.photos) {
      order.photos[photoType] = null;
    }

    order.activityLog = order.activityLog || [];
    order.activityLog.push({
      action: 'photo_delete',
      details: `${photoType} photo deleted`,
      performedBy: userId,
      performedAt: new Date()
    });

    order.updatedBy = userId;
    order.updatedAt = new Date();

    return await order.save();
  }

  // ==================== HELPERS ====================

  _calculateAvgCompletionTime(orders) {
    const completedOrders = orders.filter(o => o.status === 'Completed' && o.startDate && o.completedDate);
    if (completedOrders.length === 0) return 0;

    const totalDays = completedOrders.reduce((sum, o) => {
      const days = (new Date(o.completedDate) - new Date(o.startDate)) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return Math.round(totalDays / completedOrders.length * 10) / 10;
  }
}

export default new ProductionService();