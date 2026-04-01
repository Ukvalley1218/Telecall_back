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

// Payroll routes
import payrollRoutes from '../modules/payroll/routes.js';
router.use('/payroll', payrollRoutes);

// Event routes
import eventRoutes from '../modules/event/routes.js';
router.use('/events', eventRoutes);

// Training routes
import trainingRoutes from '../modules/training/routes.js';
router.use('/trainings', trainingRoutes);

// Compliance routes
import complianceRoutes from '../modules/compliance/routes.js';
router.use('/compliance', complianceRoutes);

// DWR routes
import dwrRoutes from '../modules/dwr/routes.js';
router.use('/dwr', dwrRoutes);

// Holiday routes
import holidayRoutes from '../modules/holiday/routes.js';
router.use('/holidays', holidayRoutes);

// Employee Self-Service routes (for logged-in employees)
import employeeSelfServiceRoutes from '../modules/employeeSelfService/routes.js';
router.use('/me', employeeSelfServiceRoutes);

// Marketing routes
import marketingRoutes from '../modules/marketing/routes.js';
router.use('/marketing', marketingRoutes);

// Sales routes
import salesRoutes from '../modules/sales/routes.js';
router.use('/sales', salesRoutes);

// Interior Designer routes
import interiorDesignerRoutes from '../modules/interiorDesigner/routes.js';
router.use('/interior-designer', interiorDesignerRoutes);

// Thank You Card routes
import thankYouCardRoutes from '../modules/thankYouCard/routes.js';
router.use('/thankyou', thankYouCardRoutes);

// Order Management routes
import orderRoutes from '../modules/order/routes.js';
router.use('/orders', orderRoutes);

// Production routes
import productionRoutes from '../modules/production/routes.js';
router.use('/production', productionRoutes);

export default router;