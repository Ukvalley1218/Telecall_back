import { body, param, query } from 'express-validator';

const incentiveValidation = {
  create: [
    body('employeeId')
      .isMongoId().withMessage('Employee ID is required and must be valid'),
    body('salesAmount')
      .isFloat({ min: 0 }).withMessage('Sales amount must be a non-negative number'),
    body('incentiveAmount')
      .isFloat({ min: 0 }).withMessage('Incentive amount is required and must be non-negative'),
    body('reason')
      .isIn(['early_payment', 'partial_payment', 'sales_completion', 'other'])
      .withMessage('Valid reason is required'),
    body('salesDate')
      .isISO8601().withMessage('Sales date is required and must be valid'),
    body('description')
      .optional()
      .trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('notes')
      .optional()
      .trim()
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid incentive ID'),
    body('salesAmount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Sales amount must be non-negative'),
    body('incentiveAmount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Incentive amount must be non-negative'),
    body('description')
      .optional()
      .trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('notes')
      .optional()
      .trim()
  ],

  markPaid: [
    param('id')
      .isMongoId().withMessage('Invalid incentive ID'),
    body('paymentReference')
      .optional()
      .trim()
  ],

  cancel: [
    param('id')
      .isMongoId().withMessage('Invalid incentive ID'),
    body('reason')
      .notEmpty().withMessage('Cancellation reason is required')
      .trim()
  ],

  list: [
    query('employeeId')
      .optional()
      .isMongoId().withMessage('Invalid employee ID'),
    query('status')
      .optional()
      .isIn(['pending', 'paid', 'cancelled']).withMessage('Invalid status'),
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date'),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date'),
    query('page')
      .optional()
      .isInt({ min: 1 }).toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).toInt()
  ]
};

export { incentiveValidation };