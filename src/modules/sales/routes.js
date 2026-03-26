import express from 'express';
import { body, param, query } from 'express-validator';
import salesController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Dashboard routes
router.get('/dashboard/stats',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('department').optional().trim()
  ],
  validate,
  salesController.getDashboardStats
);

router.get('/dashboard/critical-alerts',
  validate,
  salesController.getCriticalAlerts
);

// Report routes
router.get('/report',
  [
    query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
  ],
  validate,
  salesController.getSalesReport
);

// Pipeline routes
router.get('/pipeline',
  validate,
  salesController.getPipeline
);

// Lead CRUD routes
router.get('/leads',
  [
    query('stage').optional().isIn([
      'Marketing Lead Generation',
      'Telecalling',
      'Appointment',
      'Visit',
      '3D (Pending Approval)',
      'Quotation',
      'Deal Won',
      'Deal Lost'
    ]),
    query('leadType').optional().isIn(['new', 'followup']),
    query('status').optional().isIn(['active', 'won', 'lost', 'archived']),
    query('search').optional().trim(),
    query('assignedTo').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  salesController.getLeads
);

router.get('/leads/:id',
  [param('id').isMongoId().withMessage('Invalid lead ID')],
  validate,
  salesController.getLeadById
);

router.post('/leads',
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('client').notEmpty().withMessage('Client name is required').trim(),
    body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('stage').optional().isIn([
      'Marketing Lead Generation',
      'Telecalling',
      'Appointment',
      'Visit',
      '3D (Pending Approval)',
      'Quotation',
      'Deal Won',
      'Deal Lost'
    ]),
    body('leadType').optional().isIn(['new', 'followup']),
    body('priority').optional().isIn(['High', 'Medium', 'Low']),
    body('source').optional().isIn(['Website', 'Referral', 'Trade Show', 'Cold Call', 'Instagram', 'Facebook', 'Google Ads', 'Other']),
    body('company').optional().trim(),
    body('description').optional().trim(),
    body('notes').optional().trim(),
    body('expectedCloseDate').optional().isISO8601()
  ],
  validate,
  salesController.createLead
);

router.put('/leads/:id',
  [
    param('id').isMongoId().withMessage('Invalid lead ID'),
    body('title').optional().trim(),
    body('client').optional().trim(),
    body('value').optional().isFloat({ min: 0 }),
    body('stage').optional().isIn([
      'Marketing Lead Generation',
      'Telecalling',
      'Appointment',
      'Visit',
      '3D (Pending Approval)',
      'Quotation',
      'Deal Won',
      'Deal Lost'
    ]),
    body('leadType').optional().isIn(['new', 'followup']),
    body('priority').optional().isIn(['High', 'Medium', 'Low']),
    body('source').optional().isIn(['Website', 'Referral', 'Trade Show', 'Cold Call', 'Instagram', 'Facebook', 'Google Ads', 'Other']),
    body('status').optional().isIn(['active', 'won', 'lost', 'archived'])
  ],
  validate,
  salesController.updateLead
);

router.put('/leads/:id/stage',
  [
    param('id').isMongoId().withMessage('Invalid lead ID'),
    body('stage').notEmpty().withMessage('Stage is required').isIn([
      'Marketing Lead Generation',
      'Telecalling',
      'Appointment',
      'Visit',
      '3D (Pending Approval)',
      'Quotation',
      'Deal Won',
      'Deal Lost'
    ])
  ],
  validate,
  salesController.moveLeadStage
);

router.patch('/leads/:id/toggle-type',
  [param('id').isMongoId().withMessage('Invalid lead ID')],
  validate,
  salesController.toggleLeadType
);

router.delete('/leads/:id',
  [param('id').isMongoId().withMessage('Invalid lead ID')],
  validate,
  salesController.deleteLead
);

router.delete('/leads/:id/permanent',
  [param('id').isMongoId().withMessage('Invalid lead ID')],
  validate,
  salesController.hardDeleteLead
);

// Quotations routes
router.get('/quotations',
  [
    query('status').optional().trim(),
    query('search').optional().trim()
  ],
  validate,
  salesController.getQuotations
);

router.get('/quotations/stats',
  validate,
  salesController.getQuotationStats
);

router.get('/quotations/:id',
  [param('id').isMongoId().withMessage('Invalid quotation ID')],
  validate,
  salesController.getQuotationById
);

router.post('/quotations',
  [
    body('clientName').notEmpty().withMessage('Client name is required').trim(),
    body('projectType').optional().trim(),
    body('products').isArray({ min: 1 }).withMessage('At least one product is required'),
    body('products.*.name').notEmpty().withMessage('Product name is required'),
    body('products.*.quantity').optional().isInt({ min: 1 }),
    body('products.*.pricePerUnit').isFloat({ min: 0 }).withMessage('Price per unit must be a positive number'),
    body('taxPercent').optional().isFloat({ min: 0, max: 100 }),
    body('validUntilDays').optional().isInt({ min: 1, max: 365 }),
    body('notes').optional().trim()
  ],
  validate,
  salesController.createQuotation
);

router.put('/quotations/:id',
  [
    param('id').isMongoId().withMessage('Invalid quotation ID'),
    body('clientName').optional().trim(),
    body('projectType').optional().trim(),
    body('products').optional().isArray({ min: 1 }),
    body('taxPercent').optional().isFloat({ min: 0, max: 100 }),
    body('validUntilDays').optional().isInt({ min: 1, max: 365 }),
    body('notes').optional().trim()
  ],
  validate,
  salesController.updateQuotation
);

router.patch('/quotations/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid quotation ID'),
    body('status').isIn(['Draft', 'Sent', 'Pending', 'Negotiation', 'Accepted', 'Rejected', 'Expired']).withMessage('Invalid status'),
    body('notes').optional().trim()
  ],
  validate,
  salesController.updateQuotationStatus
);

router.delete('/quotations/:id',
  [param('id').isMongoId().withMessage('Invalid quotation ID')],
  validate,
  salesController.deleteQuotation
);

// Client milestones routes
router.get('/client-milestones',
  validate,
  salesController.getClientMilestones
);

// ==================== MILESTONE ROUTES ====================

// Get all milestones (optionally filter by salesLeadId)
router.get('/milestones',
  [
    query('salesLeadId').optional().isMongoId().withMessage('Invalid sales lead ID')
  ],
  validate,
  salesController.getMilestones
);

// Get milestone statistics
router.get('/milestones/stats',
  validate,
  salesController.getMilestoneStats
);

// Get milestones for won deals
router.get('/milestones/won-deals',
  validate,
  salesController.getWonDealMilestones
);

// Get milestone by ID
router.get('/milestones/:id',
  [param('id').isMongoId().withMessage('Invalid milestone ID')],
  validate,
  salesController.getMilestoneById
);

// Create milestone
router.post('/milestones',
  [
    body('salesLeadId').isMongoId().withMessage('Sales lead ID is required'),
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('milestoneType').optional().isIn(['payment', 'design_approval', 'material_delivery', 'installation', 'handover', 'other']),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
    body('paymentStatus').optional().isIn(['unpaid', 'partial', 'paid']),
    body('priority').optional().isIn(['High', 'Medium', 'Low']),
    body('dueDate').optional().isISO8601(),
    body('description').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  salesController.createMilestone
);

// Update milestone
router.put('/milestones/:id',
  [
    param('id').isMongoId().withMessage('Invalid milestone ID'),
    body('title').optional().trim(),
    body('amount').optional().isFloat({ min: 0 }),
    body('milestoneType').optional().isIn(['payment', 'design_approval', 'material_delivery', 'installation', 'handover', 'other']),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
    body('paymentStatus').optional().isIn(['unpaid', 'partial', 'paid']),
    body('priority').optional().isIn(['High', 'Medium', 'Low']),
    body('dueDate').optional().isISO8601(),
    body('description').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  salesController.updateMilestone
);

// Update milestone status
router.patch('/milestones/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid milestone ID'),
    body('status').isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('paymentStatus').optional().isIn(['unpaid', 'partial', 'paid'])
  ],
  validate,
  salesController.updateMilestoneStatus
);

// Delete milestone
router.delete('/milestones/:id',
  [param('id').isMongoId().withMessage('Invalid milestone ID')],
  validate,
  salesController.deleteMilestone
);

export default router;