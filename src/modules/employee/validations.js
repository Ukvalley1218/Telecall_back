import { body, param, query } from 'express-validator';

const employeeValidation = {
  create: [
    body('personalInfo.firstName')
      .notEmpty().withMessage('First name is required')
      .trim().isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('personalInfo.lastName')
      .notEmpty().withMessage('Last name is required')
      .trim().isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    body('personalInfo.email')
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('personalInfo.phone')
      .notEmpty().withMessage('Phone is required')
      .trim(),
    body('employment.department')
      .notEmpty().withMessage('Department is required')
      .trim(),
    body('employment.designation')
      .notEmpty().withMessage('Designation is required')
      .trim(),
    body('employment.joiningDate')
      .isISO8601().withMessage('Valid joining date is required'),
    body('employment.employmentType')
      .optional()
      .isIn(['full-time', 'part-time', 'contract']).withMessage('Invalid employment type'),
    body('shiftId')
      .optional()
      .isMongoId().withMessage('Invalid shift ID'),
    body('createUserAccount')
      .optional()
      .isBoolean().withMessage('createUserAccount must be boolean'),
    body('salary.basic')
      .optional()
      .isFloat({ min: 0 }).withMessage('Basic salary must be non-negative'),
    body('salary.allowances')
      .optional()
      .isFloat({ min: 0 }).withMessage('Allowances must be non-negative')
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid employee ID'),
    body('personalInfo.firstName')
      .optional()
      .trim().isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('personalInfo.lastName')
      .optional()
      .trim().isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    body('personalInfo.phone')
      .optional()
      .trim(),
    body('personalInfo.gender')
      .optional()
      .isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('employment.department')
      .optional()
      .trim(),
    body('employment.designation')
      .optional()
      .trim(),
    body('employment.employmentType')
      .optional()
      .isIn(['full-time', 'part-time', 'contract']).withMessage('Invalid employment type'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'on_leave', 'terminated']).withMessage('Invalid status')
  ],

  assignShift: [
    param('id')
      .isMongoId().withMessage('Invalid employee ID'),
    body('shiftId')
      .notEmpty().withMessage('Shift ID is required')
      .isMongoId().withMessage('Invalid shift ID')
  ],

  assignKPI: [
    param('id')
      .isMongoId().withMessage('Invalid employee ID'),
    body('kpiId')
      .notEmpty().withMessage('KPI ID is required')
      .isMongoId().withMessage('Invalid KPI ID'),
    body('targetValue')
      .isFloat({ min: 0 }).withMessage('Target value must be non-negative')
  ],

  overtime: [
    param('id')
      .isMongoId().withMessage('Invalid employee ID'),
    body('allowed')
      .isBoolean().withMessage('Allowed must be boolean')
  ],

  list: [
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'on_leave', 'terminated']).withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 }).toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).toInt()
  ]
};

export { employeeValidation };