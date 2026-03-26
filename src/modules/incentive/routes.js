import express from 'express';
import { body, param, query } from 'express-validator';
import incentiveController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';
import { isHR } from '../../middleware/rbac.js';
import { setOrganizationInBody } from '../../middleware/tenant.js';

const router = express.Router();

router.use(auth);

// Get incentive dashboard stats
router.get('/dashboard',
  [
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    query('year').optional().isInt({ min: 2020, max: 2100 }).toInt(),
    query('department').optional().trim()
  ],
  validate,
  incentiveController.getDashboardStats
);

// Get incentive slabs
router.get('/slabs',
  incentiveController.getIncentiveSlabs
);

// Get pending approvals
router.get('/pending-approvals',
  isHR,
  [
    query('department').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  incentiveController.getPendingApprovals
);

// Get payment history
router.get('/payment-history',
  isHR,
  [
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    query('year').optional().isInt({ min: 2020, max: 2100 }).toInt(),
    query('department').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  incentiveController.getPaymentHistory
);

// Get all incentives (HR/Admin can see all, Employee can see own)
router.get('/',
  [
    query('employeeId').optional().isMongoId(),
    query('status').optional().isIn(['pending', 'paid', 'cancelled', 'approved']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  incentiveController.getIncentives
);

// Get payable incentives (HR/Admin only)
router.get('/payable',
  isHR,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  incentiveController.getPayableIncentives
);

// Approve incentive (HR/Admin)
router.put('/approve/:employeeId',
  isHR,
  [
    param('employeeId').isMongoId().withMessage('Invalid employee ID')
  ],
  validate,
  incentiveController.approveIncentive
);

// Get incentive by ID
router.get('/:id',
  [param('id').isMongoId().withMessage('Invalid incentive ID')],
  validate,
  incentiveController.getIncentive
);

// Create incentive (HR/Admin)
router.post('/',
  isHR,
  setOrganizationInBody,
  [
    body('employeeId').isMongoId().withMessage('Employee ID is required'),
    body('salesAmount').isFloat({ min: 0 }).withMessage('Sales amount must be non-negative'),
    body('incentiveAmount').isFloat({ min: 0 }).withMessage('Incentive amount is required'),
    body('reason').isIn(['early_payment', 'partial_payment', 'sales_completion', 'other']).withMessage('Valid reason is required'),
    body('salesDate').isISO8601().withMessage('Sales date is required'),
    body('description').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  incentiveController.createIncentive
);

// Update incentive (HR/Admin)
router.put('/:id',
  isHR,
  [
    param('id').isMongoId().withMessage('Invalid incentive ID'),
    body('salesAmount').optional().isFloat({ min: 0 }),
    body('incentiveAmount').optional().isFloat({ min: 0 }),
    body('description').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  incentiveController.updateIncentive
);

// Mark incentive as paid (HR/Admin)
router.put('/:id/pay',
  isHR,
  [
    param('id').isMongoId().withMessage('Invalid incentive ID'),
    body('paymentReference').optional().trim()
  ],
  validate,
  incentiveController.markAsPaid
);

// Cancel incentive (HR/Admin)
router.put('/:id/cancel',
  isHR,
  [
    param('id').isMongoId().withMessage('Invalid incentive ID'),
    body('reason').notEmpty().withMessage('Cancellation reason is required').trim()
  ],
  validate,
  incentiveController.cancelIncentive
);

// Get employee incentive summary
router.get('/employee/:employeeId/summary',
  [param('employeeId').isMongoId().withMessage('Invalid employee ID')],
  validate,
  incentiveController.getEmployeeIncentiveSummary
);

export default router;