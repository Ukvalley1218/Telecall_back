import { body, param, query } from 'express-validator';

export const candidateValidation = {
  apply: [
    body('name')
      .notEmpty().withMessage('Name is required')
      .trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('email')
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('phone')
      .notEmpty().withMessage('Phone is required')
      .trim(),
    body('position')
      .notEmpty().withMessage('Position is required')
      .trim(),
    body('organizationId')
      .notEmpty().withMessage('Organization ID is required')
      .isMongoId().withMessage('Invalid organization ID'),
    body('department')
      .optional()
      .trim(),
    body('experience')
      .optional()
      .isFloat({ min: 0 }).withMessage('Experience must be non-negative'),
    body('expectedSalary')
      .optional()
      .isFloat({ min: 0 }).withMessage('Expected salary must be non-negative'),
    body('currentSalary')
      .optional()
      .isFloat({ min: 0 }).withMessage('Current salary must be non-negative'),
    body('source')
      .optional()
      .isIn(['website', 'referral', 'job_portal', 'walk_in', 'other']).withMessage('Invalid source')
  ],

  updateStatus: [
    param('id')
      .isMongoId().withMessage('Invalid candidate ID'),
    body('status')
      .isIn(['applied', 'shortlisted', 'screening', 'interview_scheduled', 'selected', 'training', 'offer_sent', 'rejected'])
      .withMessage('Invalid status')
  ],

  scheduleInterview: [
    param('id')
      .isMongoId().withMessage('Invalid candidate ID'),
    body('scheduledAt')
      .isISO8601().withMessage('Valid interview date is required'),
    body('interviewer')
      .notEmpty().withMessage('Interviewer name is required')
      .trim(),
    body('location')
      .optional()
      .trim(),
    body('notes')
      .optional()
      .trim()
  ],

  offerLetter: [
    param('id')
      .isMongoId().withMessage('Invalid candidate ID'),
    body('position')
      .notEmpty().withMessage('Position is required'),
    body('department')
      .notEmpty().withMessage('Department is required'),
    body('salary.basic')
      .isFloat({ min: 0 }).withMessage('Basic salary is required and must be non-negative'),
    body('salary.allowances')
      .optional()
      .isFloat({ min: 0 }).withMessage('Allowances must be non-negative'),
    body('joiningDate')
      .isISO8601().withMessage('Valid joining date is required'),
    body('probationPeriod')
      .optional()
      .isInt({ min: 0 }).withMessage('Probation period must be non-negative')
  ],

  training: [
    param('id')
      .isMongoId().withMessage('Invalid candidate ID'),
    body('startDate')
      .isISO8601().withMessage('Valid start date is required'),
    body('days')
      .isInt({ min: 1 }).withMessage('Training days must be at least 1'),
    body('notes')
      .optional()
      .trim()
  ]
};

export const offerLetterValidation = {
  create: [
    body('candidateId')
      .notEmpty().withMessage('Candidate ID is required')
      .isMongoId().withMessage('Invalid candidate ID'),
    body('position')
      .notEmpty().withMessage('Position is required'),
    body('department')
      .notEmpty().withMessage('Department is required'),
    body('salary.basic')
      .isFloat({ min: 0 }).withMessage('Basic salary is required'),
    body('salary.allowances')
      .optional()
      .isFloat({ min: 0 }).withMessage('Allowances must be non-negative'),
    body('joiningDate')
      .isISO8601().withMessage('Valid joining date is required'),
    body('probationPeriod')
      .optional()
      .isInt({ min: 0 }).withMessage('Probation period must be non-negative')
  ],

  update: [
    param('id')
      .isMongoId().withMessage('Invalid offer letter ID'),
    body('position')
      .optional(),
    body('department')
      .optional(),
    body('salary.basic')
      .optional()
      .isFloat({ min: 0 }).withMessage('Basic salary must be non-negative'),
    body('salary.allowances')
      .optional()
      .isFloat({ min: 0 }).withMessage('Allowances must be non-negative'),
    body('joiningDate')
      .optional()
      .isISO8601().withMessage('Valid joining date required'),
    body('probationPeriod')
      .optional()
      .isInt({ min: 0 }).withMessage('Probation period must be non-negative')
  ]
};