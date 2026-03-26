import express from 'express';
import { body, param, query } from 'express-validator';
import interiorDesignerController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Dashboard routes
router.get('/dashboard/stats',
  validate,
  interiorDesignerController.getDashboardStats
);

router.get('/dashboard/activities',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ],
  validate,
  interiorDesignerController.getRecentActivities
);

// Designers route - get available designers (employees with design-related designations)
router.get('/designers',
  validate,
  interiorDesignerController.getDesigners
);

// Project CRUD routes
router.get('/projects',
  [
    query('stage').optional().isIn([
      'New Request',
      'Assigned',
      'Design In Progress',
      'Pending Review',
      'Client Review',
      'Revision',
      'Approved',
      'Completed'
    ]),
    query('status').optional().isIn(['active', 'on_hold', 'completed', 'cancelled']),
    query('priority').optional().isIn(['High', 'Medium', 'Low']),
    query('assignedTo').optional().isMongoId(),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  interiorDesignerController.getProjects
);

router.get('/projects/stats',
  validate,
  interiorDesignerController.getProjectStats
);

router.get('/projects/new-requests',
  validate,
  interiorDesignerController.getNewProjectRequests
);

router.get('/projects/designer/:designerId',
  [param('designerId').isMongoId().withMessage('Invalid designer ID')],
  validate,
  interiorDesignerController.getProjectsByDesigner
);

router.get('/projects/:id',
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  interiorDesignerController.getProjectById
);

router.post('/projects',
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('clientName').notEmpty().withMessage('Client name is required').trim(),
    body('projectType').optional().isIn(['Kitchen', 'Wardrobe', 'Full Home', 'Office', 'Commercial', 'Other']),
    body('projectValue').optional().isFloat({ min: 0 }),
    body('priority').optional().isIn(['High', 'Medium', 'Low']),
    body('description').optional().trim(),
    body('clientPhone').optional().trim(),
    body('clientEmail').optional().isEmail().withMessage('Invalid email'),
    body('clientAddress').optional().trim(),
    body('expectedCompletionDate').optional().isISO8601(),
    body('salesLeadId').optional().isMongoId()
  ],
  validate,
  interiorDesignerController.createProject
);

router.put('/projects/:id',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('title').optional().trim(),
    body('clientName').optional().trim(),
    body('projectType').optional().isIn(['Kitchen', 'Wardrobe', 'Full Home', 'Office', 'Commercial', 'Other']),
    body('projectValue').optional().isFloat({ min: 0 }),
    body('priority').optional().isIn(['High', 'Medium', 'Low']),
    body('description').optional().trim(),
    body('status').optional().isIn(['active', 'on_hold', 'completed', 'cancelled']),
    body('expectedCompletionDate').optional().isISO8601(),
    body('notes').optional().trim(),
    body('internalNotes').optional().trim()
  ],
  validate,
  interiorDesignerController.updateProject
);

router.patch('/projects/:id/stage',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('stage').notEmpty().withMessage('Stage is required').isIn([
      'New Request',
      'Assigned',
      'Design In Progress',
      'Pending Review',
      'Client Review',
      'Revision',
      'Approved',
      'Completed'
    ])
  ],
  validate,
  interiorDesignerController.updateProjectStage
);

router.patch('/projects/:id/assign',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('designerId').notEmpty().withMessage('Designer ID is required').isMongoId(),
    body('designerName').notEmpty().withMessage('Designer name is required').trim()
  ],
  validate,
  interiorDesignerController.assignProject
);

router.delete('/projects/:id',
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  interiorDesignerController.deleteProject
);

router.delete('/projects/:id/permanent',
  [param('id').isMongoId().withMessage('Invalid project ID')],
  validate,
  interiorDesignerController.hardDeleteProject
);

// Design Review routes
router.get('/design-review',
  [
    query('status').optional().isIn(['Under Review', 'Ongoing', 'Completed'])
  ],
  validate,
  interiorDesignerController.getDesignReviewProjects
);

router.patch('/projects/:id/approve',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('notes').optional().trim()
  ],
  validate,
  interiorDesignerController.approveDesign
);

router.patch('/projects/:id/redesign',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('feedback').notEmpty().withMessage('Feedback is required').trim(),
    body('attachmentUrl').optional().trim()
  ],
  validate,
  interiorDesignerController.requestRedesign
);

// Client Approval routes
router.get('/client-approval',
  validate,
  interiorDesignerController.getClientApprovalProjects
);

router.patch('/projects/:id/send-to-client',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('message').optional().trim()
  ],
  validate,
  interiorDesignerController.sendToClient
);

// Upload design PDF
router.post('/projects/:id/upload-design-pdf',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('url').notEmpty().withMessage('PDF URL is required').trim(),
    body('name').optional().trim()
  ],
  validate,
  interiorDesignerController.uploadDesignPdf
);

// Upload final PDF (with measurements)
router.post('/projects/:id/upload-final-pdf',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('url').notEmpty().withMessage('PDF URL is required').trim(),
    body('name').optional().trim()
  ],
  validate,
  interiorDesignerController.uploadFinalPdf
);

// Client approve design (HOD approves on behalf of client)
router.patch('/projects/:id/client-approve',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('notes').optional().trim()
  ],
  validate,
  interiorDesignerController.clientApprove
);

// Client reject design
router.patch('/projects/:id/client-reject',
  [
    param('id').isMongoId().withMessage('Invalid project ID'),
    body('reason').notEmpty().withMessage('Rejection reason is required').trim()
  ],
  validate,
  interiorDesignerController.clientReject
);

export default router;