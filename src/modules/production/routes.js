import express from 'express';
import { body, param, query } from 'express-validator';
import productionController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// ==================== DASHBOARD Routes ====================

// Get HM Dashboard stats
router.get('/dashboard/hm',
  validate,
  productionController.getHMDashboardStats
);

// Get FM Dashboard stats
router.get('/dashboard/fm',
  validate,
  productionController.getFMDashboardStats
);

// ==================== WORK ORDERS (HM) Routes ====================

// Get all work orders
router.get('/work-orders',
  [
    query('status').optional().isIn(['Active', 'Delayed', 'Completed', 'On Hold']),
    query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    query('qcStatus').optional().isIn(['Pending', 'In Progress', 'Passed', 'Failed', 'Rework']),
    query('materialStatus').optional().isIn(['Ready', 'Partial', 'Missing', 'Ordered', 'In Transit']),
    query('assignedArtisan').optional().isMongoId().withMessage('Invalid artisan ID'),
    query('search').optional().trim(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  productionController.getWorkOrders
);

// Get work order by ID
router.get('/work-orders/:id',
  [param('id').isMongoId().withMessage('Invalid work order ID')],
  validate,
  productionController.getWorkOrderById
);

// Create work order
router.post('/work-orders',
  [
    body('clientName').notEmpty().withMessage('Client name is required').trim(),
    body('projectName').notEmpty().withMessage('Project name is required').trim(),
    body('workOrderRef').optional().trim(),
    body('orderType').optional().isIn(['HM', 'FM']),
    body('dueDate').optional().isISO8601(),
    body('startDate').optional().isISO8601(),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('assignedArtisan').optional().isMongoId().withMessage('Invalid artisan ID'),
    body('clientPhone').optional().trim(),
    body('clientEmail').optional().isEmail().withMessage('Invalid email'),
    body('clientAddress').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  productionController.createWorkOrder
);

// Update work order
router.put('/work-orders/:id',
  [
    param('id').isMongoId().withMessage('Invalid work order ID'),
    body('clientName').optional().trim(),
    body('projectName').optional().trim(),
    body('dueDate').optional().isISO8601(),
    body('startDate').optional().isISO8601(),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('status').optional().isIn(['Active', 'Delayed', 'Completed', 'On Hold']),
    body('assignedArtisan').optional().isMongoId(),
    body('notes').optional().trim()
  ],
  validate,
  productionController.updateWorkOrder
);

// Update work order stage
router.patch('/work-orders/:id/stage',
  [
    param('id').isMongoId().withMessage('Invalid work order ID'),
    body('stageKey').notEmpty().withMessage('Stage key is required').isIn([
      'supervisor', 'workingTeam', 'purchase', 'delivery', 'startWork',
      'stage', 's1Structure', 's2Laminate', 's3Hardware', 'qc', 'remark', 'handover', 'clientSatisfaction'
    ]).withMessage('Invalid stage key'),
    body('stageData').notEmpty().withMessage('Stage data is required'),
    body('stageData.status').optional().isIn(['Pending', 'In Progress', 'Completed', 'On Hold']),
    body('stageData.remarks').optional().trim()
  ],
  validate,
  productionController.updateWorkOrderStage
);

// Delete work order
router.delete('/work-orders/:id',
  [param('id').isMongoId().withMessage('Invalid work order ID')],
  validate,
  productionController.deleteWorkOrder
);

// ==================== BATCH ORDERS (FM) Routes ====================

// Get all batch orders
router.get('/batch-orders',
  [
    query('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Delayed', 'Cancelled']),
    query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    query('productionLine').optional().isMongoId().withMessage('Invalid production line ID'),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  productionController.getBatchOrders
);

// Get batch order by ID
router.get('/batch-orders/:id',
  [param('id').isMongoId().withMessage('Invalid batch order ID')],
  validate,
  productionController.getBatchOrderById
);

// Create batch order
router.post('/batch-orders',
  [
    body('clientName').notEmpty().withMessage('Client name is required').trim(),
    body('projectName').notEmpty().withMessage('Project name is required').trim(),
    body('batchRef').optional().trim(),
    body('dueDate').optional().isISO8601(),
    body('startDate').optional().isISO8601(),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('productionLine').optional().isMongoId().withMessage('Invalid production line ID'),
    body('quantity').optional().isInt({ min: 1 }),
    body('clientPhone').optional().trim(),
    body('clientEmail').optional().isEmail().withMessage('Invalid email'),
    body('clientAddress').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  productionController.createBatchOrder
);

// Update batch order
router.put('/batch-orders/:id',
  [
    param('id').isMongoId().withMessage('Invalid batch order ID'),
    body('clientName').optional().trim(),
    body('projectName').optional().trim(),
    body('dueDate').optional().isISO8601(),
    body('startDate').optional().isISO8601(),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Delayed', 'Cancelled']),
    body('productionLine').optional().isMongoId(),
    body('quantity').optional().isInt({ min: 1 }),
    body('notes').optional().trim()
  ],
  validate,
  productionController.updateBatchOrder
);

// Update batch order stage
router.patch('/batch-orders/:id/stage',
  [
    param('id').isMongoId().withMessage('Invalid batch order ID'),
    body('stageKey').notEmpty().withMessage('Stage key is required').isIn([
      'materialReceived', 'preInstallation', 'vendorPurchase', 'hardwarePurchase',
      'itPlanning', 'supervisor', 'measurementTeam', 'delivery',
      'installationStart', 'rework', 'qualityCheck', 'final', 'handover'
    ]).withMessage('Invalid stage key'),
    body('stageData').notEmpty().withMessage('Stage data is required'),
    body('stageData.status').optional().isIn(['Pending', 'In Progress', 'Completed', 'On Hold']),
    body('stageData.remarks').optional().trim()
  ],
  validate,
  productionController.updateBatchOrderStage
);

// Delete batch order
router.delete('/batch-orders/:id',
  [param('id').isMongoId().withMessage('Invalid batch order ID')],
  validate,
  productionController.deleteBatchOrder
);

// ==================== ARTISANS Routes ====================

// Get all artisans
router.get('/artisans',
  [
    query('status').optional().isIn(['Available', 'On Project', 'On Leave', 'Overloaded']),
    query('skillCategory').optional().isIn(['Carpenter', 'Welder', 'Electrician', 'Plumber', 'Painter', 'General', 'Supervisor']),
    query('search').optional().trim()
  ],
  validate,
  productionController.getArtisans
);

// Get artisan by ID
router.get('/artisans/:id',
  [param('id').isMongoId().withMessage('Invalid artisan ID')],
  validate,
  productionController.getArtisanById
);

// Create artisan
router.post('/artisans',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('skillCategory').isIn(['Carpenter', 'Welder', 'Electrician', 'Plumber', 'Painter', 'General', 'Supervisor']).withMessage('Invalid skill category'),
    body('phone').optional().trim(),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('status').optional().isIn(['Available', 'On Project', 'On Leave', 'Overloaded']),
    body('dailyRate').optional().isFloat({ min: 0 }),
    body('experience').optional().isInt({ min: 0 }),
    body('notes').optional().trim()
  ],
  validate,
  productionController.createArtisan
);

// Update artisan
router.put('/artisans/:id',
  [
    param('id').isMongoId().withMessage('Invalid artisan ID'),
    body('name').optional().trim(),
    body('skillCategory').optional().isIn(['Carpenter', 'Welder', 'Electrician', 'Plumber', 'Painter', 'General', 'Supervisor']),
    body('phone').optional().trim(),
    body('email').optional().isEmail(),
    body('status').optional().isIn(['Available', 'On Project', 'On Leave', 'Overloaded']),
    body('dailyRate').optional().isFloat({ min: 0 }),
    body('experience').optional().isInt({ min: 0 }),
    body('notes').optional().trim()
  ],
  validate,
  productionController.updateArtisan
);

// Delete artisan
router.delete('/artisans/:id',
  [param('id').isMongoId().withMessage('Invalid artisan ID')],
  validate,
  productionController.deleteArtisan
);

// ==================== MATERIALS Routes ====================

// Get all materials
router.get('/materials',
  [
    query('status').optional().isIn(['Ready', 'Partial', 'Missing', 'Ordered', 'In Transit']),
    query('category').optional().isIn(['Raw Material', 'Hardware', 'Finish', 'Consumable']),
    query('workOrderId').optional().isMongoId().withMessage('Invalid work order ID'),
    query('search').optional().trim()
  ],
  validate,
  productionController.getMaterials
);

// Get material by ID
router.get('/materials/:id',
  [param('id').isMongoId().withMessage('Invalid material ID')],
  validate,
  productionController.getMaterialById
);

// Create material
router.post('/materials',
  [
    body('materialName').notEmpty().withMessage('Material name is required').trim(),
    body('category').isIn(['Raw Material', 'Hardware', 'Finish', 'Consumable']).withMessage('Invalid category'),
    body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('unit').optional().trim(),
    body('unitCost').optional().isFloat({ min: 0 }),
    body('totalCost').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['Ready', 'Partial', 'Missing', 'Ordered', 'In Transit']),
    body('workOrderId').optional().isMongoId().withMessage('Invalid work order ID'),
    body('supplier').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  productionController.createMaterial
);

// Update material
router.put('/materials/:id',
  [
    param('id').isMongoId().withMessage('Invalid material ID'),
    body('materialName').optional().trim(),
    body('category').optional().isIn(['Raw Material', 'Hardware', 'Finish', 'Consumable']),
    body('quantity').optional().isFloat({ min: 0 }),
    body('unit').optional().trim(),
    body('unitCost').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['Ready', 'Partial', 'Missing', 'Ordered', 'In Transit']),
    body('supplier').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  productionController.updateMaterial
);

// Delete material
router.delete('/materials/:id',
  [param('id').isMongoId().withMessage('Invalid material ID')],
  validate,
  productionController.deleteMaterial
);

// ==================== QUALITY CHECKS Routes ====================

// Get all quality checks
router.get('/quality-checks',
  [
    query('status').optional().isIn(['Pending', 'In Progress', 'Passed', 'Failed', 'Rework']),
    query('qcType').optional().isIn(['Work Order', 'Batch Order', 'Final']),
    query('workOrderId').optional().isMongoId().withMessage('Invalid work order ID'),
    query('search').optional().trim()
  ],
  validate,
  productionController.getQualityChecks
);

// Get quality check by ID
router.get('/quality-checks/:id',
  [param('id').isMongoId().withMessage('Invalid quality check ID')],
  validate,
  productionController.getQualityCheckById
);

// Create quality check
router.post('/quality-checks',
  [
    body('qcType').isIn(['Work Order', 'Batch Order', 'Final']).withMessage('Invalid QC type'),
    body('workOrderId').optional().isMongoId().withMessage('Invalid work order ID'),
    body('batchOrderId').optional().isMongoId().withMessage('Invalid batch order ID'),
    body('workOrderRef').optional().trim(),
    body('batchOrderRef').optional().trim(),
    body('inspector').optional().trim(),
    body('status').optional().isIn(['Pending', 'In Progress', 'Passed', 'Failed', 'Rework']),
    body('overallScore').optional().isInt({ min: 0, max: 100 }),
    body('notes').optional().trim()
  ],
  validate,
  productionController.createQualityCheck
);

// Update quality check
router.put('/quality-checks/:id',
  [
    param('id').isMongoId().withMessage('Invalid quality check ID'),
    body('status').optional().isIn(['Pending', 'In Progress', 'Passed', 'Failed', 'Rework']),
    body('overallScore').optional().isInt({ min: 0, max: 100 }),
    body('inspector').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  productionController.updateQualityCheck
);

// Delete quality check
router.delete('/quality-checks/:id',
  [param('id').isMongoId().withMessage('Invalid quality check ID')],
  validate,
  productionController.deleteQualityCheck
);

// ==================== PRODUCTION LINES Routes ====================

// Get all production lines
router.get('/production-lines',
  [
    query('status').optional().isIn(['Running', 'Maintenance', 'Stopped']),
    query('type').optional().isIn(['Assembly', 'Cutting', 'Finishing', 'Edge Banding', 'Pressing', 'Packing']),
    query('search').optional().trim()
  ],
  validate,
  productionController.getProductionLines
);

// Get production line by ID
router.get('/production-lines/:id',
  [param('id').isMongoId().withMessage('Invalid production line ID')],
  validate,
  productionController.getProductionLineById
);

// Create production line
router.post('/production-lines',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('type').isIn(['Assembly', 'Cutting', 'Finishing', 'Edge Banding', 'Pressing', 'Packing']).withMessage('Invalid type'),
    body('status').optional().isIn(['Running', 'Maintenance', 'Stopped']),
    body('capacity').optional().isInt({ min: 0 }),
    body('location').optional().trim(),
    body('operator').optional().trim(),
    body('shift').optional().isIn(['Morning', 'Evening', 'Night']),
    body('workers').optional().isInt({ min: 0 }),
    body('notes').optional().trim()
  ],
  validate,
  productionController.createProductionLine
);

// Update production line
router.put('/production-lines/:id',
  [
    param('id').isMongoId().withMessage('Invalid production line ID'),
    body('name').optional().trim(),
    body('type').optional().isIn(['Assembly', 'Cutting', 'Finishing', 'Edge Banding', 'Pressing', 'Packing']),
    body('status').optional().isIn(['Running', 'Maintenance', 'Stopped']),
    body('capacity').optional().isInt({ min: 0 }),
    body('location').optional().trim(),
    body('operator').optional().trim(),
    body('shift').optional().isIn(['Morning', 'Evening', 'Night']),
    body('workers').optional().isInt({ min: 0 }),
    body('notes').optional().trim()
  ],
  validate,
  productionController.updateProductionLine
);

// ==================== INVENTORY Routes ====================

// Get all inventory
router.get('/inventory',
  [
    query('status').optional().isIn(['In Stock', 'Low Stock', 'Critical', 'Out of Stock']),
    query('category').optional().isIn(['Raw Material', 'Hardware', 'Finish', 'Consumable']),
    query('search').optional().trim()
  ],
  validate,
  productionController.getInventory
);

// Get inventory item by ID
router.get('/inventory/:id',
  [param('id').isMongoId().withMessage('Invalid inventory ID')],
  validate,
  productionController.getInventoryById
);

// Create inventory item
router.post('/inventory',
  [
    body('itemName').notEmpty().withMessage('Item name is required').trim(),
    body('category').isIn(['Raw Material', 'Hardware', 'Finish', 'Consumable']).withMessage('Invalid category'),
    body('sku').optional().trim(),
    body('unit').optional().trim(),
    body('currentStock').optional().isFloat({ min: 0 }),
    body('minStock').optional().isFloat({ min: 0 }),
    body('maxStock').optional().isFloat({ min: 0 }),
    body('reorderLevel').optional().isFloat({ min: 0 }),
    body('unitCost').optional().isFloat({ min: 0 }),
    body('supplier').optional().trim(),
    body('supplierContact').optional().trim(),
    body('location').optional().trim(),
    body('qualityGrade').optional().isIn(['A', 'B', 'C']),
    body('notes').optional().trim()
  ],
  validate,
  productionController.createInventoryItem
);

// Update inventory item
router.put('/inventory/:id',
  [
    param('id').isMongoId().withMessage('Invalid inventory ID'),
    body('itemName').optional().trim(),
    body('category').optional().isIn(['Raw Material', 'Hardware', 'Finish', 'Consumable']),
    body('sku').optional().trim(),
    body('unit').optional().trim(),
    body('currentStock').optional().isFloat({ min: 0 }),
    body('minStock').optional().isFloat({ min: 0 }),
    body('maxStock').optional().isFloat({ min: 0 }),
    body('reorderLevel').optional().isFloat({ min: 0 }),
    body('unitCost').optional().isFloat({ min: 0 }),
    body('supplier').optional().trim(),
    body('location').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  productionController.updateInventoryItem
);

// Add stock to inventory
router.post('/inventory/:id/add-stock',
  [
    param('id').isMongoId().withMessage('Invalid inventory ID'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Valid quantity is required'),
    body('reference').optional().trim(),
    body('remarks').optional().trim()
  ],
  validate,
  productionController.addStock
);

// Remove stock from inventory
router.post('/inventory/:id/remove-stock',
  [
    param('id').isMongoId().withMessage('Invalid inventory ID'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Valid quantity is required'),
    body('reference').optional().trim(),
    body('remarks').optional().trim()
  ],
  validate,
  productionController.removeStock
);

// ==================== CONFIG Routes ====================

// Get HM stages configuration
router.get('/config/hm-stages',
  validate,
  productionController.getHMStages
);

// Get FM stages configuration
router.get('/config/fm-stages',
  validate,
  productionController.getFMStages
);

// ==================== PHOTO Routes ====================

// Upload work order photo (HM)
router.post('/work-orders/:id/photos/:photoType',
  [
    param('id').isMongoId().withMessage('Invalid work order ID'),
    param('photoType').isIn(['beforeDispatch', 'beforeInstallation', 'afterInstallation']).withMessage('Invalid photo type'),
    body('url').notEmpty().withMessage('Photo URL is required'),
    body('publicId').optional().trim(),
    body('remarks').optional().trim()
  ],
  validate,
  productionController.uploadWorkOrderPhoto
);

// Delete work order photo (HM)
router.delete('/work-orders/:id/photos/:photoType',
  [
    param('id').isMongoId().withMessage('Invalid work order ID'),
    param('photoType').isIn(['beforeDispatch', 'beforeInstallation', 'afterInstallation']).withMessage('Invalid photo type')
  ],
  validate,
  productionController.deleteWorkOrderPhoto
);

// Upload batch order photo (FM)
router.post('/batch-orders/:id/photos/:photoType',
  [
    param('id').isMongoId().withMessage('Invalid batch order ID'),
    param('photoType').isIn(['beforeDispatch', 'beforeInstallation', 'afterInstallation']).withMessage('Invalid photo type'),
    body('url').notEmpty().withMessage('Photo URL is required'),
    body('publicId').optional().trim(),
    body('remarks').optional().trim()
  ],
  validate,
  productionController.uploadBatchOrderPhoto
);

// Delete batch order photo (FM)
router.delete('/batch-orders/:id/photos/:photoType',
  [
    param('id').isMongoId().withMessage('Invalid batch order ID'),
    param('photoType').isIn(['beforeDispatch', 'beforeInstallation', 'afterInstallation']).withMessage('Invalid photo type')
  ],
  validate,
  productionController.deleteBatchOrderPhoto
);

export default router;