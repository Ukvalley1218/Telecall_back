import express from 'express';
import { body, param, query } from 'express-validator';
import uploadController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/upload/call-recording
 * @desc    Upload a call recording
 * @access  Private (all authenticated users)
 */
router.post('/call-recording',
  [
    body('file')
      .notEmpty().withMessage('File data is required'),
    body('callType')
      .optional()
      .isIn(['incoming', 'outgoing', 'missed']).withMessage('Invalid call type'),
    body('phoneNumber')
      .optional()
      .trim(),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
    body('tags')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') return true;
        throw new Error('Tags must be an array or comma-separated string');
      }),
    body('duration')
      .optional()
      .isInt({ min: 0 }).withMessage('Duration must be a positive integer')
  ],
  validate,
  uploadController.uploadCallRecording
);

/**
 * @route   GET /api/upload/recordings
 * @desc    Get all recordings for organization
 * @access  Private
 */
router.get('/recordings',
  [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('callType')
      .optional()
      .isIn(['incoming', 'outgoing', 'missed']).withMessage('Invalid call type')
  ],
  validate,
  uploadController.getRecordings
);

/**
 * @route   GET /api/upload/my-recordings
 * @desc    Get current user's recordings
 * @access  Private
 */
router.get('/my-recordings',
  [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validate,
  uploadController.getMyRecordings
);

/**
 * @route   GET /api/upload/recordings/:id
 * @desc    Get recording by ID
 * @access  Private
 */
router.get('/recordings/:id',
  [
    param('id')
      .isMongoId().withMessage('Invalid recording ID')
  ],
  validate,
  uploadController.getRecordingById
);

/**
 * @route   PUT /api/upload/recordings/:id
 * @desc    Update recording metadata
 * @access  Private
 */
router.put('/recordings/:id',
  [
    param('id')
      .isMongoId().withMessage('Invalid recording ID'),
    body('callType')
      .optional()
      .isIn(['incoming', 'outgoing', 'missed']).withMessage('Invalid call type'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
    body('tags')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') return true;
        throw new Error('Tags must be an array or comma-separated string');
      })
  ],
  validate,
  uploadController.updateRecording
);

/**
 * @route   DELETE /api/upload/recordings/:id
 * @desc    Delete recording
 * @access  Private
 */
router.delete('/recordings/:id',
  [
    param('id')
      .isMongoId().withMessage('Invalid recording ID')
  ],
  validate,
  uploadController.deleteRecording
);

/**
 * @route   POST /api/upload/file
 * @desc    Upload any file to Cloudinary
 * @access  Private
 */
router.post('/file',
  [
    body('file')
      .notEmpty().withMessage('File data is required'),
    body('folder')
      .optional()
      .trim(),
    body('resourceType')
      .optional()
      .isIn(['image', 'video', 'raw', 'auto']).withMessage('Invalid resource type')
  ],
  validate,
  uploadController.uploadFile
);

export default router;