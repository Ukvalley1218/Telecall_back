import express from 'express';
import { body, param, query } from 'express-validator';
import eventController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

router.use(auth);

// Get events
router.get('/', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('type').optional().isIn(['meeting', 'event', 'holiday', 'reminder', 'deadline', 'training', 'other']),
  query('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'])
], validate, eventController.getEvents);

// Get upcoming events
router.get('/upcoming', [
  query('days').optional().isInt({ min: 1, max: 90 })
], validate, eventController.getUpcomingEvents);

// Get events by type
router.get('/type/:type', [
  param('type').isIn(['meeting', 'event', 'holiday', 'reminder', 'deadline', 'training', 'other']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], validate, eventController.getEventsByType);

// Get event stats
router.get('/stats', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, eventController.getEventStats);

// Get event by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid event ID')
], validate, eventController.getEventById);

// Create event
router.post('/', [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 200 }),
  body('type').optional().isIn(['meeting', 'event', 'holiday', 'reminder', 'deadline', 'training', 'other']),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('isAllDay').optional().isBoolean(),
  body('location').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('participants').optional().isArray(),
  body('participants.*').isMongoId().withMessage('Invalid participant ID')
], validate, eventController.createEvent);

// Update event
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid event ID'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], validate, eventController.updateEvent);

// Delete event
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid event ID')
], validate, eventController.deleteEvent);

// Add participant
router.post('/:id/participants', [
  param('id').isMongoId().withMessage('Invalid event ID'),
  body('participantId').isMongoId().withMessage('Valid participant ID is required')
], validate, eventController.addParticipant);

// Remove participant
router.delete('/:id/participants/:participantId', [
  param('id').isMongoId().withMessage('Invalid event ID'),
  param('participantId').isMongoId().withMessage('Invalid participant ID')
], validate, eventController.removeParticipant);

// Cancel event
router.post('/:id/cancel', [
  param('id').isMongoId().withMessage('Invalid event ID'),
  body('reason').optional().trim().isLength({ max: 500 })
], validate, eventController.cancelEvent);

export default router;