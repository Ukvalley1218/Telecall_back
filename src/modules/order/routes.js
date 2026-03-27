import express from 'express';
import { body, param, query } from 'express-validator';
import orderController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// ==================== Dashboard & Stats Routes ====================

// Get dashboard statistics
router.get('/dashboard/stats',
  validate,
  orderController.getDashboardStats
);

// Get KPI data
router.get('/dashboard/kpi',
  validate,
  orderController.getKPIData
);

// Get pipeline data (orders grouped by stage)
router.get('/pipeline',
  validate,
  orderController.getPipeline
);

// Get delay alerts
router.get('/alerts/delays',
  validate,
  orderController.getDelayAlerts
);

// Get dispatch tracking data
router.get('/dispatch',
  validate,
  orderController.getDispatchData
);

// Get recent activity
router.get('/activity',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ],
  validate,
  orderController.getRecentActivity
);

// Get stage-wise statistics
router.get('/stats/stages',
  validate,
  orderController.getStageWiseStats
);

// Get statistics by date range
router.get('/stats/date-range',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  orderController.getStatsByDateRange
);

// ==================== Order CRUD Routes ====================

// Get all orders with filters
router.get('/orders',
  [
    query('status').optional().isIn(['new', 'in_production', 'completed', 'cancelled']),
    query('trackingStatus').optional().isIn(['on_track', 'delayed', 'completed', 'stuck']),
    query('orderType').optional().isIn(['FM', 'HM']),
    query('stage').optional().isIn([
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
    ]),
    query('assignedTeam').optional().trim(),
    query('supervisor').optional().trim(),
    query('search').optional().trim(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  orderController.getOrders
);

// Get orders by status
router.get('/orders/status/:status',
  [
    param('status').isIn(['new', 'in_production', 'completed', 'cancelled'])
  ],
  validate,
  orderController.getOrdersByStatus
);

// Get delayed orders
router.get('/orders/delayed',
  validate,
  orderController.getDelayedOrders
);

// Get order by ID
router.get('/orders/:id',
  [param('id').isMongoId().withMessage('Invalid order ID')],
  validate,
  orderController.getOrderById
);

// Create new order
router.post('/orders',
  [
    body('customer.name').notEmpty().withMessage('Customer name is required').trim(),
    body('customer.email').optional().isEmail().withMessage('Invalid email'),
    body('customer.phone').optional().trim(),
    body('product.name').notEmpty().withMessage('Product name is required').trim(),
    body('product.description').optional().trim(),
    body('product.category').optional().trim(),
    body('product.type').optional().isIn(['FM', 'HM']),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('orderType').isIn(['FM', 'HM']).withMessage('Order type must be FM or HM'),
    body('status').optional().isIn(['new', 'in_production', 'completed', 'cancelled']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('source').optional().isIn(['Website', 'Phone', 'Referral', 'Walk-in', 'Campaign', 'Other']),
    body('expectedDelivery').optional().isISO8601(),
    body('assignedTeam').optional().trim(),
    body('supervisor').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  orderController.createOrder
);

// Update order
router.put('/orders/:id',
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('customer.name').optional().trim(),
    body('customer.email').optional().isEmail(),
    body('customer.phone').optional().trim(),
    body('product.name').optional().trim(),
    body('amount').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['new', 'in_production', 'completed', 'cancelled']),
    body('trackingStatus').optional().isIn(['on_track', 'delayed', 'completed', 'stuck']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('expectedDelivery').optional().isISO8601(),
    body('assignedTeam').optional().trim(),
    body('supervisor').optional().trim(),
    body('notes').optional().trim(),
    body('remarks').optional().trim()
  ],
  validate,
  orderController.updateOrder
);

// Update order status
router.patch('/orders/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('status').isIn(['new', 'in_production', 'completed', 'cancelled']).withMessage('Invalid status')
  ],
  validate,
  orderController.updateOrderStatus
);

// Advance order to next stage
router.patch('/orders/:id/advance-stage',
  [param('id').isMongoId().withMessage('Invalid order ID')],
  validate,
  orderController.advanceStage
);

// Update order stage
router.patch('/orders/:id/stage',
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('stage').isIn([
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
    ]).withMessage('Invalid stage')
  ],
  validate,
  orderController.updateOrderStage
);

// Mark order as delayed
router.patch('/orders/:id/delay',
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('delayDays').isInt({ min: 0 }).withMessage('Delay days must be a non-negative integer'),
    body('delayReason').optional().trim()
  ],
  validate,
  orderController.markAsDelayed
);

// Add customer review
router.post('/orders/:id/review',
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review').optional().trim()
  ],
  validate,
  orderController.addCustomerReview
);

// Delete order
router.delete('/orders/:id',
  [param('id').isMongoId().withMessage('Invalid order ID')],
  validate,
  orderController.deleteOrder
);

// ==================== Configuration Routes ====================

// Get teams
router.get('/config/teams',
  validate,
  orderController.getTeams
);

// Get stage mappings
router.get('/config/stage-mappings',
  [
    query('orderType').optional().isIn(['FM', 'HM'])
  ],
  validate,
  orderController.getStageMappings
);

// Get production stages
router.get('/config/production-stages',
  validate,
  orderController.getProductionStages
);

export default router;