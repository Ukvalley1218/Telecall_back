import { body, param, query } from 'express-validator';

// Leave Type validations
export const createLeaveTypeValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('code')
    .notEmpty().withMessage('Code is required')
    .trim()
    .isLength({ max: 20 }).withMessage('Code cannot exceed 20 characters')
    .toUpperCase(),
  body('annualQuota')
    .isInt({ min: 0 }).withMessage('Annual quota must be a non-negative integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  body('carryForward')
    .optional()
    .isBoolean().withMessage('Carry forward must be a boolean'),
  body('maxCarryForward')
    .optional()
    .isInt({ min: 0 }).withMessage('Max carry forward must be a non-negative integer'),
  body('isPaid')
    .optional()
    .isBoolean().withMessage('Is paid must be a boolean'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color format')
];

export const updateLeaveTypeValidation = [
  param('id').isMongoId().withMessage('Invalid leave type ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('annualQuota')
    .optional()
    .isInt({ min: 0 }).withMessage('Annual quota must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
];

// Leave Balance validations
export const createLeaveBalanceValidation = [
  body('employeeId')
    .isMongoId().withMessage('Valid employee ID is required'),
  body('leaveTypeId')
    .isMongoId().withMessage('Valid leave type ID is required'),
  body('year')
    .isInt({ min: 2020, max: 2100 }).withMessage('Year must be between 2020 and 2100'),
  body('allocated')
    .optional()
    .isFloat({ min: 0 }).withMessage('Allocated days must be non-negative'),
  body('carriedForward')
    .optional()
    .isFloat({ min: 0 }).withMessage('Carried forward days must be non-negative')
];

export const updateLeaveBalanceValidation = [
  param('id').isMongoId().withMessage('Invalid leave balance ID'),
  body('allocated')
    .optional()
    .isFloat({ min: 0 }).withMessage('Allocated days must be non-negative'),
  body('carriedForward')
    .optional()
    .isFloat({ min: 0 }).withMessage('Carried forward days must be non-negative')
];

// Leave Request validations
export const createLeaveRequestValidation = [
  body('employeeId')
    .isMongoId().withMessage('Valid employee ID is required'),
  body('leaveTypeId')
    .isMongoId().withMessage('Valid leave type ID is required'),
  body('startDate')
    .isISO8601().withMessage('Valid start date is required')
    .custom((value) => {
      if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  body('endDate')
    .isISO8601().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    }),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  body('halfDay')
    .optional()
    .isBoolean().withMessage('Half day must be a boolean'),
  body('halfDayType')
    .optional()
    .isIn(['first_half', 'second_half']).withMessage('Invalid half day type'),
  body('isEmergency')
    .optional()
    .isBoolean().withMessage('Is emergency must be a boolean'),
  body('documentUrl')
    .optional()
    .isURL().withMessage('Document URL must be a valid URL'),
  body('handoverNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Handover notes cannot exceed 1000 characters')
];

export const updateLeaveRequestValidation = [
  param('id').isMongoId().withMessage('Invalid leave request ID'),
  body('startDate')
    .optional()
    .isISO8601().withMessage('Valid start date is required'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    }),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
];

export const approveLeaveRequestValidation = [
  param('id').isMongoId().withMessage('Invalid leave request ID'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

export const rejectLeaveRequestValidation = [
  param('id').isMongoId().withMessage('Invalid leave request ID'),
  body('reason')
    .notEmpty().withMessage('Rejection reason is required')
    .trim()
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
];

// Query validations
export const getLeaveRequestsValidation = [
  query('employeeId')
    .optional()
    .isMongoId().withMessage('Invalid employee ID'),
  query('leaveTypeId')
    .optional()
    .isMongoId().withMessage('Invalid leave type ID'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled', 'withdrawn', 'all']).withMessage('Invalid status'),
  query('department')
    .optional()
    .trim(),
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 }).withMessage('Year must be between 2020 and 2100'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const getLeaveBalanceValidation = [
  query('employeeId')
    .optional()
    .isMongoId().withMessage('Invalid employee ID'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 }).withMessage('Year must be between 2020 and 2100')
];