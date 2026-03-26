import { body, param, query } from 'express-validator';

const attendanceValidation = {
  checkIn: [
    body('employeeId')
      .optional()
      .isMongoId().withMessage('Invalid employee ID'),
    body('shiftId')
      .optional()
      .isMongoId().withMessage('Invalid shift ID format'),
    body('location.lat')
      .optional({ values: 'null' })
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('location.lng')
      .optional({ values: 'null' })
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('ip')
      .optional({ values: 'null' })
      .isIP().withMessage('Invalid IP address')
  ],

  checkOut: [
    body('location.lat')
      .optional({ values: 'null' })
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('location.lng')
      .optional({ values: 'null' })
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('ip')
      .optional({ values: 'null' })
      .isIP().withMessage('Invalid IP address')
  ],

  getAttendance: [
    query('employeeId')
      .optional()
      .isMongoId().withMessage('Invalid employee ID'),
    query('date')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format'),
    query('status')
      .optional()
      .isIn(['present', 'absent', 'half_day', 'leave']).withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 }).toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).toInt()
  ],

  employeeAttendance: [
    param('id')
      .isMongoId().withMessage('Invalid employee ID'),
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format'),
    query('page')
      .optional()
      .isInt({ min: 1 }).toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).toInt()
  ],

  lateMarks: [
    query('month')
      .optional()
      .isInt({ min: 1, max: 12 }).toInt(),
    query('year')
      .optional()
      .isInt({ min: 2020 }).toInt(),
    query('employeeId')
      .optional()
      .isMongoId().withMessage('Invalid employee ID'),
    query('page')
      .optional()
      .isInt({ min: 1 }).toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).toInt()
  ],

  lateMarkDeduction: [
    body('month')
      .isInt({ min: 1, max: 12 }).withMessage('Month is required (1-12)'),
    body('year')
      .isInt({ min: 2020 }).withMessage('Year is required'),
    body('employeeId')
      .optional()
      .isMongoId().withMessage('Invalid employee ID')
  ],

  manualEntry: [
    body('employeeId')
      .isMongoId().withMessage('Employee ID is required'),
    body('date')
      .isISO8601().withMessage('Date is required'),
    body('checkIn.time')
      .optional()
      .isISO8601().withMessage('Check-in time must be a valid date'),
    body('checkOut.time')
      .optional()
      .isISO8601().withMessage('Check-out time must be a valid date'),
    body('status')
      .isIn(['present', 'absent', 'half_day', 'leave']).withMessage('Valid status is required'),
    body('notes')
      .optional()
      .trim(),
    body('reason')
      .notEmpty().withMessage('Reason for manual entry is required')
      .trim()
  ]
};

export { attendanceValidation };