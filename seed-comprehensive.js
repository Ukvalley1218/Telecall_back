/**
 * Comprehensive Seed File for HRMS Module
 * Seeds all data for testing all features
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Models
import Organization from './src/models/Organization.js';
import User from './src/models/User.js';
import Employee from './src/models/Employee.js';
import Shift from './src/models/Shift.js';
import KPI from './src/models/KPI.js';
import JobOpening from './src/models/JobOpening.js';
import Candidate from './src/models/Candidate.js';
import Attendance from './src/models/Attendance.js';
import Incentive from './src/models/Incentive.js';
import LeaveType from './src/models/LeaveType.js';
import LeaveBalance from './src/models/LeaveBalance.js';
import LeaveRequest from './src/models/LeaveRequest.js';
import Holiday from './src/models/Holiday.js';
import Event from './src/models/Event.js';
import Training from './src/models/Training.js';
import TrainingEnrollment from './src/models/TrainingEnrollment.js';
import ComplianceItem from './src/models/ComplianceItem.js';
import PerformanceRecord from './src/models/PerformanceRecord.js';
import SalaryStructure from './src/models/SalaryStructure.js';
import Payslip from './src/models/Payslip.js';
import PayrollRun from './src/models/PayrollRun.js';
import SalesLead from './src/models/SalesLead.js';
import ClientMilestone from './src/models/ClientMilestone.js';
import Campaign from './src/models/Campaign.js';
import MarketingLead from './src/models/MarketingLead.js';
import DesignProject from './src/models/DesignProject.js';
import Quotation from './src/models/Quotation.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const clearAllData = async () => {
  console.log('Clearing all existing data...');
  const models = [
    Organization, User, Employee, Shift, KPI, JobOpening, Candidate,
    Attendance, Incentive, LeaveType, LeaveBalance, LeaveRequest,
    Holiday, Event, Training, TrainingEnrollment, ComplianceItem,
    PerformanceRecord, SalaryStructure, Payslip, PayrollRun,
    SalesLead, ClientMilestone, Campaign, MarketingLead, DesignProject, Quotation
  ];
  for (const model of models) {
    await model.deleteMany({});
  }
  console.log('All data cleared');
};

const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

// ==================== MAIN SEED FUNCTION ====================
const runComprehensiveSeed = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('COMPREHENSIVE DATABASE SEEDING');
  console.log('='.repeat(60) + '\n');

  try {
    await connectDB();
    await clearAllData();

    // ===== ORGANIZATION & USERS =====
    console.log('\n=== Creating Organization & Users ===\n');
    const organization = new Organization({
      name: 'BestKitchen',
      domain: 'bestkitchen',
      subscriptionPlan: 'premium',
      maxEmployees: 100,
      contactDetails: {
        email: 'contact@bestkitchen.com',
        phone: '+91-9876543210',
        address: { street: '123 Kitchen Street', city: 'Mumbai', state: 'MH', country: 'India', zipCode: '400001' }
      },
      settings: { lateMarkBuffer: 10, sandwichLeaveEnabled: true, incentivePayoutDays: 45, workingDaysPerWeek: 5, overtimeMultiplier: 1.5 }
    });
    await organization.save();
    console.log('✓ Organization:', organization.name);

    const adminUser = new User({
      organizationId: organization._id,
      email: 'admin@bestkitchen.com',
      password: 'admin123',
      role: 'admin',
      profile: { firstName: 'Admin', lastName: 'User', phone: '+91-9876543210' },
      isActive: true
    });
    await adminUser.save();
    console.log('✓ Admin:', adminUser.email);

    const hrUsers = [];
    const hrData = [
      { firstName: 'Sneha', lastName: 'Gupta', email: 'sneha.hr@bestkitchen.com', phone: '+91-9876543211' },
      { firstName: 'Rahul', lastName: 'Sharma', email: 'rahul.hr@bestkitchen.com', phone: '+91-9876543212' }
    ];
    for (const data of hrData) {
      const hrUser = new User({
        organizationId: organization._id,
        email: data.email,
        password: 'hr123456',
        role: 'hr',
        profile: { firstName: data.firstName, lastName: data.lastName, phone: data.phone },
        isActive: true
      });
      await hrUser.save();
      hrUsers.push(hrUser);
    }
    console.log('✓ HR Users:', hrUsers.length);

    // ===== DEMO ORGANIZATION (BestKitchenette) =====
    console.log('\n=== Creating Demo Organization (BestKitchenette) ===\n');
    const demoOrg = new Organization({
      name: 'DemoKitchenette',
      domain: 'demokitchenette',
      subscriptionPlan: 'premium',
      maxEmployees: 50,
      contactDetails: {
        email: 'contact@demokitchenette.com',
        phone: '+91-9876543299',
        address: { street: '456 Kitchen Avenue', city: 'Mumbai', state: 'MH', country: 'India', zipCode: '400002' }
      },
      settings: { lateMarkBuffer: 10, sandwichLeaveEnabled: true, incentivePayoutDays: 45, workingDaysPerWeek: 5, overtimeMultiplier: 1.5 }
    });
    await demoOrg.save();
    console.log('✓ Demo Organization:', demoOrg.name);

    // Demo Admin User
    const demoAdminUser = new User({
      organizationId: demoOrg._id,
      email: 'admin@bestkitchenette.com',
      password: 'admin123',
      role: 'admin',
      profile: { firstName: 'Demo', lastName: 'Admin', phone: '+91-9876543298' },
      isActive: true
    });
    await demoAdminUser.save();
    console.log('✓ Demo Admin:', demoAdminUser.email);

    // Demo Employee User
    const demoEmployeeUser = new User({
      organizationId: demoOrg._id,
      email: 'rajesh.k@bestkitchenette.com',
      password: 'employee123',
      role: 'employee',
      profile: { firstName: 'Rajesh', lastName: 'Kumar', phone: '+91-9876543297' },
      isActive: true
    });
    await demoEmployeeUser.save();
    console.log('✓ Demo Employee:', demoEmployeeUser.email);

    // Demo Employee Record
    const demoShift = new Shift({
      organizationId: demoOrg._id,
      name: 'General Shift',
      code: 'DEMO-GS001',
      startTime: '09:00',
      endTime: '18:00',
      days: [1, 2, 3, 4, 5],
      graceMinutes: 10,
      isDefault: true,
      isActive: true,
      createdBy: demoAdminUser._id
    });
    await demoShift.save();

    const demoEmployee = new Employee({
      organizationId: demoOrg._id,
      userId: demoEmployeeUser._id,
      personalInfo: {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh.k@bestkitchenette.com',
        phone: '+91-9876543297',
        dateOfBirth: new Date(1990, 5, 15),
        gender: 'male',
        address: { street: '789 Demo Street', city: 'Mumbai', state: 'MH', country: 'India', zipCode: '400002' },
        emergencyContact: { name: 'Emergency Contact', relationship: 'Spouse', phone: '+91-9876543296' }
      },
      employment: {
        department: 'Sales',
        designation: 'Senior Sales Executive',
        joiningDate: new Date(2023, 0, 1),
        employmentType: 'full-time',
        probationPeriod: 6
      },
      shiftId: demoShift._id,
      status: 'active',
      salary: { basic: 35000, allowances: 5000, monthlyTarget: 500000 },
      overtimeAllowed: true,
      bankDetails: { accountNumber: '9876543210', bankName: 'HDFC Bank', ifscCode: 'HDFC0001234', accountHolderName: 'Rajesh Kumar' }
    });
    await demoEmployee.save();
    console.log('✓ Demo Employee Record:', demoEmployee.personalInfo.firstName, demoEmployee.personalInfo.lastName);

    // ===== SHIFTS =====
    console.log('\n=== Creating Shifts ===\n');
    const shifts = [];
    const shiftData = [
      { name: 'General Shift', code: 'GS001', startTime: '09:00', endTime: '18:00', days: [1, 2, 3, 4, 5] },
      { name: 'Morning Shift', code: 'MS001', startTime: '06:00', endTime: '14:00', days: [1, 2, 3, 4, 5, 6] },
      { name: 'Evening Shift', code: 'ES001', startTime: '14:00', endTime: '22:00', days: [1, 2, 3, 4, 5] },
      { name: 'Night Shift', code: 'NS001', startTime: '22:00', endTime: '06:00', days: [1, 2, 3, 4, 5] }
    ];
    for (const data of shiftData) {
      const shift = new Shift({
        organizationId: organization._id,
        name: data.name,
        code: data.code,
        timings: [{ days: data.days, startTime: data.startTime, endTime: data.endTime }],
        gracePeriodMinutes: 10,
        halfDayHours: 4,
        fullDayHours: 8,
        createdBy: adminUser._id
      });
      await shift.save();
      shifts.push(shift);
    }
    console.log('✓ Shifts:', shifts.length);

    // ===== KPIs =====
    console.log('\n=== Creating KPIs ===\n');
    const kpis = [];
    const kpiGroups = [
      { group: 'Sales', kpis: [
        { name: 'Revenue Generated', unit: 'Rs', targetValue: 500000, maxValue: 1000000, weightage: 5 },
        { name: 'Calls Made', unit: 'Count', targetValue: 100, maxValue: 200, weightage: 2 },
        { name: 'Leads Generated', unit: 'Count', targetValue: 30, maxValue: 60, weightage: 3 }
      ]},
      { group: 'Design', kpis: [
        { name: 'Unique Designs Created', unit: 'Count', targetValue: 15, maxValue: 30, weightage: 4 },
        { name: 'Client Approvals', unit: 'Count', targetValue: 8, maxValue: 20, weightage: 4 }
      ]},
      { group: 'Marketing', kpis: [
        { name: 'Campaigns Launched', unit: 'Count', targetValue: 5, maxValue: 15, weightage: 4 },
        { name: 'Lead Conversion', unit: 'Percentage', targetValue: 15, maxValue: 40, weightage: 5 }
      ]}
    ];
    for (const groupData of kpiGroups) {
      for (const kpiData of groupData.kpis) {
        const kpi = new KPI({
          organizationId: organization._id,
          name: kpiData.name,
          unit: kpiData.unit,
          group: groupData.group,
          targetValue: kpiData.targetValue,
          maxValue: kpiData.maxValue,
          description: `${kpiData.name} for ${groupData.group} team`,
          weightage: kpiData.weightage,
          frequency: 'monthly',
          isActive: true,
          createdBy: adminUser._id
        });
        await kpi.save();
        kpis.push(kpi);
      }
    }
    console.log('✓ KPIs:', kpis.length);

    // ===== EMPLOYEES =====
    console.log('\n=== Creating Employees ===\n');
    const employees = [];
    const employeeData = [
      { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.k@bestkitchen.com', phone: '+91-9876540001', department: 'Sales', designation: 'Senior Sales Executive', salary: { basic: 35000, allowances: 5000, monthlyTarget: 500000 } },
      { firstName: 'Vikram', lastName: 'Singh', email: 'vikram.s@bestkitchen.com', phone: '+91-9876540002', department: 'Sales', designation: 'Sales Manager', salary: { basic: 55000, allowances: 8000, monthlyTarget: 800000 } },
      { firstName: 'Anita', lastName: 'Patel', email: 'anita.p@bestkitchen.com', phone: '+91-9876540003', department: 'Sales', designation: 'Sales Executive', salary: { basic: 28000, allowances: 4000, monthlyTarget: 400000 } },
      { firstName: 'Priya', lastName: 'Sharma', email: 'priya.s@bestkitchen.com', phone: '+91-9876540005', department: 'Interior Design', designation: 'Lead Designer', salary: { basic: 45000, allowances: 7000, monthlyTarget: 600000 } },
      { firstName: 'Neha', lastName: 'Reddy', email: 'neha.r@bestkitchen.com', phone: '+91-9876540006', department: 'Interior Design', designation: 'Junior Designer', salary: { basic: 25000, allowances: 3500, monthlyTarget: 350000 } },
      { firstName: 'Amit', lastName: 'Patel', email: 'amit.p@bestkitchen.com', phone: '+91-9876540008', department: 'Production', designation: 'Production Manager', salary: { basic: 50000, allowances: 7500, monthlyTarget: 450000 } },
      { firstName: 'Pooja', lastName: 'Mehta', email: 'pooja.m@bestkitchen.com', phone: '+91-9876540011', department: 'HR', designation: 'HR Executive', salary: { basic: 28000, allowances: 4000, monthlyTarget: 200000 } },
      { firstName: 'Meera', lastName: 'Iyer', email: 'meera.i@bestkitchen.com', phone: '+91-9876540015', department: 'Marketing', designation: 'Marketing Manager', salary: { basic: 52000, allowances: 8000, monthlyTarget: 550000 } },
      { firstName: 'Arun', lastName: 'Menon', email: 'arun.m@bestkitchen.com', phone: '+91-9876540017', department: 'Finance', designation: 'Accountant', salary: { basic: 38000, allowances: 5500, monthlyTarget: 300000 } }
    ];

    const getKPIGroupForDepartment = (department) => {
      const mapping = { 'Sales': 'Sales', 'Interior Design': 'Design', 'Production': 'Sales', 'HR': 'Sales', 'Marketing': 'Marketing', 'Finance': 'Marketing' };
      return mapping[department] || 'Sales';
    };

    for (let i = 0; i < employeeData.length; i++) {
      const data = employeeData[i];
      const joiningDate = new Date(2023, i % 12, (i % 28) + 1);
      const employee = new Employee({
        organizationId: organization._id,
        personalInfo: {
          firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone,
          dateOfBirth: new Date(1990 + (i % 15), i % 12, (i * 3) % 28 + 1),
          gender: i % 2 === 0 ? 'male' : 'female',
          address: { street: `${i + 1}00 Main Street`, city: 'Mumbai', state: 'MH', country: 'India', zipCode: '400001' },
          emergencyContact: { name: `Emergency Contact ${i + 1}`, relationship: 'Spouse', phone: `+91-98765410${String(i).padStart(2, '0')}` }
        },
        employment: { department: data.department, designation: data.designation, joiningDate: joiningDate, employmentType: 'full-time', probationPeriod: 6 },
        shiftId: shifts[i % shifts.length]._id,
        status: 'active',
        salary: data.salary,
        overtimeAllowed: i % 3 === 0,
        bankDetails: { accountNumber: `1234567890${i}`, bankName: 'HDFC Bank', ifscCode: 'HDFC0001234', accountHolderName: `${data.firstName} ${data.lastName}` }
      });
      const kpiGroup = getKPIGroupForDepartment(data.department);
      const departmentKPIs = kpis.filter(k => k.group === kpiGroup);
      for (const kpi of departmentKPIs.slice(0, 2)) {
        employee.assignedKPIs.push({ kpiId: kpi._id, targetValue: kpi.targetValue, assignedBy: adminUser._id, assignedDate: joiningDate });
      }
      await employee.save();
      employees.push(employee);
    }
    console.log('✓ Employees:', employees.length);

    // ===== LEAVE TYPES & BALANCES =====
    console.log('\n=== Creating Leave Types & Balances ===\n');
    const leaveTypesData = [
      { name: 'Casual Leave', code: 'CL', annualQuota: 12, color: '#4CAF50', isPaid: true, carryForward: true, maxCarryForward: 6 },
      { name: 'Sick Leave', code: 'SL', annualQuota: 6, color: '#F44336', isPaid: true, carryForward: false, requireDocument: true },
      { name: 'Earned Leave', code: 'EL', annualQuota: 15, color: '#2196F3', isPaid: true, carryForward: true, maxCarryForward: 10 }
    ];
    const leaveTypes = [];
    for (const data of leaveTypesData) {
      const leaveType = new LeaveType({ organizationId: organization._id, ...data, isActive: true, createdBy: adminUser._id });
      await leaveType.save();
      leaveTypes.push(leaveType);
    }
    console.log('✓ Leave Types:', leaveTypes.length);

    let leaveBalances = 0;
    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        const balance = new LeaveBalance({
          organizationId: organization._id, employeeId: employee._id, leaveTypeId: leaveType._id,
          year: new Date().getFullYear(), totalQuota: leaveType.annualQuota, usedDays: Math.floor(Math.random() * (leaveType.annualQuota / 2)),
          carryForward: leaveType.carryForward ? Math.floor(Math.random() * 3) : 0
        });
        balance.remainingDays = balance.totalQuota - balance.usedDays + balance.carryForward;
        await balance.save();
        leaveBalances++;
      }
    }
    console.log('✓ Leave Balances:', leaveBalances);

    // ===== LEAVE REQUESTS =====
    console.log('\n=== Creating Leave Requests ===\n');
    let leaveRequestCount = 0;
    for (let i = 0; i < 10; i++) {
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
      const startDate = getDate(Math.floor(Math.random() * 30) - 10);
      const totalDays = Math.floor(Math.random() * 3) + 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + totalDays - 1);
      const statuses = ['pending', 'approved', 'rejected'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const request = new LeaveRequest({
        organizationId: organization._id, employeeId: employee._id, leaveTypeId: leaveType._id,
        startDate, endDate, totalDays, reason: 'Personal work / Family emergency',
        status, appliedBy: adminUser._id,
        approvedBy: status === 'approved' ? adminUser._id : null,
        approvedAt: status === 'approved' ? new Date() : null,
        rejectedBy: status === 'rejected' ? adminUser._id : null,
        rejectedAt: status === 'rejected' ? new Date() : null,
        rejectionReason: status === 'rejected' ? 'Insufficient leave balance' : null
      });
      await request.save();
      leaveRequestCount++;
    }
    console.log('✓ Leave Requests:', leaveRequestCount);

    // ===== HOLIDAYS =====
    console.log('\n=== Creating Holidays ===\n');
    const holidaysData = [
      { name: 'New Year\'s Day', date: new Date(2026, 0, 1), type: 'national' },
      { name: 'Republic Day', date: new Date(2026, 0, 26), type: 'national' },
      { name: 'Holi', date: new Date(2026, 2, 17), type: 'national' },
      { name: 'Independence Day', date: new Date(2026, 7, 15), type: 'national' },
      { name: 'Gandhi Jayanti', date: new Date(2026, 9, 2), type: 'national' },
      { name: 'Diwali', date: new Date(2026, 10, 1), type: 'national' },
      { name: 'Christmas', date: new Date(2026, 11, 25), type: 'national' }
    ];
    let holidayCount = 0;
    for (const data of holidaysData) {
      const holiday = new Holiday({ organizationId: organization._id, ...data, year: data.date.getFullYear(), createdBy: adminUser._id });
      await holiday.save();
      holidayCount++;
    }
    console.log('✓ Holidays:', holidayCount);

    // ===== EVENTS =====
    console.log('\n=== Creating Events ===\n');
    const eventsData = [
      { title: 'Team Building Activity', type: 'event', startDate: getDate(5), endDate: getDate(5), description: 'Annual team building event' },
      { title: 'Sales Training', type: 'training', startDate: getDate(10), endDate: getDate(12), description: 'Quarterly sales training' },
      { title: 'Quarterly Review', type: 'meeting', startDate: getDate(-5), endDate: getDate(-5), description: 'Q1 review meeting' },
      { title: 'Project Deadline', type: 'deadline', startDate: getDate(25), endDate: getDate(25), description: 'Q2 project deadline' }
    ];
    let eventCount = 0;
    for (const data of eventsData) {
      const event = new Event({
        organizationId: organization._id, ...data, isAllDay: true,
        organizer: employees[0]._id, createdBy: adminUser._id,
        participants: [employees[0]._id, employees[1]._id]
      });
      await event.save();
      eventCount++;
    }
    console.log('✓ Events:', eventCount);

    // ===== TRAININGS =====
    console.log('\n=== Creating Trainings ===\n');
    const trainingsData = [
      { title: 'Sales Excellence Program', description: 'Advanced sales techniques', department: 'Sales', startDate: getDate(5), endDate: getDate(7), status: 'scheduled' },
      { title: 'Design Software Training', description: 'AutoCAD and SketchUp', department: 'Interior Design', startDate: getDate(-15), endDate: getDate(-10), status: 'completed' },
      { title: 'Leadership Development', description: 'Management skills', department: 'All', startDate: getDate(20), endDate: getDate(22), status: 'draft' }
    ];
    let trainingCount = 0;
    for (const data of trainingsData) {
      const training = new Training({
        organizationId: organization._id, ...data, type: 'technical',
        duration: { value: 3, unit: 'days' }, maxParticipants: 20, createdBy: adminUser._id
      });
      await training.save();

      // Enroll employees
      const eligibleEmployees = data.department === 'All' ? employees.slice(0, 3) : employees.filter(e => e.employment.department === data.department);
      for (const employee of eligibleEmployees.slice(0, 2)) {
        const enrollment = new TrainingEnrollment({
          organizationId: organization._id, trainingId: training._id, employeeId: employee._id,
          status: data.status === 'completed' ? 'completed' : 'enrolled', enrolledBy: adminUser._id
        });
        await enrollment.save();
      }
      trainingCount++;
    }
    console.log('✓ Trainings:', trainingCount);

    // ===== COMPLIANCE ITEMS =====
    console.log('\n=== Creating Compliance Items ===\n');
    const complianceData = [
      { title: 'GST Return Filing', category: 'tax', description: 'Monthly GST return', dueDate: getDate(10), frequency: 'monthly', priority: 'high', status: 'pending' },
      { title: 'PF/ESI Payment', category: 'statutory', description: 'Monthly contribution', dueDate: getDate(15), frequency: 'monthly', priority: 'high', status: 'pending' },
      { title: 'Fire Safety Audit', category: 'safety', description: 'Annual compliance', dueDate: getDate(30), frequency: 'yearly', priority: 'medium', status: 'in_progress' }
    ];
    let complianceCount = 0;
    for (const data of complianceData) {
      const item = new ComplianceItem({ organizationId: organization._id, ...data, assignedTo: adminUser._id, createdBy: adminUser._id });
      await item.save();
      complianceCount++;
    }
    console.log('✓ Compliance Items:', complianceCount);

    // ===== PERFORMANCE RECORDS =====
    console.log('\n=== Creating Performance Records ===\n');
    let perfCount = 0;
    for (const employee of employees) {
      const employeeKPIs = employee.assignedKPIs || [];
      if (employeeKPIs.length === 0) continue;
      for (let month = 0; month < 2; month++) {
        const periodStart = new Date();
        periodStart.setMonth(periodStart.getMonth() - month - 1);
        periodStart.setDate(1);
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0);
        const kpiScores = [];
        for (const assignedKPI of employeeKPIs.slice(0, 2)) {
          const kpi = kpis.find(k => k._id.toString() === assignedKPI.kpiId.toString());
          if (kpi) {
            const target = assignedKPI.targetValue || kpi.targetValue || 100;
            const achieved = Math.floor(target * (0.7 + Math.random() * 0.5));
            kpiScores.push({
              kpiId: kpi._id, kpiName: kpi.name, group: kpi.group,
              targetValue: target, achievedValue: achieved, weightage: kpi.weightage || 1
            });
          }
        }
        const record = new PerformanceRecord({
          organizationId: organization._id, employeeId: employee._id,
          month: periodStart.getMonth() + 1, year: periodStart.getFullYear(),
          kpiScores, createdBy: adminUser._id
        });
        await record.save();
        perfCount++;
      }
    }
    console.log('✓ Performance Records:', perfCount);

    // ===== SALARY STRUCTURES =====
    console.log('\n=== Creating Salary Structures ===\n');
    let salaryCount = 0;
    for (const employee of employees) {
      const basic = employee.salary?.basic || 30000;
      const structure = new SalaryStructure({
        organizationId: organization._id, employeeId: employee._id,
        basicSalary: basic,
        hra: Math.round(basic * 0.4),
        conveyance: 3000,
        medicalAllowance: 2500,
        specialAllowance: employee.salary?.allowances || 5000,
        pf: Math.round(basic * 0.12),
        professionalTax: 200,
        effectiveFrom: employee.employment?.joiningDate || new Date(),
        isActive: true,
        createdBy: adminUser._id
      });
      await structure.save();
      salaryCount++;
    }
    console.log('✓ Salary Structures:', salaryCount);

    // ===== PAYROLL =====
    console.log('\n=== Creating Payroll Data ===\n');
    const payrollRun = new PayrollRun({
      organizationId: organization._id,
      name: `Payroll - ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      paymentDate: new Date(),
      status: 'paid',
      createdBy: adminUser._id,
      processedBy: adminUser._id,
      paidBy: adminUser._id,
      paidAt: new Date(),
      workingDays: 22
    });
    await payrollRun.save();
    console.log('✓ Payroll Run created');

    let payslipCount = 0;
    let totalNet = 0;
    for (const employee of employees) {
      const basic = employee.salary?.basic || 30000;
      const allowances = employee.salary?.allowances || 5000;
      const hra = Math.round(basic * 0.4);
      const pf = Math.round(basic * 0.12);
      const pt = 200;
      const gross = basic + hra + allowances + 3000 + 2500;
      const deductions = pf + pt;
      const net = gross - deductions;
      totalNet += net;

      const payslip = new Payslip({
        organizationId: organization._id,
        payrollRunId: payrollRun._id,
        employeeId: employee._id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        earnings: [
          { name: 'Basic Salary', amount: basic },
          { name: 'HRA', amount: hra },
          { name: 'Conveyance', amount: 3000 },
          { name: 'Medical Allowance', amount: 2500 },
          { name: 'Special Allowance', amount: allowances }
        ],
        deductions: [
          { name: 'PF', amount: pf, type: 'statutory' },
          { name: 'Professional Tax', amount: pt, type: 'statutory' }
        ],
        grossEarnings: gross,
        grossDeductions: deductions,
        netSalary: net,
        paymentStatus: 'paid',
        status: 'sent',
        createdBy: adminUser._id,
        sentAt: new Date()
      });
      await payslip.save();
      payslipCount++;
    }
    payrollRun.totalEmployees = employees.length;
    payrollRun.processedEmployees = employees.length;
    payrollRun.totalNet = totalNet;
    await payrollRun.save();
    console.log('✓ Payslips:', payslipCount);

    // ===== ATTENDANCE =====
    console.log('\n=== Creating Attendance Records ===\n');
    let attCount = 0;
    const today = new Date();
    for (let day = 0; day < 30; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      for (const employee of employees) {
        const isPresent = Math.random() > 0.08;
        const isLate = Math.random() > 0.85;
        if (isPresent) {
          const checkIn = new Date(date);
          checkIn.setHours(9, isLate ? Math.floor(Math.random() * 30) + 5 : 0, 0, 0);
          const checkOut = new Date(date);
          checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
          const attendance = new Attendance({
            organizationId: organization._id, employeeId: employee._id, shiftId: employee.shiftId,
            date, checkIn: { time: checkIn }, checkOut: { time: checkOut },
            workingHours: 8 + Math.random() * 0.5,
            status: Math.random() > 0.95 ? 'half_day' : 'present',
            lateMark: { isLate, lateMinutes: isLate ? Math.floor(Math.random() * 30) + 5 : 0 }
          });
          await attendance.save();
        } else {
          const attendance = new Attendance({ organizationId: organization._id, employeeId: employee._id, shiftId: employee.shiftId, date, status: 'absent', workingHours: 0 });
          await attendance.save();
        }
        attCount++;
      }
    }
    console.log('✓ Attendance Records:', attCount);

    // ===== INCENTIVES =====
    console.log('\n=== Creating Incentives ===\n');
    const salesEmployees = employees.filter(e => e.employment.department === 'Sales' || e.employment.department === 'Marketing');
    let incCount = 0;
    const currentMonth = new Date().getMonth(); // March (index 2)
    const currentYear = new Date().getFullYear(); // 2026
    for (const employee of salesEmployees) {
      // Create 3 incentives: one for current month, one for previous month, one pending
      const salesAmounts = [450000, 580000, 320000]; // Different sales amounts
      const statuses = ['paid', 'paid', 'pending'];
      for (let i = 0; i < 3; i++) {
        const salesAmount = salesAmounts[i] + Math.floor(Math.random() * 50000);
        const incentivePercentage = salesAmount < 300000 ? 2 : salesAmount < 600000 ? 2.5 : 3;
        const status = statuses[i];
        const salesMonthOffset = i === 0 ? 0 : i === 1 ? -1 : 0;
        const incentive = new Incentive({
          organizationId: organization._id, employeeId: employee._id,
          salesAmount, incentivePercentage, incentiveAmount: Math.floor((salesAmount * incentivePercentage) / 100),
          reason: 'sales_completion', description: `Monthly incentive - ${i === 0 ? 'Current' : i === 1 ? 'Previous' : 'Pending'} Month`,
          salesDate: new Date(currentYear, currentMonth + salesMonthOffset, 15),
          status,
          paidDate: status === 'paid' ? new Date(currentYear, currentMonth + salesMonthOffset + 1, 10) : undefined,
          paymentReference: status === 'paid' ? `PAY${Date.now()}${i}${employee.employeeId}` : undefined,
          createdBy: adminUser._id
        });
        await incentive.save();
        incCount++;
      }
    }
    console.log('✓ Incentives:', incCount);

    // ===== JOB OPENINGS & CANDIDATES =====
    console.log('\n=== Creating Recruitment Data ===\n');
    const jobData = [
      { title: 'Senior Sales Executive', department: 'Sales', location: 'Mumbai', employmentType: 'full_time', vacancies: 2 },
      { title: 'Interior Designer', department: 'Interior Design', location: 'Mumbai', employmentType: 'full_time', vacancies: 3 },
      { title: 'Marketing Executive', department: 'Marketing', location: 'Mumbai', employmentType: 'full_time', vacancies: 2 }
    ];
    const jobOpenings = [];
    for (const data of jobData) {
      const job = new JobOpening({
        organizationId: organization._id, ...data,
        description: `Looking for ${data.title}`, skills: ['Communication', 'Team Work'],
        experienceRequired: { min: 2, max: 5 }, salaryRange: { min: 25000, max: 50000 },
        status: 'active', postedBy: adminUser._id, applicationDeadline: getDate(30), isActive: true
      });
      await job.save();
      jobOpenings.push(job);
    }
    console.log('✓ Job Openings:', jobOpenings.length);

    const candidateData = [
      { name: 'Aditya Sharma', email: 'aditya.s@email.com', phone: '+91-9988776655', position: 'Senior Sales Executive', department: 'Sales', experience: 4, status: 'applied' },
      { name: 'Bhavna Patel', email: 'bhavna.p@email.com', phone: '+91-9988776656', position: 'Interior Designer', department: 'Interior Design', experience: 3, status: 'shortlisted' },
      { name: 'Esha Gupta', email: 'esha.g@email.com', phone: '+91-9988776659', position: 'Marketing Executive', department: 'Marketing', experience: 2, status: 'interview_scheduled' }
    ];
    for (const data of candidateData) {
      const candidate = new Candidate({
        organizationId: organization._id, jobOpeningId: jobOpenings[Math.floor(Math.random() * jobOpenings.length)]._id,
        ...data, expectedSalary: 40000, source: 'website'
      });
      await candidate.save();
    }
    console.log('✓ Candidates:', candidateData.length);

    // ===== SALES LEADS =====
    console.log('\n=== Creating Sales Leads ===\n');
    const leadsData = [
      { title: 'Modular Kitchen - Mr. Patil', client: 'Mr. Rajesh Patil', company: 'Patil Furniture', value: 250000, stage: 'Quotation', priority: 'High', status: 'active', probability: '70%' },
      { title: 'Office Interior - Sharma Interiors', client: 'Mrs. Sharma', company: 'Sharma Interiors', value: 800000, stage: '3D (Pending Approval)', priority: 'High', status: 'active', probability: '70%' },
      { title: 'Villa Interior - Mr. Joshi', client: 'Mr. Joshi', company: 'Joshi Modular', value: 1500000, stage: 'Visit', priority: 'High', status: 'active', probability: '55%' },
      { title: 'Restaurant Project - Mr. Mehta', client: 'Mr. Mehta', company: 'Mehta Restaurants', value: 1200000, stage: 'Deal Won', priority: 'Medium', status: 'won', probability: '100%' },
      { title: 'Luxury Apartment - Mr. Shah', client: 'Mr. Shah', company: 'Shah Residency', value: 1800000, stage: 'Deal Won', priority: 'High', status: 'won', probability: '100%' }
    ];
    for (const data of leadsData) {
      const lead = new SalesLead({
        organizationId: organization._id, ...data,
        contact: { name: data.client, email: `${data.client.split(' ')[1]?.toLowerCase() || 'client'}@email.com`, phone: '+91-9988770000' },
        source: 'Website', leadType: 'new',
        expectedCloseDate: getDate(15), createdAt: getDate(-10), createdBy: adminUser._id
      });
      await lead.save();
    }
    console.log('✓ Sales Leads:', leadsData.length);

    // ===== MARKETING =====
    console.log('\n=== Creating Marketing Data ===\n');
    const campaignsData = [
      { name: 'Instagram Summer Sale', type: 'online', channel: 'Instagram', status: 'active', budget: 80000, spent: 62000, leads: { total: 200, qualified: 150, converted: 40 } },
      { name: 'Google Ads - Product Launch', type: 'online', channel: 'Search Ads', status: 'active', budget: 100000, spent: 78000, leads: { total: 300, qualified: 250, converted: 80 } },
      { name: 'Home Expo Stall', type: 'offline', channel: 'Event Marketing', status: 'completed', budget: 80000, spent: 75000, leads: { total: 150, qualified: 120, converted: 35 } }
    ];
    const campaigns = [];
    for (const data of campaignsData) {
      const campaign = new Campaign({
        organizationId: organization._id, ...data,
        startDate: getDate(-30), endDate: getDate(30), createdBy: adminUser._id
      });
      await campaign.save();
      campaigns.push(campaign);
    }
    console.log('✓ Campaigns:', campaigns.length);

    for (let i = 0; i < 30; i++) {
      const status = ['new', 'contacted', 'qualified', 'converted'][Math.floor(Math.random() * 4)];
      const lead = new MarketingLead({
        organizationId: organization._id, campaignId: campaigns[Math.floor(Math.random() * campaigns.length)]._id,
        source: ['online', 'referral', 'social'][Math.floor(Math.random() * 3)],
        name: { first: ['Rahul', 'Priya', 'Amit', 'Neha'][i % 4], last: ['Sharma', 'Patel', 'Singh'][i % 3] },
        email: `lead${i}@email.com`, phone: `+91-9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
        status, isConverted: status === 'converted', createdBy: adminUser._id
      });
      await lead.save();
    }
    console.log('✓ Marketing Leads: 30');

    // ===== DESIGN PROJECTS =====
    console.log('\n=== Creating Design Projects ===\n');
    const designerEmployee = employees.find(e => e.employment.department === 'Interior Design');
    const projectsData = [
      { title: 'Modern Kitchen - Sharma Residence', clientName: 'Mr. Rahul Sharma', projectType: 'Kitchen', projectValue: 350000, stage: 'New Request', priority: 'High', status: 'active' },
      { title: 'Full Home Interior - Joshi Family', clientName: 'Mr. Amit Joshi', projectType: 'Full Home', projectValue: 1200000, stage: 'Design In Progress', priority: 'High', status: 'active' },
      { title: 'Office Interior - TechStart', clientName: 'Mr. Vikram Desai', projectType: 'Office', projectValue: 450000, stage: 'Pending Review', priority: 'Medium', status: 'active', hasDesignPdf: true },
      { title: 'Modern Kitchen - Bajaj Family', clientName: 'Mr. Rakesh Bajaj', projectType: 'Kitchen', projectValue: 380000, stage: 'Client Review', priority: 'High', status: 'active', clientApprovalStatus: 'pending', hasDesignPdf: true },
      { title: 'Wardrobe Design - Mehta Residence', clientName: 'Mrs. Sunita Mehta', projectType: 'Wardrobe', projectValue: 150000, stage: 'Approved', priority: 'Medium', status: 'active', clientApprovalStatus: 'approved', hasDesignPdf: true, hasFinalPdf: true },
      { title: 'Commercial Cafe Setup', clientName: 'Mr. Kiran Patel', projectType: 'Commercial', projectValue: 550000, stage: 'Completed', priority: 'High', status: 'completed', clientApprovalStatus: 'approved', hasDesignPdf: true, hasFinalPdf: true }
    ];
    for (const data of projectsData) {
      const projectData = {
        organizationId: organization._id,
        title: data.title,
        clientName: data.clientName,
        projectType: data.projectType,
        projectValue: data.projectValue,
        stage: data.stage,
        priority: data.priority,
        status: data.status,
        clientPhone: '+91 98765 00000',
        clientEmail: `${data.clientName.split(' ')[1]?.toLowerCase() || 'client'}@gmail.com`,
        clientAddress: 'Mumbai, India',
        description: `${data.projectType} project`,
        designDetails: { style: 'Modern', roomType: data.projectType, requirements: 'Full design and implementation' },
        expectedCompletionDate: getDate(30),
        createdAt: getDate(-10),
        createdBy: adminUser._id
      };

      // Add assigned designer for projects in progress or beyond
      if (['Design In Progress', 'Pending Review', 'Client Review', 'Approved', 'Completed'].includes(data.stage) && designerEmployee) {
        projectData.assignedTo = designerEmployee._id;
        projectData.assignedToName = `${designerEmployee.personalInfo.firstName} ${designerEmployee.personalInfo.lastName}`;
        projectData.assignedAt = getDate(-15);
      }

      // Add design PDF for projects with hasDesignPdf
      if (data.hasDesignPdf) {
        projectData.designPdf = {
          name: 'design.pdf',
          url: 'https://example.com/designs/modern-kitchen-design.pdf',
          uploadedAt: getDate(-5),
          uploadedBy: designerEmployee?._id || adminUser._id
        };
      }

      // Add final PDF for projects with hasFinalPdf
      if (data.hasFinalPdf) {
        projectData.finalPdf = {
          name: 'final-design.pdf',
          url: 'https://example.com/designs/final-modern-kitchen.pdf',
          uploadedAt: getDate(-2),
          uploadedBy: designerEmployee?._id || adminUser._id
        };
      }

      // Add client approval status
      if (data.clientApprovalStatus) {
        projectData.clientApprovalStatus = data.clientApprovalStatus;
        if (data.clientApprovalStatus === 'approved') {
          projectData.clientApprovedAt = getDate(-3);
          projectData.clientApprovedBy = adminUser._id;
        }
      }

      const project = new DesignProject(projectData);
      await project.save();
    }
    console.log('✓ Design Projects:', projectsData.length);

    // ===== QUOTATIONS =====
    console.log('\n=== Creating Quotations ===\n');
    const salesEmps = employees.filter(e => e.employment.department === 'Sales');
    const quotationsData = [
      { clientName: 'Mr. Patil', clientEmail: 'patil@gmail.com', projectType: 'Modular Kitchen', totalAmount: 250000 },
      { clientName: 'Mrs. Sharma', clientEmail: 'sharma@gmail.com', projectType: 'Office Interior', totalAmount: 800000 }
    ];
    for (const data of quotationsData) {
      const quotation = new Quotation({
        organizationId: organization._id,
        clientName: data.clientName, clientEmail: data.clientEmail,
        clientPhone: '+91 98765 00000', projectType: data.projectType,
        products: [
          { name: 'Design & Consultation', quantity: 1, pricePerUnit: Math.round(data.totalAmount * 0.1) },
          { name: 'Materials', quantity: 1, pricePerUnit: Math.round(data.totalAmount * 0.5) },
          { name: 'Installation', quantity: 1, pricePerUnit: Math.round(data.totalAmount * 0.3) }
        ],
        taxPercent: 18,
        status: 'Sent',
        validUntilDays: 30,
        createdBy: adminUser._id
      });
      await quotation.save();
    }
    console.log('✓ Quotations:', quotationsData.length);

    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPREHENSIVE SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nLogin Credentials (BestKitchen):');
    console.log('-------------------');
    console.log('Admin: admin@bestkitchen.com / admin123');
    console.log('HR 1: sneha.hr@bestkitchen.com / hr123456');
    console.log('HR 2: rahul.hr@bestkitchen.com / hr123456');
    console.log('\nDemo Credentials (BestKitchenette):');
    console.log('-------------------');
    console.log('Admin: admin@bestkitchenette.com / admin123');
    console.log('Employee: rajesh.k@bestkitchenette.com / employee123');
    console.log('\n' + '='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

runComprehensiveSeed();