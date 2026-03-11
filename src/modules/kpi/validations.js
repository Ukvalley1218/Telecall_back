import { body, param, query } from 'express-validator';

const kpiValidation = {
  create: [
    body('name')
      .notEmpty().withMessage('KPI name is required')
      .trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('unit')
      .isIn(['Rs', 'Count', 'Percentage', 'Hours', 'Days']).withMessage('Valid unit is required'),
    body('group')
      .isIn(['Sales', 'Production', 'Support', 'Quality', 'Operations', 'Other']).withMessage('Valid group is required'),
    body('targetValue')
      .isFloat({ min: 0 }).withMessage('Target value must be non-negative'),
    body('maxValue')
      .optional()
      .isFloat({ min: 0 }).withMessage('Max value must be non-negative'),
    body('weightage')
      .optional()
      .isFloat({ min: 0.1, max: 10 }).withMessage('Weightage must be between 0.1 and 10'),
    body('frequency')
      .optional()
      .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).withMessage('Invalid frequency')
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid KPI ID'),
    body('name')
      .optional()
      .trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('targetValue')
      .optional()
      .isFloat({ min: 0 }).withMessage('Target value must be non-negative'),
    body('maxValue')
      .optional()
      .isFloat({ min: 0 }).withMessage('Max value must be non-negative'),
    body('weightage')
      .optional()
      .isFloat({ min: 0.1, max: 10 }).withMessage('Weightage must be between 0.1 and 10'),
    body('frequency')
      .optional()
      .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).withMessage('Invalid frequency')
  ],

  list: [
    query('group')
      .optional()
      .isIn(['Sales', 'Production', 'Support', 'Quality', 'Operations', 'Other']).withMessage('Invalid group'),
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

export { kpiValidation };