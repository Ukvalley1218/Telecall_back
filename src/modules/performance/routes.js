import express from 'express';
import { query, param } from 'express-validator';
import performanceController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

router.use(auth);

/**
 * @route   GET /api/performance
 * @desc    Get performance data for all employees
 * @access  Private
 */
router.get('/',
  [
    query('department').optional().trim(),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020, max: 2030 })
  ],
  validate,
  performanceController.getPerformanceData
);

/**
 * @route   GET /api/performance/kpi-definitions
 * @desc    Get KPI definitions by group
 * @access  Private
 */
router.get('/kpi-definitions',
  [
    query('group').optional().trim()
  ],
  validate,
  performanceController.getKPIDefinitions
);

/**
 * @route   GET /api/performance/kpi-groups
 * @desc    Get KPI groups summary
 * @access  Private
 */
router.get('/kpi-groups',
  performanceController.getKPIGroupsSummary
);

/**
 * @route   GET /api/performance/:id
 * @desc    Get performance data for a single employee
 * @access  Private
 */
router.get('/:id',
  [param('id').isMongoId().withMessage('Invalid employee ID')],
  validate,
  performanceController.getEmployeePerformance
);

export default router;