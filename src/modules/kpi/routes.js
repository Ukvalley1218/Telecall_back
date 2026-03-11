import express from 'express';
import { body, param, query } from 'express-validator';
import kpiController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';
import { isAdmin } from '../../middleware/rbac.js';
import { setOrganizationInBody } from '../../middleware/tenant.js';

const router = express.Router();

router.use(auth);

const validGroups = ['Sales', 'Design', 'Production', 'Recruitment', 'IT', 'Marketing', 'Finance', 'Support', 'Quality', 'Operations', 'Other'];

// Get KPI groups
router.get('/groups/list',
  kpiController.getKPIGroups
);

// Get all KPIs
router.get('/',
  [
    query('group').optional().isIn(validGroups),
    query('isActive').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  kpiController.getKPIs
);

// Get KPI by ID
router.get('/:id',
  [param('id').isMongoId().withMessage('Invalid KPI ID')],
  validate,
  kpiController.getKPI
);

// Create KPI (Admin only)
router.post('/',
  isAdmin,
  setOrganizationInBody,
  [
    body('name').notEmpty().withMessage('KPI name is required').trim(),
    body('description').optional().trim(),
    body('unit').isIn(['Rs', 'Count', 'Percentage', 'Hours', 'Days']).withMessage('Valid unit is required'),
    body('group').isIn(validGroups).withMessage('Valid group is required'),
    body('targetValue').isFloat({ min: 0 }).withMessage('Target value must be non-negative'),
    body('maxValue').optional().isFloat({ min: 0 }),
    body('weightage').optional().isFloat({ min: 0.1, max: 10 }),
    body('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  ],
  validate,
  kpiController.createKPI
);

// Update KPI (Admin only)
router.put('/:id',
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid KPI ID'),
    body('name').optional().trim(),
    body('description').optional().trim(),
    body('targetValue').optional().isFloat({ min: 0 }),
    body('maxValue').optional().isFloat({ min: 0 }),
    body('weightage').optional().isFloat({ min: 0.1, max: 10 }),
    body('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  ],
  validate,
  kpiController.updateKPI
);

// Deactivate KPI (Admin only)
router.delete('/:id',
  isAdmin,
  [param('id').isMongoId().withMessage('Invalid KPI ID')],
  validate,
  kpiController.deactivateKPI
);

export default router;