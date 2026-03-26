import express from 'express';
import employeeSelfServiceController from './controller.js';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { body, query, param } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/me/dashboard
 * @desc    Get employee dashboard summary
 * @access  Private (Employee)
 */
router.get('/dashboard', employeeSelfServiceController.getDashboardSummary);

/**
 * @route   GET /api/me/permissions
 * @desc    Get current user's permissions
 * @access  Private
 */
router.get('/permissions', employeeSelfServiceController.getMyPermissions);

/**
 * @route   GET /api/me/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', employeeSelfServiceController.getMyProfile);

/**
 * @route   PUT /api/me/profile
 * @desc    Update current user's profile (limited fields)
 * @access  Private
 */
router.put('/profile', [
  body('personalInfo.phone').optional().isString(),
  body('personalInfo.address').optional().isObject(),
  body('bankDetails').optional().isObject(),
  validate
], employeeSelfServiceController.updateMyProfile);

/**
 * @route   GET /api/me/attendance
 * @desc    Get my attendance history
 * @query   startDate, endDate
 * @access  Private
 */
router.get('/attendance', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate
], employeeSelfServiceController.getMyAttendance);

/**
 * @route   GET /api/me/attendance/today
 * @desc    Get today's attendance status
 * @access  Private
 */
router.get('/attendance/today', employeeSelfServiceController.getTodayAttendance);

/**
 * @route   GET /api/me/leaves/balance
 * @desc    Get my leave balance
 * @access  Private
 */
router.get('/leaves/balance', employeeSelfServiceController.getMyLeaveBalance);

/**
 * @route   GET /api/me/leaves
 * @desc    Get my leave requests
 * @query   status, page, limit
 * @access  Private
 */
router.get('/leaves', [
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
], employeeSelfServiceController.getMyLeaveRequests);

/**
 * @route   POST /api/me/leaves/apply
 * @desc    Apply for leave
 * @access  Private
 */
router.post('/leaves/apply', [
  body('leaveTypeId').isMongoId().withMessage('Valid leave type ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reason').optional().isString(),
  validate
], employeeSelfServiceController.applyLeave);

/**
 * @route   GET /api/me/payslips
 * @desc    Get my payslips
 * @query   page, limit
 * @access  Private
 */
router.get('/payslips', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate
], employeeSelfServiceController.getMyPayslips);

/**
 * @route   GET /api/me/performance
 * @desc    Get my performance records
 * @query   page, limit
 * @access  Private
 */
router.get('/performance', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate
], employeeSelfServiceController.getMyPerformance);

/**
 * @route   GET /api/me/incentives
 * @desc    Get my incentives
 * @query   page, limit
 * @access  Private
 */
router.get('/incentives', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate
], employeeSelfServiceController.getMyIncentives);

/**
 * @route   PUT /api/me/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', [
  body('currentPassword').isString().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
], employeeSelfServiceController.changePassword);

/**
 * @route   PUT /api/me/permissions/:userId
 * @desc    Update user permissions (Admin/HR only)
 * @access  Private (Admin, HR)
 */
router.put('/permissions/:userId', [
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  validate
], employeeSelfServiceController.updatePermissions);

export default router;