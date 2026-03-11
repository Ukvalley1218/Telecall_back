import express from 'express';
import { body, param, query } from 'express-validator';
import employeeController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';
import { isHR, canAccessResource } from '../../middleware/rbac.js';
import { setOrganizationInBody } from '../../middleware/tenant.js';

const router = express.Router();

router.use(auth);

// Get all employees
router.get('/',
  [
    query('status').optional().isIn(['active', 'inactive', 'on_leave', 'terminated']),
    query('department').optional().trim(),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  employeeController.getEmployees
);

// Get employee by ID
router.get('/:id',
  [param('id').isMongoId().withMessage('Invalid employee ID')],
  validate,
  employeeController.getEmployee
);

// Create new employee (HR/Admin)
router.post('/',
  isHR,
  setOrganizationInBody,
  [
    body('personalInfo.firstName').notEmpty().withMessage('First name is required').trim(),
    body('personalInfo.lastName').notEmpty().withMessage('Last name is required').trim(),
    body('personalInfo.email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('personalInfo.phone').notEmpty().withMessage('Phone is required').trim(),
    body('employment.department').notEmpty().withMessage('Department is required').trim(),
    body('employment.designation').notEmpty().withMessage('Designation is required').trim(),
    body('employment.joiningDate').isISO8601().withMessage('Valid joining date is required'),
    body('employment.employmentType').optional().isIn(['full-time', 'part-time', 'contract']),
    body('shiftId').optional().isMongoId().withMessage('Invalid shift ID'),
    body('createUserAccount').optional().isBoolean()
  ],
  validate,
  employeeController.createEmployee
);

// Update employee (HR/Admin)
router.put('/:id',
  isHR,
  [
    param('id').isMongoId().withMessage('Invalid employee ID'),
    body('personalInfo.firstName').optional().trim(),
    body('personalInfo.lastName').optional().trim(),
    body('personalInfo.phone').optional().trim(),
    body('employment.department').optional().trim(),
    body('employment.designation').optional().trim(),
    body('status').optional().isIn(['active', 'inactive', 'on_leave', 'terminated'])
  ],
  validate,
  employeeController.updateEmployee
);

// Assign shift to employee
router.put('/:id/assign-shift',
  isHR,
  [
    param('id').isMongoId().withMessage('Invalid employee ID'),
    body('shiftId').notEmpty().withMessage('Shift ID is required').isMongoId()
  ],
  validate,
  employeeController.assignShift
);

// Assign KPI to employee
router.put('/:id/assign-kpi',
  isHR,
  [
    param('id').isMongoId().withMessage('Invalid employee ID'),
    body('kpiId').notEmpty().withMessage('KPI ID is required').isMongoId(),
    body('targetValue').isFloat({ min: 0 }).withMessage('Target value is required')
  ],
  validate,
  employeeController.assignKPI
);

// Toggle overtime eligibility
router.put('/:id/overtime',
  isHR,
  [
    param('id').isMongoId().withMessage('Invalid employee ID'),
    body('allowed').isBoolean().withMessage('Allowed must be boolean')
  ],
  validate,
  employeeController.toggleOvertime
);

// Deactivate employee
router.delete('/:id',
  isHR,
  [param('id').isMongoId().withMessage('Invalid employee ID')],
  validate,
  employeeController.deactivateEmployee
);

// Get employee attendance summary
router.get('/:id/attendance',
  canAccessResource('id'),
  [
    param('id').isMongoId().withMessage('Invalid employee ID'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validate,
  employeeController.getAttendanceSummary
);

// Get employee incentives
router.get('/:id/incentives',
  canAccessResource('id'),
  [param('id').isMongoId().withMessage('Invalid employee ID')],
  validate,
  employeeController.getIncentives
);

export default router;