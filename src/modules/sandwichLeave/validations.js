import { body, param, query } from 'express-validator';

const sandwichLeaveValidation = {
  create: [
    body('employeeId')
      .isMongoId().withMessage('Employee ID is required and must be valid'),
    body('leaveDates')
      .isArray({ min: 1 }).withMessage('At least one leave date is required'),
    body('leaveDates.*')
      .isISO8601().withMessage('Each leave date must be a valid date'),
    body('deductionType')
      .optional()
      .isIn(['1x', '2x']).withMessage('Deduction type must be 1x or 2x'),
    body('reason')
      .notEmpty().withMessage('Reason is required')
      .trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
    body('notes')
      .optional()
      .trim()
  ],

  approve: [
    param('id')
      .isMongoId().withMessage('Invalid sandwich leave ID')
  ],

  reject: [
    param('id')
      .isMongoId().withMessage('Invalid sandwich leave ID'),
    body('reason')
      .optional()
      .trim()
  ],

  list: [
    query('employeeId')
      .optional()
      .isMongoId().withMessage('Invalid employee ID'),
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 }).toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).toInt()
  ]
};

export { sandwichLeaveValidation };