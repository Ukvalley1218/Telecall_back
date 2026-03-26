import express from 'express';
import { body, param, query } from 'express-validator';
import trainingController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

router.use(auth);

// Get trainings
router.get('/', [
  query('type').optional().isIn(['onboarding', 'technical', 'soft_skills', 'compliance', 'safety', 'leadership', 'product', 'other']),
  query('status').optional().isIn(['draft', 'scheduled', 'in_progress', 'completed', 'cancelled']),
  query('isMandatory').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, trainingController.getTrainings);

// Get upcoming trainings
router.get('/upcoming', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], validate, trainingController.getUpcomingTrainings);

// Get mandatory trainings
router.get('/mandatory', trainingController.getMandatoryTrainings);

// Get training stats
router.get('/stats', trainingController.getTrainingStats);

// Get training by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid training ID')
], validate, trainingController.getTrainingById);

// Create training
router.post('/', [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 200 }),
  body('type').optional().isIn(['onboarding', 'technical', 'soft_skills', 'compliance', 'safety', 'leadership', 'product', 'other']),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('maxParticipants').optional().isInt({ min: 0 }),
  body('minParticipants').optional().isInt({ min: 0 }),
  body('instructor').optional().isMongoId().withMessage('Invalid instructor ID')
], validate, trainingController.createTraining);

// Update training
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid training ID')
], validate, trainingController.updateTraining);

// Delete training
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid training ID')
], validate, trainingController.deleteTraining);

// Start training
router.post('/:id/start', [
  param('id').isMongoId().withMessage('Invalid training ID')
], validate, trainingController.startTraining);

// Complete training
router.post('/:id/complete', [
  param('id').isMongoId().withMessage('Invalid training ID')
], validate, trainingController.completeTraining);

// Cancel training
router.post('/:id/cancel', [
  param('id').isMongoId().withMessage('Invalid training ID'),
  body('reason').optional().trim().isLength({ max: 500 })
], validate, trainingController.cancelTraining);

// Enrollment routes

// Enroll employee
router.post('/enroll', [
  body('trainingId').isMongoId().withMessage('Valid training ID is required'),
  body('employeeId').isMongoId().withMessage('Valid employee ID is required'),
  body('enrollmentType').optional().isIn(['self', 'assigned', 'mandatory'])
], validate, trainingController.enrollEmployee);

// Cancel enrollment
router.delete('/:trainingId/enrollments/:employeeId', [
  param('trainingId').isMongoId().withMessage('Invalid training ID'),
  param('employeeId').isMongoId().withMessage('Invalid employee ID'),
  body('reason').optional().trim()
], validate, trainingController.cancelEnrollment);

// Get employee enrollments
router.get('/enrollments/employee/:employeeId', [
  param('employeeId').isMongoId().withMessage('Invalid employee ID'),
  query('status').optional().isIn(['enrolled', 'in_progress', 'completed', 'failed', 'cancelled'])
], validate, trainingController.getEmployeeEnrollments);

// Get training enrollments
router.get('/:trainingId/enrollments', [
  param('trainingId').isMongoId().withMessage('Invalid training ID'),
  query('status').optional().isIn(['enrolled', 'in_progress', 'completed', 'failed', 'cancelled'])
], validate, trainingController.getTrainingEnrollments);

// Update progress
router.put('/enrollments/:enrollmentId/progress', [
  param('enrollmentId').isMongoId().withMessage('Invalid enrollment ID'),
  body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('sessionsAttended').optional().isInt({ min: 0 })
], validate, trainingController.updateProgress);

// Complete training for employee
router.post('/enrollments/:enrollmentId/complete', [
  param('enrollmentId').isMongoId().withMessage('Invalid enrollment ID'),
  body('score').optional().isInt({ min: 0, max: 100 })
], validate, trainingController.completeTrainingForEmployee);

// Submit feedback
router.post('/enrollments/:enrollmentId/feedback', [
  param('enrollmentId').isMongoId().withMessage('Invalid enrollment ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comments').optional().trim().isLength({ max: 1000 }),
  body('content').optional().isInt({ min: 1, max: 5 }),
  body('instructor').optional().isInt({ min: 1, max: 5 }),
  body('materials').optional().isInt({ min: 1, max: 5 })
], validate, trainingController.submitFeedback);

export default router;