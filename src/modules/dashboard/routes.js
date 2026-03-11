import express from 'express';
import dashboardController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { query, param } from 'express-validator';

const router = express.Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', dashboardController.getDashboardStats);

/**
 * @route   GET /api/dashboard/attendance-chart
 * @desc    Get attendance chart data
 * @access  Private
 */
router.get('/attendance-chart', [
  query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90'),
  validate
], dashboardController.getAttendanceChartData);

/**
 * @route   GET /api/dashboard/recruitment-funnel
 * @desc    Get recruitment funnel data
 * @access  Private
 */
router.get('/recruitment-funnel', dashboardController.getRecruitmentFunnel);

/**
 * @route   GET /api/dashboard/department-distribution
 * @desc    Get department distribution
 * @access  Private
 */
router.get('/department-distribution', dashboardController.getDepartmentDistribution);

export default router;