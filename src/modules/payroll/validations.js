import { body, param, query } from 'express-validator';

// Salary Structure validations
export const createSalaryStructureValidation = [
  body('employeeId')
    .isMongoId().withMessage('Valid employee ID is required'),
  body('basicSalary')
    .isFloat({ min: 0 }).withMessage('Basic salary must be a non-negative number'),
  body('hra')
    .optional()
    .isFloat({ min: 0 }).withMessage('HRA must be a non-negative number'),
  body('hraPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('HRA percentage must be between 0 and 100'),
  body('conveyance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Conveyance must be a non-negative number'),
  body('medicalAllowance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Medical allowance must be a non-negative number'),
  body('specialAllowance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Special allowance must be a non-negative number'),
  body('pf')
    .optional()
    .isFloat({ min: 0 }).withMessage('PF must be a non-negative number'),
  body('pfPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('PF percentage must be between 0 and 100'),
  body('esi')
    .optional()
    .isFloat({ min: 0 }).withMessage('ESI must be a non-negative number'),
  body('esiPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('ESI percentage must be between 0 and 100'),
  body('professionalTax')
    .optional()
    .isFloat({ min: 0 }).withMessage('Professional tax must be a non-negative number'),
  body('tds')
    .optional()
    .isFloat({ min: 0 }).withMessage('TDS must be a non-negative number'),
  body('bankDetails.accountNumber')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage('Account number cannot exceed 30 characters'),
  body('bankDetails.bankName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Bank name cannot exceed 100 characters'),
  body('bankDetails.ifscCode')
    .optional()
    .trim()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format')
];

export const updateSalaryStructureValidation = [
  param('id').isMongoId().withMessage('Invalid salary structure ID'),
  body('basicSalary')
    .optional()
    .isFloat({ min: 0 }).withMessage('Basic salary must be a non-negative number'),
  body('hra')
    .optional()
    .isFloat({ min: 0 }).withMessage('HRA must be a non-negative number'),
  body('pf')
    .optional()
    .isFloat({ min: 0 }).withMessage('PF must be a non-negative number'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
];

// Payroll Run validations
export const createPayrollRunValidation = [
  body('month')
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year')
    .isInt({ min: 2020, max: 2100 }).withMessage('Year must be between 2020 and 2100'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('startDate')
    .isISO8601().withMessage('Valid start date is required'),
  body('endDate')
    .isISO8601().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    }),
  body('paymentDate')
    .isISO8601().withMessage('Valid payment date is required'),
  body('workingDays')
    .optional()
    .isInt({ min: 1, max: 31 }).withMessage('Working days must be between 1 and 31'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
];

export const approvePayrollRunValidation = [
  param('id').isMongoId().withMessage('Invalid payroll run ID'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Comments cannot exceed 500 characters')
];

// Query validations
export const getPayrollRunsValidation = [
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 }).withMessage('Year must be between 2020 and 2100'),
  query('status')
    .optional()
    .isIn(['draft', 'processing', 'processed', 'approved', 'paid', 'cancelled'])
    .withMessage('Invalid status'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const getPayslipsValidation = [
  query('employeeId')
    .optional()
    .isMongoId().withMessage('Invalid employee ID'),
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 }).withMessage('Year must be between 2020 and 2100'),
  query('paymentStatus')
    .optional()
    .isIn(['pending', 'processing', 'paid', 'failed', 'on_hold'])
    .withMessage('Invalid payment status')
];