import express from 'express';
import { body, param, query } from 'express-validator';
import jobOpeningController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth, optionalAuth } from '../../middleware/auth.js';
import { isHR, isAdmin } from '../../middleware/rbac.js';

const router = express.Router();

// Public routes - Get active job openings (no auth required)
router.get('/public',
  [
    query('organizationId').notEmpty().withMessage('Organization ID is required'),
    query('department').optional().trim(),
    query('location').optional().trim(),
    query('type').optional().isIn(['full_time', 'part_time', 'contract', 'internship']),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ],
  validate,
  jobOpeningController.getPublicJobOpenings
);

// Get single job opening (public)
router.get('/public/:id',
  [param('id').isMongoId().withMessage('Invalid job opening ID')],
  validate,
  jobOpeningController.getPublicJobOpening
);

// HR/Admin routes - require authentication
router.use(auth);
router.use(isHR);

// Get all job openings (HR/Admin)
router.get('/',
  [
    query('status').optional().isIn(['draft', 'active', 'closed', 'on_hold']),
    query('department').optional().trim(),
    query('location').optional().trim(),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isIn(['createdAt', 'title', 'vacancies', 'applicationsCount']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  validate,
  jobOpeningController.getJobOpenings
);

// Get job opening statistics
router.get('/statistics',
  jobOpeningController.getJobOpeningStats
);

// Get job opening by ID
router.get('/:id',
  [param('id').isMongoId().withMessage('Invalid job opening ID')],
  validate,
  jobOpeningController.getJobOpening
);

// Create new job opening
router.post('/',
  [
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
  validate,
  jobOpeningController.createJobOpening
);

// Update job opening
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Invalid job opening ID'),
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
  validate,
  jobOpeningController.updateJobOpening
);

// Activate job opening
router.put('/:id/activate',
  [param('id').isMongoId().withMessage('Invalid job opening ID')],
  validate,
  jobOpeningController.activateJobOpening
);

// Close job opening
router.put('/:id/close',
  [param('id').isMongoId().withMessage('Invalid job opening ID')],
  validate,
  jobOpeningController.closeJobOpening
);

// Put job opening on hold
router.put('/:id/hold',
  [param('id').isMongoId().withMessage('Invalid job opening ID')],
  validate,
  jobOpeningController.holdJobOpening
);

// Delete job opening
router.delete('/:id',
  [param('id').isMongoId().withMessage('Invalid job opening ID')],
  validate,
  jobOpeningController.deleteJobOpening
);

// Get applications for a job opening
router.get('/:id/applications',
  [
    param('id').isMongoId().withMessage('Invalid job opening ID'),
    query('status').optional().isIn(['applied', 'shortlisted', 'screening', 'interview_scheduled', 'selected', 'training', 'offer_sent', 'rejected']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  jobOpeningController.getJobApplications
);

export default router;