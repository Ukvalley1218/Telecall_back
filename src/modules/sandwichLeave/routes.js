import express from 'express';
import { body, param, query } from 'express-validator';
import sandwichLeaveController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';
import { isHR } from '../../middleware/rbac.js';
import { setOrganizationInBody } from '../../middleware/tenant.js';

const router = express.Router();

router.use(auth);

// Get all sandwich leaves (HR/Admin)
router.get('/',
  isHR,
  [
    query('employeeId').optional().isMongoId(),
    query('status').optional().isIn(['pending', 'approved', 'rejected']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  sandwichLeaveController.getSandwichLeaves
);

// Get sandwich leave by ID
router.get('/:id',
  [param('id').isMongoId().withMessage('Invalid sandwich leave ID')],
  validate,
  sandwichLeaveController.getSandwichLeave
);

// Create sandwich leave (HR/Admin)
router.post('/',
  isHR,
  setOrganizationInBody,
  [
    body('employeeId').isMongoId().withMessage('Employee ID is required'),
    body('leaveDates').isArray({ min: 1 }).withMessage('Leave dates are required'),
    body('leaveDates.*').isISO8601().withMessage('Invalid date format'),
    body('deductionType').optional().isIn(['1x', '2x']).withMessage('Invalid deduction type'),
    body('reason').notEmpty().withMessage('Reason is required').trim(),
    body('notes').optional().trim()
  ],
  validate,
  sandwichLeaveController.createSandwichLeave
);

// Approve sandwich leave (HR/Admin)
router.put('/:id/approve',
  isHR,
  [param('id').isMongoId().withMessage('Invalid sandwich leave ID')],
  validate,
  sandwichLeaveController.approveSandwichLeave
);

// Reject sandwich leave (HR/Admin)
router.put('/:id/reject',
  isHR,
  [
    param('id').isMongoId().withMessage('Invalid sandwich leave ID'),
    body('reason').optional().trim()
  ],
  validate,
  sandwichLeaveController.rejectSandwichLeave
);

// Delete sandwich leave (HR/Admin - only if pending)
router.delete('/:id',
  isHR,
  [param('id').isMongoId().withMessage('Invalid sandwich leave ID')],
  validate,
  sandwichLeaveController.deleteSandwichLeave
);

export default router;