import { body, param, query } from 'express-validator';

// Organization validation
export const organizationValidation = {
  create: [
    body('name')
      .notEmpty().withMessage('Organization name is required')
      .trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('domain')
      .notEmpty().withMessage('Domain is required')
      .trim().toLowerCase()
      .matches(/^[a-z0-9-]+$/).withMessage('Domain can only contain lowercase letters, numbers, and hyphens'),
    body('subscriptionPlan')
      .optional()
      .isIn(['free', 'basic', 'premium', 'enterprise']).withMessage('Invalid subscription plan'),
    body('maxEmployees')
      .optional()
      .isInt({ min: 1 }).withMessage('Max employees must be a positive integer')
  ],
  update: [
    body('name')
      .optional()
      .trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('settings.lateMarkBuffer')
      .optional()
      .isInt({ min: 0, max: 60 }).withMessage('Late mark buffer must be between 0 and 60'),
    body('settings.sandwichLeaveEnabled')
      .optional()
      .isBoolean().withMessage('Sandwich leave enabled must be boolean'),
    body('settings.incentivePayoutDays')
      .optional()
      .isInt({ min: 1 }).withMessage('Incentive payout days must be at least 1')
  ]
};

// User validation
export const userValidation = {
  create: [
    body('email')
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['super_admin', 'admin', 'hr', 'employee']).withMessage('Invalid role'),
    body('firstName')
      .notEmpty().withMessage('First name is required')
      .trim(),
    body('lastName')
      .notEmpty().withMessage('Last name is required')
      .trim()
  ],
  update: [
    body('firstName')
      .optional()
      .trim().isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .trim().isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    body('phone')
      .optional()
      .trim(),
    body('role')
      .optional()
      .isIn(['super_admin', 'admin', 'hr', 'employee']).withMessage('Invalid role'),
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be boolean')
  ]
};