import express from 'express';
import { body, param, query } from 'express-validator';
import shiftController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';
import { isHR } from '../../middleware/rbac.js';
import { setOrganizationInBody } from '../../middleware/tenant.js';

const router = express.Router();

router.use(auth);

// Get all shifts
router.get('/',
  [
    query('isActive').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  shiftController.getShifts
);

// Get shift by ID
router.get('/:id',
  [param('id').isMongoId().withMessage('Invalid shift ID')],
  validate,
  shiftController.getShift
);

// Create shift (HR/Admin)
router.post('/',
  isHR,
  setOrganizationInBody,
  [
    body('name').notEmpty().withMessage('Shift name is required').trim(),
    body('timings').isArray({ min: 1 }).withMessage('At least one timing is required'),
    body('timings.*.days').isArray({ min: 1 }).withMessage('Days array is required'),
    body('timings.*.days.*').isInt({ min: 0, max: 6 }).withMessage('Day must be 0-6'),
    body('timings.*.startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format'),
    body('timings.*.endTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format'),
    body('gracePeriodMinutes').optional().isInt({ min: 0, max: 60 }),
    body('halfDayHours').optional().isInt({ min: 1 }),
    body('fullDayHours').optional().isInt({ min: 1 }),
    body('overtimeMultiplier').optional().isFloat({ min: 1 })
  ],
  validate,
  shiftController.createShift
);

// Update shift (HR/Admin)
router.put('/:id',
  isHR,
  [
    param('id').isMongoId().withMessage('Invalid shift ID'),
    body('name').optional().trim(),
    body('timings').optional().isArray({ min: 1 }),
    body('timings.*.days').optional().isArray({ min: 1 }),
    body('timings.*.startTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('timings.*.endTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('gracePeriodMinutes').optional().isInt({ min: 0, max: 60 }),
    body('halfDayHours').optional().isInt({ min: 1 }),
    body('fullDayHours').optional().isInt({ min: 1 }),
    body('overtimeMultiplier').optional().isFloat({ min: 1 })
  ],
  validate,
  shiftController.updateShift
);

// Deactivate shift (HR/Admin)
router.delete('/:id',
  isHR,
  [param('id').isMongoId().withMessage('Invalid shift ID')],
  validate,
  shiftController.deactivateShift
);

export default router;