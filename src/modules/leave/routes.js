import express from 'express';
import { body, param, query } from 'express-validator';
import leaveController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

router.use(auth);

/**
 * @route   GET /api/leave/types
 * @desc    Get leave types
 * @access  Private
 */
router.get('/types', leaveController.getLeaveTypes);

/**
 * @route   GET /api/leave/departments
 * @desc    Get departments list
 * @access  Private
 */
router.get('/departments', leaveController.getDepartments);

/**
 * @route   GET /api/leave/summary
 * @desc    Get leave summary for dashboard
 * @access  Private
 */
router.get('/summary', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2030 })
], validate, leaveController.getLeaveSummary);

/**
 * @route   GET /api/leave/balances
 * @desc    Get leave balances for all employees
 * @access  Private
 */
router.get('/balances', [
  query('department').optional().trim(),
  query('employeeId').optional().isMongoId()
], validate, leaveController.getLeaveBalances);

/**
 * @route   GET /api/leave/applications
 * @desc    Get leave applications
 * @access  Private
 */
router.get('/applications', [
  query('employeeId').optional().isMongoId(),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'all']),
  query('department').optional().trim()
], validate, leaveController.getLeaveApplications);

/**
 * @route   POST /api/leave/applications
 * @desc    Apply for leave
 * @access  Private
 */
router.post('/applications', [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('leaveType').isIn(['casual', 'sick', 'earned', 'unpaid', 'comp_off']).withMessage('Valid leave type is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reason').notEmpty().withMessage('Reason is required').trim(),
  body('halfDay').optional().isBoolean()
], validate, leaveController.applyLeave);

/**
 * @route   PUT /api/leave/applications/:id/approve
 * @desc    Approve leave application
 * @access  Private (Admin/HR)
 */
router.put('/applications/:id/approve', [
  param('id').notEmpty().withMessage('Leave application ID is required'),
  body('notes').optional().trim()
], validate, leaveController.approveLeave);

/**
 * @route   PUT /api/leave/applications/:id/reject
 * @desc    Reject leave application
 * @access  Private (Admin/HR)
 */
router.put('/applications/:id/reject', [
  param('id').notEmpty().withMessage('Leave application ID is required'),
  body('reason').notEmpty().withMessage('Rejection reason is required').trim()
], validate, leaveController.rejectLeave);

export default router;