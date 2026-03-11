import { body, param, query } from 'express-validator';

const shiftValidation = {
  create: [
    body('name')
      .notEmpty().withMessage('Shift name is required')
      .trim().isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('timings')
      .isArray({ min: 1 }).withMessage('At least one timing is required'),
    body('timings.*.days')
      .isArray({ min: 1 }).withMessage('Days array is required')
      .custom((days) => {
        const validDays = days.every(d => d >= 0 && d <= 6);
        if (!validDays) throw new Error('Days must be between 0 (Sunday) and 6 (Saturday)');
        return true;
      }),
    body('timings.*.startTime')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
    body('timings.*.endTime')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
    body('gracePeriodMinutes')
      .optional()
      .isInt({ min: 0, max: 60 }).withMessage('Grace period must be between 0 and 60 minutes'),
    body('halfDayHours')
      .optional()
      .isInt({ min: 1 }).withMessage('Half day hours must be at least 1'),
    body('fullDayHours')
      .optional()
      .isInt({ min: 1 }).withMessage('Full day hours must be at least 1'),
    body('overtimeMultiplier')
      .optional()
      .isFloat({ min: 1 }).withMessage('Overtime multiplier must be at least 1')
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid shift ID'),
    body('name')
      .optional()
      .trim().isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('timings')
      .optional()
      .isArray({ min: 1 }).withMessage('At least one timing is required'),
    body('gracePeriodMinutes')
      .optional()
      .isInt({ min: 0, max: 60 }).withMessage('Grace period must be between 0 and 60 minutes'),
    body('halfDayHours')
      .optional()
      .isInt({ min: 1 }).withMessage('Half day hours must be at least 1'),
    body('fullDayHours')
      .optional()
      .isInt({ min: 1 }).withMessage('Full day hours must be at least 1'),
    body('overtimeMultiplier')
      .optional()
      .isFloat({ min: 1 }).withMessage('Overtime multiplier must be at least 1')
  ],

  list: [
    query('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be boolean'),
    query('page')
      .optional()
      .isInt({ min: 1 }).toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).toInt()
  ]
};

export { shiftValidation };