import express from 'express';
import { body, param, query } from 'express-validator';
import recruitmentController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth, optionalAuth } from '../../middleware/auth.js';
import { isHR } from '../../middleware/rbac.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }, // 5MB default
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

const router = express.Router();

// Public route - Apply for position
router.post('/apply',
  upload.single('resume'),
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').notEmpty().withMessage('Phone is required').trim(),
    body('position').notEmpty().withMessage('Position is required').trim(),
    body('organizationId').notEmpty().withMessage('Organization ID is required'),
    body('jobOpeningId').optional().isMongoId().withMessage('Invalid job opening ID'),
    body('department').optional().trim(),
    body('experience').optional().isFloat({ min: 0 }).withMessage('Experience must be non-negative'),
    body('expectedSalary').optional().isFloat({ min: 0 }).withMessage('Expected salary must be non-negative'),
    body('source').optional().isIn(['website', 'referral', 'job_portal', 'walk_in', 'other'])
  ],
  validate,
  recruitmentController.apply
);

// HR routes - require authentication
router.use(auth);
router.use(isHR);

// Get all candidates
router.get('/',
  [
    query('status').optional().isIn(['applied', 'shortlisted', 'screening', 'interview_scheduled', 'selected', 'training', 'offer_sent', 'rejected']),
    query('department').optional().trim(),
    query('position').optional().trim(),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isIn(['appliedAt', 'name', 'experience', 'status']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  validate,
  recruitmentController.getCandidates
);

// Get pipeline statistics
router.get('/pipeline',
  recruitmentController.getPipelineStats
);

// Get candidate by ID
router.get('/:id',
  [param('id').isMongoId().withMessage('Invalid candidate ID')],
  validate,
  recruitmentController.getCandidate
);

// Update candidate details
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Invalid candidate ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
    body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').optional().notEmpty().withMessage('Phone cannot be empty').trim(),
    body('position').optional().notEmpty().withMessage('Position cannot be empty').trim(),
    body('department').optional().trim(),
    body('experience').optional().isFloat({ min: 0 }).withMessage('Experience must be non-negative'),
    body('expectedSalary').optional().isFloat({ min: 0 }).withMessage('Expected salary must be non-negative'),
    body('source').optional().isIn(['website', 'referral', 'job_portal', 'walk_in', 'other']),
    body('notes').optional().trim()
  ],
  validate,
  recruitmentController.updateCandidate
);

// Update candidate status - Shortlist
router.put('/:id/shortlist',
  [param('id').isMongoId().withMessage('Invalid candidate ID')],
  validate,
  recruitmentController.shortlistCandidate
);

// Add screening notes
router.put('/:id/screen',
  [
    param('id').isMongoId().withMessage('Invalid candidate ID'),
    body('note').notEmpty().withMessage('Screening note is required').trim()
  ],
  validate,
  recruitmentController.addScreeningNotes
);

// Schedule interview
router.put('/:id/schedule-interview',
  [
    param('id').isMongoId().withMessage('Invalid candidate ID'),
    body('scheduledAt').isISO8601().withMessage('Valid interview date is required'),
    body('interviewer').notEmpty().withMessage('Interviewer name is required'),
    body('location').optional().trim(),
    body('notes').optional().trim()
  ],
  validate,
  recruitmentController.scheduleInterview
);

// Mark as selected
router.put('/:id/select',
  [
    param('id').isMongoId().withMessage('Invalid candidate ID'),
    body('notes').optional().trim()
  ],
  validate,
  recruitmentController.selectCandidate
);

// Start training
router.put('/:id/start-training',
  [
    param('id').isMongoId().withMessage('Invalid candidate ID'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('days').isInt({ min: 1 }).withMessage('Training days must be positive'),
    body('notes').optional().trim()
  ],
  validate,
  recruitmentController.startTraining
);

// Complete training
router.put('/:id/complete-training',
  [
    param('id').isMongoId().withMessage('Invalid candidate ID'),
    body('notes').optional().trim()
  ],
  validate,
  recruitmentController.completeTraining
);

// Send offer letter
router.put('/:id/send-offer',
  [
    param('id').isMongoId().withMessage('Invalid candidate ID'),
    body('position').notEmpty().withMessage('Position is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('salary.basic').isFloat({ min: 0 }).withMessage('Basic salary is required'),
    body('salary.allowances').optional().isFloat({ min: 0 }),
    body('joiningDate').isISO8601().withMessage('Valid joining date is required'),
    body('probationPeriod').optional().isInt({ min: 0 })
  ],
  validate,
  recruitmentController.sendOfferLetter
);

// Reject candidate
router.put('/:id/reject',
  [
    param('id').isMongoId().withMessage('Invalid candidate ID'),
    body('reason').notEmpty().withMessage('Rejection reason is required').trim()
  ],
  validate,
  recruitmentController.rejectCandidate
);

// Update candidate status (for drag-and-drop in kanban)
router.put('/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid candidate ID'),
    body('status').isIn(['applied', 'shortlisted', 'screening', 'interview_scheduled', 'selected', 'training', 'offer_sent', 'rejected']).withMessage('Valid status is required')
  ],
  validate,
  recruitmentController.updateStatus
);

// Get offer letter for candidate
router.get('/:id/offer-letter',
  [param('id').isMongoId().withMessage('Invalid candidate ID')],
  validate,
  recruitmentController.getOfferLetter
);

export default router;