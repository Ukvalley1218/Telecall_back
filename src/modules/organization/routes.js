import express from 'express';
import { body } from 'express-validator';
import organizationController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';
import { isAdmin } from '../../middleware/rbac.js';

const router = express.Router();

router.use(auth);

// Get organization details
router.get('/',
  organizationController.getOrganization
);

// Update organization settings (Admin only)
router.put('/',
  isAdmin,
  [
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('settings.lateMarkBuffer').optional().isInt({ min: 0, max: 60 }).withMessage('Buffer must be 0-60 minutes'),
    body('settings.sandwichLeaveEnabled').optional().isBoolean().withMessage('Must be boolean'),
    body('settings.incentivePayoutDays').optional().isInt({ min: 1 }).withMessage('Min 1 day'),
    body('settings.workingDaysPerWeek').optional().isInt({ min: 1, max: 7 }).withMessage('Must be 1-7'),
    body('settings.overtimeMultiplier').optional().isFloat({ min: 1 }).withMessage('Min 1'),
    body('contactDetails.email').optional().isEmail().withMessage('Valid email required'),
    body('contactDetails.phone').optional().trim(),
    body('contactDetails.address.street').optional().trim(),
    body('contactDetails.address.city').optional().trim(),
    body('contactDetails.address.state').optional().trim(),
    body('contactDetails.address.country').optional().trim(),
    body('contactDetails.address.zipCode').optional().trim()
  ],
  validate,
  organizationController.updateOrganization
);

// Check if organization can add employees
router.get('/can-add-employee',
  isAdmin,
  organizationController.canAddEmployee
);

export default router;