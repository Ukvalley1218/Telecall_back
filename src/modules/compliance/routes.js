import express from 'express';
import { body, param, query } from 'express-validator';
import complianceController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

router.use(auth);

// Get compliance items
router.get('/', [
  query('category').optional().isIn(['statutory', 'regulatory', 'internal', 'certification', 'audit', 'tax', 'labor', 'environmental', 'safety', 'other']),
  query('status').optional().isIn(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']),
  query('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
  query('assignedTo').optional().isMongoId(),
  query('dueBefore').optional().isISO8601(),
  query('dueAfter').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, complianceController.getComplianceItems);

// Get upcoming items
router.get('/upcoming', [
  query('days').optional().isInt({ min: 1, max: 365 })
], validate, complianceController.getUpcomingItems);

// Get overdue items
router.get('/overdue', complianceController.getOverdueItems);

// Get compliance summary
router.get('/summary', complianceController.getComplianceSummary);

// Get compliance calendar
router.get('/calendar', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2100 })
], validate, complianceController.getComplianceCalendar);

// Get items by category
router.get('/category/:category', [
  param('category').isIn(['statutory', 'regulatory', 'internal', 'certification', 'audit', 'tax', 'labor', 'environmental', 'safety', 'other'])
], validate, complianceController.getItemsByCategory);

// Get items by assignee
router.get('/assignee/:assigneeId', [
  param('assigneeId').isMongoId()
], validate, complianceController.getItemsByAssignee);

// Get compliance item by ID
router.get('/:id', [
  param('id').isMongoId()
], validate, complianceController.getComplianceItemById);

// Create compliance item
router.post('/', [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ max: 200 }),
  body('category').optional().isIn(['statutory', 'regulatory', 'internal', 'certification', 'audit', 'tax', 'labor', 'environmental', 'safety', 'other']),
  body('type').optional().isIn(['filing', 'registration', 'license', 'certificate', 'audit', 'inspection', 'other']),
  body('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('assignedTo').optional().isMongoId()
], validate, complianceController.createComplianceItem);

// Update compliance item
router.put('/:id', [
  param('id').isMongoId()
], validate, complianceController.updateComplianceItem);

// Delete compliance item
router.delete('/:id', [
  param('id').isMongoId()
], validate, complianceController.deleteComplianceItem);

// Complete compliance item
router.post('/:id/complete', [
  param('id').isMongoId(),
  body('notes').optional().trim().isLength({ max: 500 })
], validate, complianceController.completeItem);

// Reopen compliance item
router.post('/:id/reopen', [
  param('id').isMongoId(),
  body('reason').optional().trim().isLength({ max: 500 })
], validate, complianceController.reopenItem);

// Add document
router.post('/:id/documents', [
  param('id').isMongoId(),
  body('name').notEmpty().withMessage('Document name is required'),
  body('url').notEmpty().withMessage('Document URL is required'),
  body('type').optional().isIn(['pdf', 'image', 'document', 'spreadsheet', 'other']),
  body('size').optional().isInt({ min: 0 })
], validate, complianceController.addDocument);

// Remove document
router.delete('/:id/documents/:documentName', [
  param('id').isMongoId()
], validate, complianceController.removeDocument);

// Complete requirement
router.post('/:id/requirements/:requirementIndex/complete', [
  param('id').isMongoId(),
  param('requirementIndex').isInt({ min: 0 })
], validate, complianceController.completeRequirement);

export default router;