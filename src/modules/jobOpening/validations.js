import { body, param, query } from 'express-validator';

export const jobOpeningValidation = {
  create: [
    body('title')
      .notEmpty().withMessage('Title is required')
      .trim().isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
      .notEmpty().withMessage('Description is required')
      .trim(),
    body('department')
      .notEmpty().withMessage('Department is required')
      .trim(),
    body('location')
      .notEmpty().withMessage('Location is required')
      .trim(),
    body('employmentType')
      .optional()
      .isIn(['full_time', 'part_time', 'contract', 'internship'])
      .withMessage('Invalid employment type'),
    body('experienceRequired.min')
      .optional()
      .isInt({ min: 0 }).withMessage('Minimum experience must be non-negative'),
    body('experienceRequired.max')
      .optional()
      .isInt({ min: 0 }).withMessage('Maximum experience must be non-negative'),
    body('salaryRange.min')
      .optional()
      .isFloat({ min: 0 }).withMessage('Minimum salary must be non-negative'),
    body('salaryRange.max')
      .optional()
      .isFloat({ min: 0 }).withMessage('Maximum salary must be non-negative'),
    body('skills')
      .optional()
      .isArray().withMessage('Skills must be an array'),
    body('qualifications')
      .optional()
      .isArray().withMessage('Qualifications must be an array'),
    body('responsibilities')
      .optional()
      .isArray().withMessage('Responsibilities must be an array'),
    body('applicationDeadline')
      .optional()
      .isISO8601().withMessage('Valid deadline date is required'),
    body('vacancies')
      .optional()
      .isInt({ min: 1 }).withMessage('Vacancies must be at least 1'),
    body('isRemote')
      .optional()
      .isBoolean().withMessage('isRemote must be a boolean'),
    body('isUrgent')
      .optional()
      .isBoolean().withMessage('isUrgent must be a boolean'),
    body('tags')
      .optional()
      .isArray().withMessage('Tags must be an array')
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid job opening ID'),
    body('title')
      .optional()
      .trim().isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim(),
    body('department')
      .optional()
      .trim(),
    body('location')
      .optional()
      .trim(),
    body('employmentType')
      .optional()
      .isIn(['full_time', 'part_time', 'contract', 'internship'])
      .withMessage('Invalid employment type'),
    body('status')
      .optional()
      .isIn(['draft', 'active', 'closed', 'on_hold'])
      .withMessage('Invalid status')
  ],

  updateStatus: [
    param('id')
      .isMongoId().withMessage('Invalid job opening ID'),
    body('status')
      .isIn(['draft', 'active', 'closed', 'on_hold'])
      .withMessage('Invalid status')
  ]
};