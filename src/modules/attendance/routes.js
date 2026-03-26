import express from 'express';
import { body, param, query } from 'express-validator';
import attendanceController from './controller.js';
import { validate } from '../../middleware/validate.js';
import { auth } from '../../middleware/auth.js';
import { setOrganizationInBody } from '../../middleware/tenant.js';

const router = express.Router();

router.use(auth);

// Check-in
router.post('/checkin',
  [
    body('employeeId').optional().isMongoId().withMessage('Invalid employee ID'),
    body('shiftId').optional().isMongoId().withMessage('Invalid shift ID format'),
    body('location.lat').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }),
    body('location.lng').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }),
    body('ip').optional({ values: 'null' }).isIP()
  ],
  validate,
  attendanceController.checkIn
);

// Check-out
router.post('/checkout',
  [
    body('location.lat').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }),
    body('location.lng').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }),
    body('ip').optional({ values: 'null' }).isIP()
  ],
  validate,
  attendanceController.checkOut
);

// Get attendance records (HR/Admin can see all, Employee can see own)
router.get('/',
  [
    query('employeeId').optional().isMongoId(),
    query('date').optional().isISO8601(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('status').optional().isIn(['present', 'absent', 'half_day', 'leave']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  attendanceController.getAttendance
);

// Get attendance for specific employee
router.get('/employee/:id',
  [
    param('id').isMongoId().withMessage('Invalid employee ID'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  attendanceController.getEmployeeAttendance
);

// Get late mark summary
router.get('/late-marks',
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020 }),
    query('employeeId').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validate,
  attendanceController.getLateMarkSummary
);

// Apply late mark deduction (HR/Admin)
router.post('/late-mark-deduction',
  [
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month is required'),
    body('year').isInt({ min: 2020 }).withMessage('Year is required'),
    body('employeeId').optional().isMongoId()
  ],
  validate,
  attendanceController.applyLateMarkDeduction
);

// Get today's attendance status
router.get('/today',
  attendanceController.getTodayAttendance
);

// Get attendance summary report by department
router.get('/summary-report',
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020 })
  ],
  validate,
  attendanceController.getAttendanceSummaryReport
);

// Manual attendance entry (HR/Admin)
router.post('/manual',
  [
    body('employeeId').isMongoId().withMessage('Employee ID is required'),
    body('date').isISO8601().withMessage('Date is required'),
    body('checkIn.time').optional().isISO8601(),
    body('checkOut.time').optional().isISO8601(),
    body('status').isIn(['present', 'absent', 'half_day', 'leave']).withMessage('Valid status is required'),
    body('notes').optional().trim(),
    body('reason').notEmpty().withMessage('Reason for manual entry is required')
  ],
  validate,
  attendanceController.manualEntry
);

export default router;