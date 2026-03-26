import express from 'express';
import { body, param, query } from 'express-validator';
import thankYouCardController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

router.use(auth);

/**
 * @route   GET /api/thankyou/employees
 * @desc    Get all employees for recipient selection
 * @access  Private
 */
router.get('/employees', thankYouCardController.getEmployees);

/**
 * @route   GET /api/thankyou/templates
 * @desc    Get card templates
 * @access  Private
 */
router.get('/templates', thankYouCardController.getCardTemplates);

/**
 * @route   POST /api/thankyou/send
 * @desc    Send a thank you card
 * @access  Private
 */
router.post('/send', [
  body('receiverId').isMongoId().withMessage('Valid recipient ID is required'),
  body('cardType').isIn(['appreciation', 'teamwork', 'innovation', 'leadership', 'customer_service', 'going_above_beyond', 'custom']).withMessage('Valid card type is required'),
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 100 }),
  body('message').notEmpty().withMessage('Message is required').trim().isLength({ max: 500 }),
  body('tags').optional().isArray(),
  body('isPublic').optional().isBoolean()
], validate, thankYouCardController.sendCard);

/**
 * @route   GET /api/thankyou/sent
 * @desc    Get cards sent by current user
 * @access  Private
 */
router.get('/sent', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, thankYouCardController.getSentCards);

/**
 * @route   GET /api/thankyou/received
 * @desc    Get cards received by current user
 * @access  Private
 */
router.get('/received', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('unreadOnly').optional().isBoolean()
], validate, thankYouCardController.getReceivedCards);

/**
 * @route   GET /api/thankyou/unread-count
 * @desc    Get unread card count
 * @access  Private
 */
router.get('/unread-count', thankYouCardController.getUnreadCount);

/**
 * @route   PUT /api/thankyou/:id/read
 * @desc    Mark card as read
 * @access  Private
 */
router.put('/:id/read', [
  param('id').isMongoId().withMessage('Valid card ID is required')
], validate, thankYouCardController.markAsRead);

/**
 * @route   GET /api/thankyou/top-receivers
 * @desc    Get top receivers (leaderboard)
 * @access  Private
 */
router.get('/top-receivers', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], validate, thankYouCardController.getTopReceivers);

/**
 * @route   GET /api/thankyou/stats
 * @desc    Get card statistics (admin)
 * @access  Private (Admin/HR)
 */
router.get('/stats', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2030 })
], validate, thankYouCardController.getCardStats);

/**
 * @route   GET /api/thankyou/all
 * @desc    Get all cards (admin)
 * @access  Private (Admin/HR)
 */
router.get('/all', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  query('cardType').optional().isIn(['appreciation', 'teamwork', 'innovation', 'leadership', 'customer_service', 'going_above_beyond', 'custom'])
], validate, thankYouCardController.getAllCards);

/**
 * @route   DELETE /api/thankyou/:id
 * @desc    Delete a thank you card
 * @access  Private (Sender only)
 */
router.delete('/:id', [
  param('id').isMongoId().withMessage('Valid card ID is required')
], validate, thankYouCardController.deleteCard);

export default router;