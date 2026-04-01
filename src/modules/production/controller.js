import productionService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

/**
 * Production Controller
 * Handles HTTP requests for production module
 */
class ProductionController {
  // ==================== DASHBOARD ====================

  /**
   * Get HM Dashboard Stats
   */
  async getHMDashboardStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await productionService.getHMDashboardStats(organizationId);
      return successResponse(res, stats, 'HM Dashboard stats retrieved successfully');
    } catch (error) {
      logger.error('Get HM dashboard stats error:', error);
      next(error);
    }
  }

  /**
   * Get FM Dashboard Stats
   */
  async getFMDashboardStats(req, res, next) {
    try {
      const { organizationId } = req;
      const stats = await productionService.getFMDashboardStats(organizationId);
      return successResponse(res, stats, 'FM Dashboard stats retrieved successfully');
    } catch (error) {
      logger.error('Get FM dashboard stats error:', error);
      next(error);
    }
  }

  // ==================== WORK ORDERS (HM) ====================

  /**
   * Get all work orders
   */
  async getWorkOrders(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        qcStatus: req.query.qcStatus,
        materialStatus: req.query.materialStatus,
        assignedArtisan: req.query.assignedArtisan,
        search: req.query.search,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await productionService.getWorkOrders(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.orders,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Work orders retrieved successfully'
      );
    } catch (error) {
      logger.error('Get work orders error:', error);
      next(error);
    }
  }

  /**
   * Get work order by ID
   */
  async getWorkOrderById(req, res, next) {
    try {
      const { organizationId } = req;
      const order = await productionService.getWorkOrderById(req.params.id, organizationId);

      if (!order) {
        return notFoundResponse(res, 'Work order');
      }

      return successResponse(res, order, 'Work order retrieved successfully');
    } catch (error) {
      logger.error('Get work order error:', error);
      next(error);
    }
  }

  /**
   * Create work order
   */
  async createWorkOrder(req, res, next) {
    try {
      const { organizationId, user } = req;
      const order = await productionService.createWorkOrder(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Work order created: ${order.workOrderId} by user ${user._id}`);
      return createdResponse(res, order, 'Work order created successfully');
    } catch (error) {
      logger.error('Create work order error:', error);
      next(error);
    }
  }

  /**
   * Update work order
   */
  async updateWorkOrder(req, res, next) {
    try {
      const { organizationId, user } = req;
      const order = await productionService.updateWorkOrder(
        req.params.id,
        organizationId,
        req.body,
        user._id
      );

      if (!order) {
        return notFoundResponse(res, 'Work order');
      }

      return successResponse(res, order, 'Work order updated successfully');
    } catch (error) {
      logger.error('Update work order error:', error);
      next(error);
    }
  }

  /**
   * Update work order stage
   */
  async updateWorkOrderStage(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { stageKey, stageData } = req.body;

      const order = await productionService.updateWorkOrderStage(
        req.params.id,
        organizationId,
        stageKey,
        stageData,
        user._id
      );

      if (!order) {
        return notFoundResponse(res, 'Work order');
      }

      return successResponse(res, order, 'Work order stage updated successfully');
    } catch (error) {
      logger.error('Update work order stage error:', error);
      next(error);
    }
  }

  /**
   * Delete work order
   */
  async deleteWorkOrder(req, res, next) {
    try {
      const { organizationId } = req;
      const order = await productionService.deleteWorkOrder(req.params.id, organizationId);

      if (!order) {
        return notFoundResponse(res, 'Work order');
      }

      return successResponse(res, null, 'Work order deleted successfully');
    } catch (error) {
      logger.error('Delete work order error:', error);
      next(error);
    }
  }

  // ==================== BATCH ORDERS (FM) ====================

  /**
   * Get all batch orders
   */
  async getBatchOrders(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        productionLine: req.query.productionLine,
        search: req.query.search
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await productionService.getBatchOrders(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.orders,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        'Batch orders retrieved successfully'
      );
    } catch (error) {
      logger.error('Get batch orders error:', error);
      next(error);
    }
  }

  /**
   * Get batch order by ID
   */
  async getBatchOrderById(req, res, next) {
    try {
      const { organizationId } = req;
      const order = await productionService.getBatchOrderById(req.params.id, organizationId);

      if (!order) {
        return notFoundResponse(res, 'Batch order');
      }

      return successResponse(res, order, 'Batch order retrieved successfully');
    } catch (error) {
      logger.error('Get batch order error:', error);
      next(error);
    }
  }

  /**
   * Create batch order
   */
  async createBatchOrder(req, res, next) {
    try {
      const { organizationId, user } = req;
      const order = await productionService.createBatchOrder(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Batch order created: ${order.batchId} by user ${user._id}`);
      return createdResponse(res, order, 'Batch order created successfully');
    } catch (error) {
      logger.error('Create batch order error:', error);
      next(error);
    }
  }

  /**
   * Update batch order
   */
  async updateBatchOrder(req, res, next) {
    try {
      const { organizationId, user } = req;
      const order = await productionService.updateBatchOrder(
        req.params.id,
        organizationId,
        req.body,
        user._id
      );

      if (!order) {
        return notFoundResponse(res, 'Batch order');
      }

      return successResponse(res, order, 'Batch order updated successfully');
    } catch (error) {
      logger.error('Update batch order error:', error);
      next(error);
    }
  }

  /**
   * Update batch order stage
   */
  async updateBatchOrderStage(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { stageKey, stageData } = req.body;

      const order = await productionService.updateBatchOrderStage(
        req.params.id,
        organizationId,
        stageKey,
        stageData,
        user._id
      );

      if (!order) {
        return notFoundResponse(res, 'Batch order');
      }

      return successResponse(res, order, 'Batch order stage updated successfully');
    } catch (error) {
      logger.error('Update batch order stage error:', error);
      next(error);
    }
  }

  /**
   * Delete batch order
   */
  async deleteBatchOrder(req, res, next) {
    try {
      const { organizationId } = req;
      const order = await productionService.deleteBatchOrder(req.params.id, organizationId);

      if (!order) {
        return notFoundResponse(res, 'Batch order');
      }

      return successResponse(res, null, 'Batch order deleted successfully');
    } catch (error) {
      logger.error('Delete batch order error:', error);
      next(error);
    }
  }

  // ==================== ARTISANS ====================

  /**
   * Get all artisans
   */
  async getArtisans(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status,
        skillCategory: req.query.skillCategory,
        search: req.query.search
      };

      const artisans = await productionService.getArtisans(organizationId, filters);
      return successResponse(res, artisans, 'Artisans retrieved successfully');
    } catch (error) {
      logger.error('Get artisans error:', error);
      next(error);
    }
  }

  /**
   * Get artisan by ID
   */
  async getArtisanById(req, res, next) {
    try {
      const { organizationId } = req;
      const artisan = await productionService.getArtisanById(req.params.id, organizationId);

      if (!artisan) {
        return notFoundResponse(res, 'Artisan');
      }

      return successResponse(res, artisan, 'Artisan retrieved successfully');
    } catch (error) {
      logger.error('Get artisan error:', error);
      next(error);
    }
  }

  /**
   * Create artisan
   */
  async createArtisan(req, res, next) {
    try {
      const { organizationId, user } = req;
      const artisan = await productionService.createArtisan(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Artisan created: ${artisan.artisanId} by user ${user._id}`);
      return createdResponse(res, artisan, 'Artisan created successfully');
    } catch (error) {
      logger.error('Create artisan error:', error);
      next(error);
    }
  }

  /**
   * Update artisan
   */
  async updateArtisan(req, res, next) {
    try {
      const { organizationId, user } = req;
      const artisan = await productionService.updateArtisan(
        req.params.id,
        organizationId,
        req.body,
        user._id
      );

      if (!artisan) {
        return notFoundResponse(res, 'Artisan');
      }

      return successResponse(res, artisan, 'Artisan updated successfully');
    } catch (error) {
      logger.error('Update artisan error:', error);
      next(error);
    }
  }

  /**
   * Delete artisan
   */
  async deleteArtisan(req, res, next) {
    try {
      const { organizationId } = req;
      const artisan = await productionService.deleteArtisan(req.params.id, organizationId);

      if (!artisan) {
        return notFoundResponse(res, 'Artisan');
      }

      return successResponse(res, null, 'Artisan deleted successfully');
    } catch (error) {
      logger.error('Delete artisan error:', error);
      next(error);
    }
  }

  // ==================== MATERIALS ====================

  /**
   * Get all materials
   */
  async getMaterials(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status,
        category: req.query.category,
        workOrderId: req.query.workOrderId,
        search: req.query.search
      };

      const materials = await productionService.getMaterials(organizationId, filters);
      return successResponse(res, materials, 'Materials retrieved successfully');
    } catch (error) {
      logger.error('Get materials error:', error);
      next(error);
    }
  }

  /**
   * Get material by ID
   */
  async getMaterialById(req, res, next) {
    try {
      const { organizationId } = req;
      const material = await productionService.getMaterialById(req.params.id, organizationId);

      if (!material) {
        return notFoundResponse(res, 'Material');
      }

      return successResponse(res, material, 'Material retrieved successfully');
    } catch (error) {
      logger.error('Get material error:', error);
      next(error);
    }
  }

  /**
   * Create material
   */
  async createMaterial(req, res, next) {
    try {
      const { organizationId, user } = req;
      const material = await productionService.createMaterial(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Material created: ${material.materialId} by user ${user._id}`);
      return createdResponse(res, material, 'Material created successfully');
    } catch (error) {
      logger.error('Create material error:', error);
      next(error);
    }
  }

  /**
   * Update material
   */
  async updateMaterial(req, res, next) {
    try {
      const { organizationId, user } = req;
      const material = await productionService.updateMaterial(
        req.params.id,
        organizationId,
        req.body,
        user._id
      );

      if (!material) {
        return notFoundResponse(res, 'Material');
      }

      return successResponse(res, material, 'Material updated successfully');
    } catch (error) {
      logger.error('Update material error:', error);
      next(error);
    }
  }

  /**
   * Delete material
   */
  async deleteMaterial(req, res, next) {
    try {
      const { organizationId } = req;
      const material = await productionService.deleteMaterial(req.params.id, organizationId);

      if (!material) {
        return notFoundResponse(res, 'Material');
      }

      return successResponse(res, null, 'Material deleted successfully');
    } catch (error) {
      logger.error('Delete material error:', error);
      next(error);
    }
  }

  // ==================== QUALITY CHECKS ====================

  /**
   * Get all quality checks
   */
  async getQualityChecks(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status,
        qcType: req.query.qcType,
        workOrderId: req.query.workOrderId,
        search: req.query.search
      };

      const qualityChecks = await productionService.getQualityChecks(organizationId, filters);
      return successResponse(res, qualityChecks, 'Quality checks retrieved successfully');
    } catch (error) {
      logger.error('Get quality checks error:', error);
      next(error);
    }
  }

  /**
   * Get quality check by ID
   */
  async getQualityCheckById(req, res, next) {
    try {
      const { organizationId } = req;
      const qc = await productionService.getQualityCheckById(req.params.id, organizationId);

      if (!qc) {
        return notFoundResponse(res, 'Quality check');
      }

      return successResponse(res, qc, 'Quality check retrieved successfully');
    } catch (error) {
      logger.error('Get quality check error:', error);
      next(error);
    }
  }

  /**
   * Create quality check
   */
  async createQualityCheck(req, res, next) {
    try {
      const { organizationId, user } = req;
      const qc = await productionService.createQualityCheck(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Quality check created: ${qc.qcId} by user ${user._id}`);
      return createdResponse(res, qc, 'Quality check created successfully');
    } catch (error) {
      logger.error('Create quality check error:', error);
      next(error);
    }
  }

  /**
   * Update quality check
   */
  async updateQualityCheck(req, res, next) {
    try {
      const { organizationId, user } = req;
      const qc = await productionService.updateQualityCheck(
        req.params.id,
        organizationId,
        req.body,
        user._id
      );

      if (!qc) {
        return notFoundResponse(res, 'Quality check');
      }

      return successResponse(res, qc, 'Quality check updated successfully');
    } catch (error) {
      logger.error('Update quality check error:', error);
      next(error);
    }
  }

  /**
   * Delete quality check
   */
  async deleteQualityCheck(req, res, next) {
    try {
      const { organizationId } = req;
      const qc = await productionService.deleteQualityCheck(req.params.id, organizationId);

      if (!qc) {
        return notFoundResponse(res, 'Quality check');
      }

      return successResponse(res, null, 'Quality check deleted successfully');
    } catch (error) {
      logger.error('Delete quality check error:', error);
      next(error);
    }
  }

  // ==================== PRODUCTION LINES ====================

  /**
   * Get all production lines
   */
  async getProductionLines(req, res, next) {
    try {
      const { organizationId } = req;
      logger.info(`Getting production lines for organization: ${organizationId}`);
      const filters = {
        status: req.query.status,
        type: req.query.type,
        search: req.query.search
      };

      const lines = await productionService.getProductionLines(organizationId, filters);
      logger.info(`Returning ${lines?.length || 0} production lines`);
      return successResponse(res, lines, 'Production lines retrieved successfully');
    } catch (error) {
      logger.error('Get production lines error:', error);
      next(error);
    }
  }

  /**
   * Get production line by ID
   */
  async getProductionLineById(req, res, next) {
    try {
      const { organizationId } = req;
      const line = await productionService.getProductionLineById(req.params.id, organizationId);

      if (!line) {
        return notFoundResponse(res, 'Production line');
      }

      return successResponse(res, line, 'Production line retrieved successfully');
    } catch (error) {
      logger.error('Get production line error:', error);
      next(error);
    }
  }

  /**
   * Create production line
   */
  async createProductionLine(req, res, next) {
    try {
      const { organizationId, user } = req;
      const line = await productionService.createProductionLine(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Production line created: ${line.lineId} by user ${user._id}`);
      return createdResponse(res, line, 'Production line created successfully');
    } catch (error) {
      logger.error('Create production line error:', error);
      next(error);
    }
  }

  /**
   * Update production line
   */
  async updateProductionLine(req, res, next) {
    try {
      const { organizationId, user } = req;
      const line = await productionService.updateProductionLine(
        req.params.id,
        organizationId,
        req.body,
        user._id
      );

      if (!line) {
        return notFoundResponse(res, 'Production line');
      }

      return successResponse(res, line, 'Production line updated successfully');
    } catch (error) {
      logger.error('Update production line error:', error);
      next(error);
    }
  }

  // ==================== INVENTORY ====================

  /**
   * Get all inventory
   */
  async getInventory(req, res, next) {
    try {
      const { organizationId } = req;
      const filters = {
        status: req.query.status,
        category: req.query.category,
        search: req.query.search
      };

      const inventory = await productionService.getInventory(organizationId, filters);
      return successResponse(res, inventory, 'Inventory retrieved successfully');
    } catch (error) {
      logger.error('Get inventory error:', error);
      next(error);
    }
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryById(req, res, next) {
    try {
      const { organizationId } = req;
      const item = await productionService.getInventoryById(req.params.id, organizationId);

      if (!item) {
        return notFoundResponse(res, 'Inventory item');
      }

      return successResponse(res, item, 'Inventory item retrieved successfully');
    } catch (error) {
      logger.error('Get inventory item error:', error);
      next(error);
    }
  }

  /**
   * Create inventory item
   */
  async createInventoryItem(req, res, next) {
    try {
      const { organizationId, user } = req;
      const item = await productionService.createInventoryItem(
        { ...req.body, organizationId },
        user._id
      );

      logger.info(`Inventory item created: ${item.inventoryId} by user ${user._id}`);
      return createdResponse(res, item, 'Inventory item created successfully');
    } catch (error) {
      logger.error('Create inventory item error:', error);
      next(error);
    }
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(req, res, next) {
    try {
      const { organizationId, user } = req;
      const item = await productionService.updateInventoryItem(
        req.params.id,
        organizationId,
        req.body,
        user._id
      );

      if (!item) {
        return notFoundResponse(res, 'Inventory item');
      }

      return successResponse(res, item, 'Inventory item updated successfully');
    } catch (error) {
      logger.error('Update inventory item error:', error);
      next(error);
    }
  }

  /**
   * Add stock to inventory
   */
  async addStock(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { quantity, reference, remarks } = req.body;

      if (!quantity || quantity <= 0) {
        return errorResponse(res, 'Valid quantity is required', 400);
      }

      const item = await productionService.addStock(
        req.params.id,
        organizationId,
        quantity,
        reference,
        user._id,
        remarks
      );

      if (!item) {
        return notFoundResponse(res, 'Inventory item');
      }

      return successResponse(res, item, 'Stock added successfully');
    } catch (error) {
      logger.error('Add stock error:', error);
      next(error);
    }
  }

  /**
   * Remove stock from inventory
   */
  async removeStock(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { quantity, reference, remarks } = req.body;

      if (!quantity || quantity <= 0) {
        return errorResponse(res, 'Valid quantity is required', 400);
      }

      const item = await productionService.removeStock(
        req.params.id,
        organizationId,
        quantity,
        reference,
        user._id,
        remarks
      );

      if (!item) {
        return notFoundResponse(res, 'Inventory item');
      }

      return successResponse(res, item, 'Stock removed successfully');
    } catch (error) {
      logger.error('Remove stock error:', error);
      if (error.message === 'Insufficient stock') {
        return errorResponse(res, 'Insufficient stock', 400);
      }
      next(error);
    }
  }

  // ==================== CONFIG ====================

  /**
   * Get HM stages configuration
   */
  getHMStages(req, res) {
    const stages = productionService.getHMStages();
    return successResponse(res, stages, 'HM stages retrieved successfully');
  }

  /**
   * Get FM stages configuration
   */
  getFMStages(req, res) {
    const stages = productionService.getFMStages();
    return successResponse(res, stages, 'FM stages retrieved successfully');
  }
}

export default new ProductionController();