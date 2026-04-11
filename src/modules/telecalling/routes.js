import express from 'express';
import { body, param, query } from 'express-validator';
import telecallingController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// ==================== CAMPAIGN ROUTES ====================

/**
 * @route   GET /api/telecalling/campaigns
 * @desc    Get all campaigns
 * @access  Private
 */
router.get('/campaigns',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['draft', 'active', 'paused', 'completed', 'archived']).withMessage('Invalid status'),
    query('priority').optional().isIn(['urgent', 'high', 'medium', 'low']).withMessage('Invalid priority')
  ],
  validate,
  telecallingController.getCampaigns
);

/**
 * @route   GET /api/telecalling/campaigns/my
 * @desc    Get campaigns assigned to current user
 * @access  Private
 */
router.get('/campaigns/my',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validate,
  telecallingController.getMyCampaigns
);

/**
 * @route   GET /api/telecalling/campaigns/:id
 * @desc    Get campaign by ID
 * @access  Private
 */
router.get('/campaigns/:id',
  [
    param('id').isMongoId().withMessage('Invalid campaign ID')
  ],
  validate,
  telecallingController.getCampaignById
);

/**
 * @route   POST /api/telecalling/campaigns
 * @desc    Create new campaign
 * @access  Private (HR/Admin)
 */
router.post('/campaigns',
  [
    body('name')
      .notEmpty().withMessage('Campaign name is required')
      .trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('type')
      .optional()
      .isIn(['outbound', 'inbound', 'mixed']).withMessage('Invalid campaign type'),
    body('priority')
      .optional()
      .isIn(['urgent', 'high', 'medium', 'low']).withMessage('Invalid priority'),
    body('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date'),
    body('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date'),
    body('assignedTo')
      .optional()
      .isArray().withMessage('assignedTo must be an array')
  ],
  validate,
  telecallingController.createCampaign
);

/**
 * @route   PUT /api/telecalling/campaigns/:id
 * @desc    Update campaign
 * @access  Private (HR/Admin)
 */
router.put('/campaigns/:id',
  [
    param('id').isMongoId().withMessage('Invalid campaign ID'),
    body('name')
      .optional()
      .trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('status')
      .optional()
      .isIn(['draft', 'active', 'paused', 'completed', 'archived']).withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['urgent', 'high', 'medium', 'low']).withMessage('Invalid priority')
  ],
  validate,
  telecallingController.updateCampaign
);

// ==================== LEAD ROUTES ====================

/**
 * @route   GET /api/telecalling/leads
 * @desc    Get leads by category/status
 * @access  Private
 */
router.get('/leads',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category')
      .optional()
      .isIn(['new', 'follow_up', 'cold', 'warm', 'hot', 'not_connected', 'open', 'in_progress', 'converted', 'closed'])
      .withMessage('Invalid category')
  ],
  validate,
  telecallingController.getLeadsByCategory
);

/**
 * @route   GET /api/telecalling/leads/my
 * @desc    Get leads assigned to current user
 * @access  Private
 */
router.get('/leads/my',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['new', 'open', 'in_progress', 'follow_up', 'cold', 'warm', 'hot', 'converted', 'closed', 'lost', 'not_connected'])
      .withMessage('Invalid status'),
    query('stage')
      .optional()
      .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'])
      .withMessage('Invalid stage')
  ],
  validate,
  telecallingController.getMyLeads
);

/**
 * @route   GET /api/telecalling/leads/counts
 * @desc    Get lead counts by category
 * @access  Private
 */
router.get('/leads/counts',
  telecallingController.getLeadCategoryCounts
);

/**
 * @route   GET /api/telecalling/leads/:id
 * @desc    Get lead by ID
 * @access  Private
 */
router.get('/leads/:id',
  [
    param('id').isMongoId().withMessage('Invalid lead ID')
  ],
  validate,
  telecallingController.getLeadById
);

/**
 * @route   POST /api/telecalling/leads
 * @desc    Create new lead
 * @access  Private
 */
router.post('/leads',
  [
    body('name')
      .notEmpty().withMessage('Lead name is required')
      .trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('phone')
      .notEmpty().withMessage('Phone number is required')
      .trim(),
    body('email')
      .optional()
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('campaignId')
      .optional()
      .isMongoId().withMessage('Invalid campaign ID'),
    body('status')
      .optional()
      .isIn(['new', 'open', 'in_progress', 'follow_up', 'cold', 'warm', 'hot', 'converted', 'closed', 'lost', 'not_connected'])
      .withMessage('Invalid status'),
    body('stage')
      .optional()
      .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'])
      .withMessage('Invalid stage'),
    body('priority')
      .optional()
      .isIn(['urgent', 'high', 'medium', 'low'])
      .withMessage('Invalid priority'),
    body('source')
      .optional()
      .isIn(['website', 'referral', 'campaign', 'social_media', 'cold_call', 'event', 'other'])
      .withMessage('Invalid source')
  ],
  validate,
  telecallingController.createLead
);

/**
 * @route   PUT /api/telecalling/leads/:id
 * @desc    Update lead
 * @access  Private
 */
router.put('/leads/:id',
  [
    param('id').isMongoId().withMessage('Invalid lead ID'),
    body('name')
      .optional()
      .trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('status')
      .optional()
      .isIn(['new', 'open', 'in_progress', 'follow_up', 'cold', 'warm', 'hot', 'converted', 'closed', 'lost', 'not_connected'])
      .withMessage('Invalid status'),
    body('stage')
      .optional()
      .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'])
      .withMessage('Invalid stage')
  ],
  validate,
  telecallingController.updateLead
);

/**
 * @route   POST /api/telecalling/leads/:id/dispose
 * @desc    Dispose lead after call
 * @access  Private
 */
router.post('/leads/:id/dispose',
  [
    param('id').isMongoId().withMessage('Invalid lead ID'),
    body('status')
      .isIn(['connected', 'not_connected', 'busy', 'callback', 'not_interested', 'wrong_number', 'voicemail'])
      .withMessage('Invalid disposition status'),
    body('newStatus')
      .optional()
      .isIn(['new', 'open', 'in_progress', 'follow_up', 'cold', 'warm', 'hot', 'converted', 'closed', 'lost', 'not_connected'])
      .withMessage('Invalid lead status'),
    body('reason')
      .optional()
      .trim(),
    body('remarks')
      .optional()
      .trim().isLength({ max: 1000 }).withMessage('Remarks cannot exceed 1000 characters'),
    body('stage')
      .optional()
      .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'])
      .withMessage('Invalid stage'),
    body('followUp.date')
      .optional()
      .isISO8601().withMessage('Invalid follow-up date'),
    body('followUp.time')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid follow-up time (use HH:MM format)')
  ],
  validate,
  telecallingController.disposeLead
);

// ==================== CALL LOG ROUTES ====================

/**
 * @route   POST /api/telecalling/call-logs
 * @desc    Create call log
 * @access  Private
 */
router.post('/call-logs',
  [
    body('phoneNumber')
      .notEmpty().withMessage('Phone number is required'),
    body('callType')
      .optional()
      .isIn(['incoming', 'outgoing', 'missed']).withMessage('Invalid call type'),
    body('status')
      .optional()
      .isIn(['connected', 'not_connected', 'busy', 'no_answer', 'rejected', 'failed', 'missed'])
      .withMessage('Invalid call status'),
    body('duration')
      .optional()
      .isInt({ min: 0 }).withMessage('Duration must be a non-negative integer'),
    body('leadId')
      .optional()
      .isMongoId().withMessage('Invalid lead ID'),
    body('campaignId')
      .optional()
      .isMongoId().withMessage('Invalid campaign ID')
  ],
  validate,
  telecallingController.createCallLog
);

/**
 * @route   GET /api/telecalling/call-logs
 * @desc    Get call logs
 * @access  Private
 */
router.get('/call-logs',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('callType')
      .optional()
      .isIn(['incoming', 'outgoing', 'missed']).withMessage('Invalid call type'),
    query('status')
      .optional()
      .isIn(['connected', 'not_connected', 'busy', 'no_answer', 'rejected', 'failed', 'missed'])
      .withMessage('Invalid call status')
  ],
  validate,
  telecallingController.getCallLogs
);

/**
 * @route   GET /api/telecalling/call-logs/statistics
 * @desc    Get call statistics
 * @access  Private
 */
router.get('/call-logs/statistics',
  [
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date'),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date')
  ],
  validate,
  telecallingController.getCallStatistics
);

// ==================== TASK ROUTES ====================

/**
 * @route   GET /api/telecalling/tasks
 * @desc    Get my tasks
 * @access  Private
 */
router.get('/tasks',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'cancelled', 'overdue'])
      .withMessage('Invalid status'),
    query('type')
      .optional()
      .isIn(['call', 'follow_up', 'meeting', 'callback', 'reminder', 'other'])
      .withMessage('Invalid task type')
  ],
  validate,
  telecallingController.getMyTasks
);

/**
 * @route   GET /api/telecalling/tasks/today
 * @desc    Get today's tasks
 * @access  Private
 */
router.get('/tasks/today',
  telecallingController.getTodayTasks
);

/**
 * @route   POST /api/telecalling/tasks
 * @desc    Create task
 * @access  Private
 */
router.post('/tasks',
  [
    body('title')
      .notEmpty().withMessage('Task title is required')
      .trim().isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('type')
      .optional()
      .isIn(['call', 'follow_up', 'meeting', 'callback', 'reminder', 'other'])
      .withMessage('Invalid task type'),
    body('priority')
      .optional()
      .isIn(['urgent', 'high', 'medium', 'low'])
      .withMessage('Invalid priority'),
    body('assignedTo')
      .notEmpty().withMessage('Assigned user is required')
      .isMongoId().withMessage('Invalid user ID'),
    body('leadId')
      .optional()
      .isMongoId().withMessage('Invalid lead ID'),
    body('dueDate')
      .optional()
      .isISO8601().withMessage('Invalid due date')
  ],
  validate,
  telecallingController.createTask
);

/**
 * @route   PUT /api/telecalling/tasks/:id/complete
 * @desc    Mark task as complete
 * @access  Private
 */
router.put('/tasks/:id/complete',
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('notes')
      .optional()
      .trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
  ],
  validate,
  telecallingController.completeTask
);

// ==================== FOLLOW-UP ROUTES ====================

/**
 * @route   GET /api/telecalling/follow-ups
 * @desc    Get follow-ups
 * @access  Private
 */
router.get('/follow-ups',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_answer'])
      .withMessage('Invalid status')
  ],
  validate,
  telecallingController.getFollowUps
);

/**
 * @route   GET /api/telecalling/follow-ups/today
 * @desc    Get today's follow-ups
 * @access  Private
 */
router.get('/follow-ups/today',
  telecallingController.getTodayFollowUps
);

/**
 * @route   POST /api/telecalling/follow-ups
 * @desc    Create follow-up
 * @access  Private
 */
router.post('/follow-ups',
  [
    body('leadId')
      .notEmpty().withMessage('Lead ID is required')
      .isMongoId().withMessage('Invalid lead ID'),
    body('scheduledDate')
      .notEmpty().withMessage('Scheduled date is required')
      .isISO8601().withMessage('Invalid scheduled date'),
    body('scheduledTime')
      .notEmpty().withMessage('Scheduled time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (use HH:MM)'),
    body('type')
      .optional()
      .isIn(['call', 'email', 'visit', 'meeting', 'other'])
      .withMessage('Invalid follow-up type'),
    body('notes')
      .optional()
      .trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
  ],
  validate,
  telecallingController.createFollowUp
);

// ==================== DASHBOARD ROUTES ====================

/**
 * @route   GET /api/telecalling/dashboard
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/dashboard',
  telecallingController.getDashboardStats
);

/**
 * @route   GET /api/telecalling/reports/daily
 * @desc    Get daily activity report
 * @access  Private
 */
router.get('/reports/daily',
  [
    query('date')
      .optional()
      .isISO8601().withMessage('Invalid date format')
  ],
  validate,
  telecallingController.getDailyReport
);

// ==================== ATTENDANCE ROUTES ====================

/**
 * @route   POST /api/telecalling/attendance/checkin
 * @desc    Check-in for telecaller
 * @access  Private
 */
router.post('/attendance/checkin',
  [
    body('location.lat').optional().isFloat({ min: -90, max: 90 }),
    body('location.lng').optional().isFloat({ min: -180, max: 180 })
  ],
  validate,
  telecallingController.telecallerCheckIn
);

/**
 * @route   POST /api/telecalling/attendance/checkout
 * @desc    Check-out for telecaller
 * @access  Private
 */
router.post('/attendance/checkout',
  [
    body('location.lat').optional().isFloat({ min: -90, max: 90 }),
    body('location.lng').optional().isFloat({ min: -180, max: 180 })
  ],
  validate,
  telecallingController.telecallerCheckOut
);

/**
 * @route   GET /api/telecalling/attendance/today
 * @desc    Get today's attendance for telecaller
 * @access  Private
 */
router.get('/attendance/today',
  telecallingController.getTelecallerTodayAttendance
);

export default router;