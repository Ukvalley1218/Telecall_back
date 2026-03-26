import express from 'express';
import { body, param, query } from 'express-validator';
import dwrController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for DWR proof uploads
const uploadDir = path.join(__dirname, '../../../uploads/dwr-proofs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const dwrProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'dwr-proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const dwrProofUpload = multer({
  storage: dwrProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, jpeg, png), PDFs, and Word documents are allowed'));
    }
  }
});

const router = express.Router();

router.use(auth);

// Get DWRs
router.get('/', [
  query('employeeId').optional().isMongoId(),
  query('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected']),
  query('reviewStatus').optional().isIn(['pending', 'reviewed', 'needs_attention']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('date').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, dwrController.getDWRs);

// Get today's DWR
router.get('/today', dwrController.getTodayDWR);

// Submit hourly report with proof upload
// Multer must come FIRST to parse FormData, then validation, then controller
router.post('/hourly-report',
  dwrProofUpload.single('proof'),
  [
    body('hourSlot').matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/).withMessage('Valid hour slot is required (format: HH:MM-HH:MM)'),
    body('workDescription').notEmpty().withMessage('Work description is required').trim().isLength({ max: 1000 }).withMessage('Work description max 1000 characters')
  ],
  validate,
  dwrController.submitHourlyReport
);

// Create or update today's DWR
router.post('/today', [
  body('tasks').optional().isArray(),
  body('notes').optional().trim().isLength({ max: 2000 }),
  body('nextDayPlan').optional().trim().isLength({ max: 1000 }),
  body('challenges').optional().trim().isLength({ max: 500 })
], validate, dwrController.createOrUpdateTodayDWR);

// Get DWR stats
router.get('/stats', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, dwrController.getDWRStats);

// Get compliance stats
router.get('/compliance', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, dwrController.getComplianceStats);

// Get DWR performance stats for HRMS
router.get('/performance-stats', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, dwrController.getDWRPerformanceStats);

// Get pending reviews
router.get('/pending-reviews', dwrController.getPendingReviews);

// Get employee monthly DWRs
router.get('/employee/:employeeId/monthly', [
  param('employeeId').isMongoId(),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, dwrController.getEmployeeMonthlyDWRs);

// Get employee DWR summary
router.get('/employee/:employeeId/summary', [
  param('employeeId').isMongoId(),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, dwrController.getEmployeeDWRSummary);

// Get DWR by ID
router.get('/:id', [
  param('id').isMongoId()
], validate, dwrController.getDWRById);

// Create DWR
router.post('/', [
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('tasks').optional().isArray(),
  body('notes').optional().trim().isLength({ max: 2000 }),
  body('nextDayPlan').optional().trim().isLength({ max: 1000 }),
  body('challenges').optional().trim().isLength({ max: 500 })
], validate, dwrController.createDWR);

// Update DWR
router.put('/:id', [
  param('id').isMongoId()
], validate, dwrController.updateDWR);

// Delete DWR
router.delete('/:id', [
  param('id').isMongoId()
], validate, dwrController.deleteDWR);

// Submit DWR
router.post('/:id/submit', [
  param('id').isMongoId()
], validate, dwrController.submitDWR);

// Add review
router.post('/:id/review', [
  param('id').isMongoId(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comments').optional().trim().isLength({ max: 500 }),
  body('needsAttention').optional().isBoolean()
], validate, dwrController.addReview);

// Add task
router.post('/:id/tasks', [
  param('id').isMongoId(),
  body('title').notEmpty().withMessage('Task title is required'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'blocked']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], validate, dwrController.addTask);

// Update task
router.put('/:id/tasks/:taskId', [
  param('id').isMongoId(),
  param('taskId').isMongoId()
], validate, dwrController.updateTask);

// Remove task
router.delete('/:id/tasks/:taskId', [
  param('id').isMongoId(),
  param('taskId').isMongoId()
], validate, dwrController.removeTask);

export default router;