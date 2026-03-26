import express from 'express';
import { query } from 'express-validator';
import payrollController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';
import { isHR } from '../../middleware/rbac.js';

const router = express.Router();

router.use(auth);

// Get payroll dashboard stats
router.get('/dashboard',
  payrollController.getDashboardStats
);

// Get department-wise salary breakdown
router.get('/department-breakdown',
  [
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    query('year').optional().isInt({ min: 2020, max: 2100 }).toInt()
  ],
  validate,
  payrollController.getDepartmentBreakdown
);

// Get employee salaries
router.get('/employees',
  [
    query('department').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  payrollController.getEmployeeSalaries
);

// Get payroll processing status
router.get('/processing-status',
  [
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    query('year').optional().isInt({ min: 2020, max: 2100 }).toInt()
  ],
  validate,
  payrollController.getProcessingStatus
);

// Get incentive slabs configuration
router.get('/incentive-slabs',
  payrollController.getIncentiveSlabs
);

// Get sales incentive data for calculator
router.get('/sales-incentives',
  [
    query('employeeId').optional().trim(),
    query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
    query('year').optional().isInt({ min: 2020, max: 2100 }).toInt()
  ],
  validate,
  payrollController.getSalesIncentiveData
);

// Get single employee salary details
router.get('/employee/:employeeId',
  payrollController.getEmployeeSalaryDetails
);

export default router;