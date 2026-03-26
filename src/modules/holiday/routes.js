import express from 'express';
import { body, param, query } from 'express-validator';
import holidayController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

router.use(auth);

// Get holidays
router.get('/', [
  query('year').optional().isInt({ min: 2020, max: 2100 }),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('type').optional().isIn(['national', 'regional', 'optional', 'company', 'restricted']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, holidayController.getHolidays);

// Get upcoming holidays
router.get('/upcoming', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], validate, holidayController.getUpcomingHolidays);

// Get holiday calendar
router.get('/calendar', [
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, holidayController.getHolidayCalendar);

// Get holiday summary
router.get('/summary', [
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, holidayController.getHolidaySummary);

// Get holiday stats
router.get('/stats', [
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, holidayController.getHolidayStats);

// Check if date is holiday
router.get('/check', [
  query('date').isISO8601().withMessage('Valid date is required')
], validate, holidayController.isHoliday);

// Get holidays for date range
router.get('/range', [
  query('startDate').isISO8601().withMessage('Valid start date is required'),
  query('endDate').isISO8601().withMessage('Valid end date is required')
], validate, holidayController.getHolidaysForDateRange);

// Get holidays for year
router.get('/year/:year', [
  param('year').isInt({ min: 2020, max: 2100 })
], validate, holidayController.getHolidaysForYear);

// Get holidays by type
router.get('/type/:type', [
  param('type').isIn(['national', 'regional', 'optional', 'company', 'restricted'])
], validate, holidayController.getHolidaysByType);

// Get optional holidays
router.get('/optional', [
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, holidayController.getOptionalHolidays);

// Get holiday by ID
router.get('/:id', [
  param('id').isMongoId()
], validate, holidayController.getHolidayById);

// Create holiday
router.post('/', [
  body('name').notEmpty().withMessage('Name is required').trim().isLength({ max: 100 }),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('type').optional().isIn(['national', 'regional', 'optional', 'company', 'restricted']),
  body('description').optional().trim().isLength({ max: 500 }),
  body('isRecurring').optional().isBoolean(),
  body('isOptional').optional().isBoolean(),
  body('isHalfDay').optional().isBoolean()
], validate, holidayController.createHoliday);

// Update holiday
router.put('/:id', [
  param('id').isMongoId()
], validate, holidayController.updateHoliday);

// Delete holiday
router.delete('/:id', [
  param('id').isMongoId()
], validate, holidayController.deleteHoliday);

// Create recurring holidays for new year
router.post('/recurring', [
  body('year').isInt({ min: 2020, max: 2100 }).withMessage('Valid year is required')
], validate, holidayController.createRecurringHolidays);

// Bulk create holidays
router.post('/bulk', [
  body('holidays').isArray({ min: 1 }).withMessage('Holidays array is required'),
  body('holidays.*.name').notEmpty().withMessage('Name is required for each holiday'),
  body('holidays.*.date').isISO8601().withMessage('Valid date is required for each holiday')
], validate, holidayController.bulkCreateHolidays);

// Import from template
router.post('/import-template', [
  body('year').isInt({ min: 2020, max: 2100 }).withMessage('Valid year is required'),
  body('templateName').isIn(['india_national', 'india_common']).withMessage('Valid template name is required')
], validate, holidayController.importFromTemplate);

export default router;