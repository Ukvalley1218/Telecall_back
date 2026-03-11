import express from 'express';
const router = express.Router();

// Organization routes
import organizationRoutes from '../modules/organization/routes.js';
router.use('/organization', organizationRoutes);

// Auth routes (some public)
import authRoutes from '../modules/auth/routes.js';
router.use('/auth', authRoutes);

// Job Opening routes (has public routes)
import jobOpeningRoutes from '../modules/jobOpening/routes.js';
router.use('/job-openings', jobOpeningRoutes);

// Recruitment routes (has public apply route)
import recruitmentRoutes from '../modules/recruitment/routes.js';
router.use('/candidates', recruitmentRoutes);

// Protected routes - auth middleware applied after public routes
import { auth } from '../middleware/auth.js';
router.use(auth);

// Dashboard routes
import dashboardRoutes from '../modules/dashboard/routes.js';
router.use('/dashboard', dashboardRoutes);

// Employee routes
import employeeRoutes from '../modules/employee/routes.js';
router.use('/employees', employeeRoutes);

// KPI routes
import kpiRoutes from '../modules/kpi/routes.js';
router.use('/kpi', kpiRoutes);

// Shift routes
import shiftRoutes from '../modules/shift/routes.js';
router.use('/shifts', shiftRoutes);

// Attendance routes
import attendanceRoutes from '../modules/attendance/routes.js';
router.use('/attendance', attendanceRoutes);

// Incentive routes
import incentiveRoutes from '../modules/incentive/routes.js';
router.use('/incentives', incentiveRoutes);

// Sandwich leave routes
import sandwichLeaveRoutes from '../modules/sandwichLeave/routes.js';
router.use('/sandwich-leaves', sandwichLeaveRoutes);

// Performance routes
import performanceRoutes from '../modules/performance/routes.js';
router.use('/performance', performanceRoutes);

// Leave routes
import leaveRoutes from '../modules/leave/routes.js';
router.use('/leave', leaveRoutes);

export default router;