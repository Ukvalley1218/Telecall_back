import express from 'express';
import dashboardController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { query, param } from 'express-validator';

const router = express.Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @query   department - Filter by department (optional)
 * @access  Private
 */
router.get('/stats', [
  query('department').optional().isString().withMessage('Department must be a string'),
  validate
], dashboardController.getDashboardStats);

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

/**
 * @route   GET /api/dashboard/upcoming-birthdays
 * @desc    Get upcoming birthdays (next 30 days)
 * @access  Private
 */
router.get('/upcoming-birthdays', dashboardController.getUpcomingBirthdays);

/**
 * @route   GET /api/dashboard/work-anniversaries
 * @desc    Get work anniversaries (next 30 days)
 * @access  Private
 */
router.get('/work-anniversaries', dashboardController.getWorkAnniversaries);

/**
 * @route   GET /api/dashboard/one-year-milestones
 * @desc    Get employees completing 1 year this month
 * @access  Private
 */
router.get('/one-year-milestones', dashboardController.getOneYearMilestones);

/**
 * @route   GET /api/dashboard/critical-alerts
 * @desc    Get critical alerts (absent without leave, late arrivals)
 * @query   department - Filter by department (optional)
 * @access  Private
 */
router.get('/critical-alerts', [
  query('department').optional().isString().withMessage('Department must be a string'),
  validate
], dashboardController.getCriticalAlerts);

/**
 * @route   GET /api/dashboard/today-attendance
 * @desc    Get today's detailed attendance
 * @access  Private
 */
router.get('/today-attendance', dashboardController.getTodayAttendanceDetails);

/**
 * @route   GET /api/dashboard/pending-approvals
 * @desc    Get pending approvals count (leaves, expenses, etc.)
 * @access  Private
 */
router.get('/pending-approvals', dashboardController.getPendingApprovals);

/**
 * @route   GET /api/dashboard/compliance-alerts
 * @desc    Get compliance alerts summary
 * @access  Private
 */
router.get('/compliance-alerts', dashboardController.getComplianceAlertsSummary);

export default router;