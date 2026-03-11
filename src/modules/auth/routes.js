import express from 'express';
import { body } from 'express-validator';
import authController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';

const router = express.Router();

// Register organization and admin
router.post('/register',
  [
    body('organization.name')
      .notEmpty().withMessage('Organization name is required')
      .trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('organization.domain')
      .notEmpty().withMessage('Domain is required')
      .trim().toLowerCase()
      .matches(/^[a-z0-9-]+$/).withMessage('Domain can only contain lowercase letters, numbers, and hyphens'),
    body('organization.subscriptionPlan')
      .optional()
      .isIn(['free', 'basic', 'premium', 'enterprise']).withMessage('Invalid subscription plan'),
    body('user.email')
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('user.password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('user.firstName')
      .notEmpty().withMessage('First name is required')
      .trim(),
    body('user.lastName')
      .notEmpty().withMessage('Last name is required')
      .trim()
  ],
  validate,
  authController.register
);

// Login
router.post('/login',
  [
    body('email')
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],
  validate,
  authController.login
);

// Refresh token
router.post('/refresh',
  [
    body('refreshToken')
      .notEmpty().withMessage('Refresh token is required')
  ],
  validate,
  authController.refreshToken
);

// Get current user (protected)
router.get('/me', auth, authController.getCurrentUser);

// Update current user profile (protected)
router.put('/me',
  auth,
  [
    body('firstName')
      .optional()
      .trim().isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .trim().isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    body('phone')
      .optional()
      .trim()
  ],
  validate,
  authController.updateProfile
);

// Change password (protected)
router.put('/password',
  auth,
  [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validate,
  authController.changePassword
);

export default router;