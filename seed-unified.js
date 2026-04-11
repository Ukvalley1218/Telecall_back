/**
 * Unified Database Seeder
 * Consolidates all seed data into one interconnected system
 *
 * Demo Credentials:
 * Admin: admin@bestkitchenette.com / admin123
 * Employee: rajesh.k@bestkitchenette.com / employee123
 */

import 'dotenv/config';
import mongoose from 'mongoose';

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
import DailyWorkReport from './src/models/DailyWorkReport.js';
import PayrollRun from './src/models/PayrollRun.js';
import Payslip from './src/models/Payslip.js';
import Permission from './src/models/Permission.js';
import Campaign from './src/models/Campaign.js';
import MarketingLead from './src/models/MarketingLead.js';
import SalesLead from './src/models/SalesLead.js';
import ClientMilestone from './src/models/ClientMilestone.js';
import DesignProject from './src/models/DesignProject.js';
import Order from './src/models/Order.js';
import ProductionWorkOrder from './src/models/ProductionWorkOrder.js';
import ProductionBatchOrder from './src/models/ProductionBatchOrder.js';
import ProductionArtisan from './src/models/ProductionArtisan.js';
import ProductionMaterial from './src/models/ProductionMaterial.js';
import ProductionQualityCheck from './src/models/ProductionQualityCheck.js';
import ProductionLine from './src/models/ProductionLine.js';
import ProductionMachine from './src/models/ProductionMachine.js';
import ProductionInventory from './src/models/ProductionInventory.js';

// Helper functions
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

const clearAllData = async () => {
  console.log('Clearing all existing data...');

  const models = [
    Organization, User, Employee, Shift, KPI, JobOpening, Candidate,
    Attendance, Incentive, LeaveType, LeaveBalance, LeaveRequest,
    DailyWorkReport, PayrollRun, Payslip, Permission,
    Campaign, MarketingLead, SalesLead, ClientMilestone, DesignProject,
    Order, ProductionWorkOrder, ProductionBatchOrder, ProductionArtisan,
    ProductionMaterial, ProductionQualityCheck, ProductionLine,
    ProductionMachine, ProductionInventory
  ];

  for (const model of models) {
    await model.deleteMany({});
  }

  console.log('All data cleared');
};

// ============================================
// MAIN SEED FUNCTION
// ============================================
const seedAllData = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('UNIFIED DATABASE SEEDING');
  console.log('='.repeat(70) + '\n');

  // ==========================================
  // 1. ORGANIZATION
  // ==========================================
  console.log('📊 Creating organization...');
  const organization = new Organization({
    name: 'BestKitchenette',
    domain: 'bestkitchenette',
    subscriptionPlan: 'premium',
    maxEmployees: 100,
    contactDetails: {
      email: 'info@bestkitchenette.com',
      phone: '+91-9876543210',
      address: {
        street: '123 Furniture Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400001'
      }
    },
    settings: {
      lateMarkBuffer: 10,
      sandwichLeaveEnabled: true,
      incentivePayoutDays: 45,
      workingDaysPerWeek: 5,
      overtimeMultiplier: 1.5
    }
  });
  await organization.save();
  console.log('✓ Organization created:', organization.name);

  // ==========================================
  // 2. USERS - Admin & Employee with specified credentials
  // ==========================================
  console.log('\n👥 Creating users...');

  // Admin User
  const adminUser = new User({
    organizationId: organization._id,
    email: 'admin@bestkitchenette.com',
    password: 'admin123',
    role: 'admin',
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      phone: '+91-9876543210'
    },
    isActive: true
  });
  await adminUser.save();
  console.log('✓ Admin created:', adminUser.email);

  // Employee User (Rajesh Kumar - Sales)
  const employeeUser = new User({
    organizationId: organization._id,
    email: 'rajesh.k@bestkitchenette.com',
    password: 'employee123',
    role: 'employee',
    profile: {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91-9876540001'
    },
    isActive: true
  });
  await employeeUser.save();
  console.log('✓ Employee created:', employeeUser.email);

  // HR Users
  const hrUsers = [];
  const hrData = [
    { firstName: 'Sneha', lastName: 'Gupta', email: 'sneha.hr@bestkitchenette.com', phone: '+91-9876543211' },
    { firstName: 'Rahul', lastName: 'Sharma', email: 'rahul.hr@bestkitchenette.com', phone: '+91-9876543212' }
  ];
  for (const data of hrData) {
    const hrUser = new User({
      organizationId: organization._id,
      email: data.email,
      password: 'hr123456',
      role: 'hr',
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      },
      isActive: true
    });
    await hrUser.save();
    hrUsers.push(hrUser);
  }
  console.log('✓ HR users created:', hrUsers.length);

  // ==========================================
  // 3. SHIFTS
  // ==========================================
  console.log('\n⏰ Creating shifts...');
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
      timings: [{
        days: data.days,
        startTime: data.startTime,
        endTime: data.endTime
      }],
      gracePeriodMinutes: 10,
      halfDayHours: 4,
      fullDayHours: 8,
      isActive: true,
      createdBy: adminUser._id
    });
    await shift.save();
    shifts.push(shift);
  }
  console.log('✓ Shifts created:', shifts.length);

  // ==========================================
  // 4. LEAVE TYPES
  // ==========================================
  console.log('\n📅 Creating leave types...');
  const leaveTypes = [];
  const leaveTypeData = [
    { name: 'Casual Leave', code: 'CL', annualQuota: 12, isPaid: true, color: '#3B82F6', carryForward: true, maxCarryForward: 3 },
    { name: 'Sick Leave', code: 'SL', annualQuota: 6, isPaid: true, color: '#EF4444', carryForward: false },
    { name: 'Earned Leave', code: 'EL', annualQuota: 15, isPaid: true, color: '#10B981', carryForward: true, maxCarryForward: 5 },
    { name: 'Privilege Leave', code: 'PL', annualQuota: 5, isPaid: true, color: '#8B5CF6', carryForward: false }
  ];

  for (const data of leaveTypeData) {
    const leaveType = new LeaveType({
      organizationId: organization._id,
      ...data,
      isActive: true,
      createdBy: adminUser._id
    });
    await leaveType.save();
    leaveTypes.push(leaveType);
  }
  console.log('✓ Leave types created:', leaveTypes.length);

  // ==========================================
  // 5. KPIs
  // ==========================================
  console.log('\n📈 Creating KPIs...');
  const kpis = [];

  const kpiGroups = [
    {
      group: 'Sales',
      kpis: [
        { name: 'Revenue Generated', unit: 'Rs', targetValue: 500000, maxValue: 1000000, description: 'Total revenue generated from sales', weightage: 5 },
        { name: 'Calls Made', unit: 'Count', targetValue: 100, maxValue: 200, description: 'Number of calls made to prospects', weightage: 2 },
        { name: 'Leads Generated', unit: 'Count', targetValue: 30, maxValue: 60, description: 'Number of qualified leads generated', weightage: 3 },
        { name: 'Deals Closed', unit: 'Count', targetValue: 5, maxValue: 15, description: 'Number of deals successfully closed', weightage: 4 },
        { name: 'Client Meetings', unit: 'Count', targetValue: 20, maxValue: 40, description: 'Number of client meetings conducted', weightage: 2 }
      ]
    },
    {
      group: 'Design',
      kpis: [
        { name: 'Unique Designs Created', unit: 'Count', targetValue: 15, maxValue: 30, description: 'Number of unique designs created', weightage: 4 },
        { name: 'Kitchen Designs', unit: 'Count', targetValue: 5, maxValue: 12, description: 'Number of kitchen designs completed', weightage: 3 },
        { name: 'Bedroom Designs', unit: 'Count', targetValue: 4, maxValue: 10, description: 'Number of bedroom designs completed', weightage: 3 },
        { name: 'PDF Proposals Generated', unit: 'Count', targetValue: 10, maxValue: 25, description: 'Number of PDF proposals created', weightage: 2 },
        { name: 'Client Approvals', unit: 'Count', targetValue: 8, maxValue: 20, description: 'Number of designs approved by clients', weightage: 4 }
      ]
    },
    {
      group: 'Production',
      kpis: [
        { name: 'Units Produced', unit: 'Count', targetValue: 500, maxValue: 1000, description: 'Number of units produced', weightage: 4 },
        { name: 'Quality Score', unit: 'Percentage', targetValue: 95, maxValue: 100, description: 'Quality percentage of produced items', weightage: 5 },
        { name: 'Efficiency Rate', unit: 'Percentage', targetValue: 90, maxValue: 100, description: 'Production efficiency percentage', weightage: 4 }
      ]
    },
    {
      group: 'Marketing',
      kpis: [
        { name: 'Campaigns Launched', unit: 'Count', targetValue: 5, maxValue: 15, description: 'Number of campaigns launched', weightage: 4 },
        { name: 'Lead Conversion', unit: 'Percentage', targetValue: 15, maxValue: 40, description: 'Lead conversion rate', weightage: 5 },
        { name: 'Website Traffic', unit: 'Count', targetValue: 10000, maxValue: 50000, description: 'Monthly website visitors', weightage: 4 }
      ]
    }
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
        description: kpiData.description,
        weightage: kpiData.weightage,
        frequency: 'monthly',
        isActive: true,
        createdBy: adminUser._id
      });
      await kpi.save();
      kpis.push(kpi);
    }
  }
  console.log('✓ KPIs created:', kpis.length);

  // ==========================================
  // 6. EMPLOYEES
  // ==========================================
  console.log('\n👔 Creating employees...');
  const employees = [];

  // First employee is Rajesh Kumar (linked to the employee user)
  const employeeData = [
    // Sales Team - Rajesh is the main demo employee
    { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.k@bestkitchenette.com', phone: '+91-9876540001', department: 'Sales', designation: 'Senior Sales Executive', salary: { basic: 35000, allowances: 5000 }, userId: employeeUser._id },
    { firstName: 'Vikram', lastName: 'Singh', email: 'vikram.s@bestkitchenette.com', phone: '+91-9876540002', department: 'Sales', designation: 'Sales Manager', salary: { basic: 55000, allowances: 8000 } },
    { firstName: 'Anita', lastName: 'Patel', email: 'anita.p@bestkitchenette.com', phone: '+91-9876540003', department: 'Sales', designation: 'Sales Executive', salary: { basic: 28000, allowances: 4000 } },
    { firstName: 'Deepak', lastName: 'Verma', email: 'deepak.v@bestkitchenette.com', phone: '+91-9876540004', department: 'Sales', designation: 'Senior Sales Executive', salary: { basic: 38000, allowances: 5500 } },

    // Design Team (Interior Designers)
    { firstName: 'Priya', lastName: 'Sharma', email: 'priya.s@bestkitchenette.com', phone: '+91-9876540005', department: 'Interior Design', designation: 'Lead Designer', salary: { basic: 45000, allowances: 7000 } },
    { firstName: 'Neha', lastName: 'Reddy', email: 'neha.r@bestkitchenette.com', phone: '+91-9876540006', department: 'Interior Design', designation: 'Junior Designer', salary: { basic: 25000, allowances: 3500 } },
    { firstName: 'Arjun', lastName: 'Nair', email: 'arjun.n@bestkitchenette.com', phone: '+91-9876540007', department: 'Interior Design', designation: 'Senior Designer', salary: { basic: 42000, allowances: 6000 } },
    { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@bestkitchenette.com', phone: '+91-9876540021', department: 'Interior Design', designation: 'Senior Designer', salary: { basic: 40000, allowances: 6000 } },
    { firstName: 'Michael', lastName: 'Chen', email: 'michael.c@bestkitchenette.com', phone: '+91-9876540022', department: 'Interior Design', designation: 'Designer', salary: { basic: 35000, allowances: 5000 } },
    { firstName: 'Emily', lastName: 'Davis', email: 'emily.d@bestkitchenette.com', phone: '+91-9876540023', department: 'Interior Design', designation: 'Lead Designer', salary: { basic: 48000, allowances: 7000 } },
    { firstName: 'James', lastName: 'Wilson', email: 'james.w@bestkitchenette.com', phone: '+91-9876540024', department: 'Interior Design', designation: 'Designer', salary: { basic: 32000, allowances: 4500 } },
    { firstName: 'Lisa', lastName: 'Anderson', email: 'lisa.a@bestkitchenette.com', phone: '+91-9876540025', department: 'Interior Design', designation: 'Senior Designer', salary: { basic: 38000, allowances: 5500 } },

    // Production Team
    { firstName: 'Amit', lastName: 'Patel', email: 'amit.p@bestkitchenette.com', phone: '+91-9876540008', department: 'Production', designation: 'Production Manager', salary: { basic: 50000, allowances: 7500 } },
    { firstName: 'Suresh', lastName: 'Kumar', email: 'suresh.k@bestkitchenette.com', phone: '+91-9876540009', department: 'Production', designation: 'Production Supervisor', salary: { basic: 32000, allowances: 4800 } },
    { firstName: 'Ramesh', lastName: 'Yadav', email: 'ramesh.y@bestkitchenette.com', phone: '+91-9876540010', department: 'Production', designation: 'Quality Inspector', salary: { basic: 30000, allowances: 4500 } },

    // Marketing Team
    { firstName: 'Meera', lastName: 'Iyer', email: 'meera.i@bestkitchenette.com', phone: '+91-9876540015', department: 'Marketing', designation: 'Marketing Manager', salary: { basic: 52000, allowances: 8000 } },
    { firstName: 'Kavita', lastName: 'Rao', email: 'kavita.r@bestkitchenette.com', phone: '+91-9876540016', department: 'Marketing', designation: 'Content Writer', salary: { basic: 30000, allowances: 4500 } },

    // Finance
    { firstName: 'Arun', lastName: 'Menon', email: 'arun.m@bestkitchenette.com', phone: '+91-9876540017', department: 'Finance', designation: 'Accountant', salary: { basic: 38000, allowances: 5500 } },
    { firstName: 'Lakshmi', lastName: 'Krishnan', email: 'lakshmi.k@bestkitchenette.com', phone: '+91-9876540018', department: 'Finance', designation: 'Senior Accountant', salary: { basic: 45000, allowances: 6500 } },

    // HR Team
    { firstName: 'Pooja', lastName: 'Mehta', email: 'pooja.m@bestkitchenette.com', phone: '+91-9876540011', department: 'HR', designation: 'HR Executive', salary: { basic: 28000, allowances: 4000 } },
    { firstName: 'Kiran', lastName: 'Desai', email: 'kiran.d@bestkitchenette.com', phone: '+91-9876540012', department: 'HR', designation: 'Senior HR Executive', salary: { basic: 35000, allowances: 5000 } }
  ];

  const getKPIGroupForDepartment = (department) => {
    const mapping = {
      'Sales': 'Sales',
      'Interior Design': 'Design',
      'Production': 'Production',
      'Marketing': 'Marketing',
      'HR': 'Sales',
      'Finance': 'Sales'
    };
    return mapping[department] || 'Sales';
  };

  for (let i = 0; i < employeeData.length; i++) {
    const data = employeeData[i];
    const joiningDate = new Date(2022, i % 12, (i % 28) + 1);

    const employee = new Employee({
      organizationId: organization._id,
      userId: data.userId || null,
      employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
      personalInfo: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: new Date(1990 + (i % 15), i % 12, (i * 3) % 28 + 1),
        gender: i % 2 === 0 ? 'male' : 'female',
        address: {
          street: `${i + 1}00 Main Street`,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          zipCode: '400001'
        },
        emergencyContact: {
          name: `Emergency Contact ${i + 1}`,
          relationship: 'Spouse',
          phone: `+91-98765410${String(i).padStart(2, '0')}`
        }
      },
      employment: {
        department: data.department,
        designation: data.designation,
        joiningDate: joiningDate,
        employmentType: 'full-time',
        probationPeriod: 6
      },
      shiftId: shifts[i % shifts.length]._id,
      status: 'active',
      overtimeAllowed: i % 3 === 0,
      salary: data.salary,
      bankDetails: {
        accountNumber: `1234567890${i}`,
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001234',
        accountHolderName: `${data.firstName} ${data.lastName}`
      }
    });

    // Assign KPIs based on department
    const kpiGroup = getKPIGroupForDepartment(data.department);
    const departmentKPIs = kpis.filter(k => k.group === kpiGroup);
    for (const kpi of departmentKPIs.slice(0, 3)) {
      employee.assignedKPIs.push({
        kpiId: kpi._id,
        targetValue: kpi.targetValue,
        assignedBy: adminUser._id,
        assignedDate: joiningDate
      });
    }

    await employee.save();
    employees.push(employee);
  }
  console.log('✓ Employees created:', employees.length);

  // ==========================================
  // 7. PERMISSIONS
  // ==========================================
  console.log('\n🔐 Creating permissions...');

  // Admin permissions (full access)
  const adminPermissions = new Permission({
    organizationId: organization._id,
    userId: adminUser._id,
    employeeId: null,
    modules: {
      hrms: { canView: true, canEdit: true, canCreate: true, canDelete: true },
      fm: { canView: true, canEdit: true, canCreate: true, canDelete: true, stages: ['all'] },
      hm: { canView: true, canEdit: true, canCreate: true, canDelete: true, stages: ['all'] },
      marketing: { canView: true, canEdit: true },
      sales: { canView: true, canEdit: true },
      interiorDesigner: { canView: true, canEdit: true }
    },
    features: {
      viewOwnProfile: true,
      editOwnProfile: true,
      viewAllEmployees: true,
      managePayroll: true,
      approveLeaves: true,
      viewReports: true,
      manageSettings: true
    },
    assignedBy: adminUser._id
  });
  await adminPermissions.save();

  // Employee permissions for Rajesh
  const rajeshEmployee = employees.find(e => e.personalInfo.email === 'rajesh.k@bestkitchenette.com');
  const employeePermissions = new Permission({
    organizationId: organization._id,
    userId: employeeUser._id,
    employeeId: rajeshEmployee._id,
    modules: {
      hrms: { canView: true, canEdit: false },
      fm: { canView: false, canEdit: false, canCreate: false, canDelete: false, stages: [] },
      hm: { canView: false, canEdit: false, canCreate: false, canDelete: false, stages: [] },
      marketing: { canView: false, canEdit: false },
      sales: { canView: true, canEdit: true },
      interiorDesigner: { canView: false, canEdit: false }
    },
    features: {
      viewOwnProfile: true,
      editOwnProfile: true,
      viewOwnAttendance: true,
      viewOwnPayslips: true,
      viewOwnLeaves: true,
      applyLeave: true,
      viewOwnPerformance: true,
      viewOwnIncentives: true,
      submitDWR: true,
      viewCalendar: true,
      viewTraining: true
    },
    assignedBy: adminUser._id
  });
  await employeePermissions.save();
  console.log('✓ Permissions created');

  // ==========================================
  // 8. LEAVE BALANCES
  // ==========================================
  console.log('\n📋 Creating leave balances...');
  const currentYear = new Date().getFullYear();
  let leaveBalancesCount = 0;

  for (const employee of employees) {
    for (const leaveType of leaveTypes) {
      const balance = new LeaveBalance({
        organizationId: organization._id,
        employeeId: employee._id,
        leaveTypeId: leaveType._id,
        year: currentYear,
        allocated: leaveType.annualQuota,
        used: Math.floor(Math.random() * 3),
        pending: Math.random() > 0.5 ? 1 : 0,
        carriedForward: 0
      });
      await balance.save();
      leaveBalancesCount++;
    }
  }
  console.log('✓ Leave balances created:', leaveBalancesCount);

  // ==========================================
  // 9. ATTENDANCE
  // ==========================================
  console.log('\n⏱️ Creating attendance records...');
  const today = new Date();
  let attendanceCount = 0;

  for (let day = 0; day < 30; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const employee of employees) {
      const isPresent = Math.random() > 0.08; // 92% attendance rate
      const isLate = Math.random() > 0.85; // 15% late rate
      const isHalfDay = Math.random() > 0.95; // 5% half day

      if (isPresent) {
        const baseHour = 9;
        const lateMinutes = isLate ? Math.floor(Math.random() * 30) + 5 : 0;
        const checkInTime = new Date(date);
        checkInTime.setHours(baseHour, lateMinutes, 0, 0);

        const workHours = isHalfDay ? 4 : 8 + Math.floor(Math.random() * 2);
        const checkOutTime = new Date(date);
        checkOutTime.setHours(baseHour + workHours, Math.floor(Math.random() * 60), 0, 0);

        const attendance = new Attendance({
          organizationId: organization._id,
          employeeId: employee._id,
          shiftId: employee.shiftId,
          date: date,
          checkIn: {
            time: checkInTime,
            location: { lat: 19.0760 + Math.random() * 0.1, lng: 72.8777 + Math.random() * 0.1 },
            ip: '192.168.1.' + Math.floor(Math.random() * 255)
          },
          checkOut: {
            time: checkOutTime,
            location: { lat: 19.0760 + Math.random() * 0.1, lng: 72.8777 + Math.random() * 0.1 },
            ip: '192.168.1.' + Math.floor(Math.random() * 255)
          },
          workingHours: workHours + (Math.random() * 0.5),
          status: isHalfDay ? 'half_day' : 'present',
          lateMark: {
            isLate: isLate,
            lateMinutes: lateMinutes,
            deductedHours: isLate ? 1 : 0
          }
        });
        await attendance.save();
        attendanceCount++;
      } else {
        const attendance = new Attendance({
          organizationId: organization._id,
          employeeId: employee._id,
          shiftId: employee.shiftId,
          date: date,
          status: 'absent',
          workingHours: 0
        });
        await attendance.save();
        attendanceCount++;
      }
    }
  }
  console.log('✓ Attendance records created:', attendanceCount);

  // ==========================================
  // 10. LEAVE REQUESTS
  // ==========================================
  console.log('\n📝 Creating leave requests...');
  const leaveRequests = [];

  // Create some leave requests for employees
  for (let i = 0; i < 5; i++) {
    const employee = employees[i % employees.length];
    const leaveType = leaveTypes[i % leaveTypes.length];

    const leaveRequest = new LeaveRequest({
      organizationId: organization._id,
      employeeId: employee._id,
      leaveTypeId: leaveType._id,
      startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (i * 2) + 5),
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + (i * 2) + 7),
      totalDays: 3,
      reason: i % 2 === 0 ? 'Personal work' : 'Family function',
      status: i < 3 ? 'approved' : 'pending',
      appliedBy: employee.userId || adminUser._id,
      approvedBy: i < 3 ? adminUser._id : null,
      approvedAt: i < 3 ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2) : null
    });
    await leaveRequest.save();
    leaveRequests.push(leaveRequest);
  }
  console.log('✓ Leave requests created:', leaveRequests.length);

  // ==========================================
  // 11. DAILY WORK REPORTS
  // ==========================================
  console.log('\n📊 Creating daily work reports...');
  let dwrCount = 0;

  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const employee = employees[i % employees.length];

    const tasks = [
      {
        title: 'Client follow-up calls',
        description: 'Made follow-up calls to potential clients',
        status: Math.random() > 0.3 ? 'completed' : 'in_progress',
        priority: 'high',
        estimatedHours: 2,
        actualHours: 2.5,
        completionPercentage: Math.random() > 0.3 ? 100 : 75
      },
      {
        title: 'Sales report preparation',
        description: 'Prepared weekly sales report for team meeting',
        status: 'completed',
        priority: 'medium',
        estimatedHours: 1.5,
        actualHours: 1.5,
        completionPercentage: 100
      }
    ];

    const dwr = new DailyWorkReport({
      organizationId: organization._id,
      employeeId: employee._id,
      date: date,
      tasks: tasks,
      notes: 'Productive day with good client interactions.',
      nextDayPlan: 'Focus on closing pending deals.',
      challenges: 'Some clients requested additional discounts.',
      status: 'submitted',
      reviewStatus: Math.random() > 0.3 ? 'reviewed' : 'pending',
      createdBy: employee.userId || adminUser._id,
      submittedAt: date,
      submittedFrom: 'web'
    });
    await dwr.save();
    dwrCount++;
  }
  console.log('✓ Daily work reports created:', dwrCount);

  // ==========================================
  // 12. INCENTIVES (for Sales & Marketing employees)
  // ==========================================
  console.log('\n💰 Creating incentives...');
  let incentivesCount = 0;
  const salesEmployees = employees.filter(e =>
    e.employment.department === 'Sales' || e.employment.department === 'Marketing'
  );

  const getIncentivePercentage = (amount) => {
    if (amount < 300000) return 2;
    if (amount < 600000) return 2.5;
    if (amount < 900000) return 3;
    if (amount < 1200000) return 3.5;
    if (amount < 1500000) return 4;
    return 5;
  };

  for (const employee of salesEmployees) {
    for (let i = 0; i < 3; i++) {
      const salesAmount = Math.floor(Math.random() * 800000) + 100000;
      const incentivePercentage = getIncentivePercentage(salesAmount);
      const incentiveAmount = Math.floor((salesAmount * incentivePercentage) / 100);

      const incentive = new Incentive({
        organizationId: organization._id,
        employeeId: employee._id,
        salesAmount: salesAmount,
        incentivePercentage: incentivePercentage,
        incentiveAmount: incentiveAmount,
        reason: 'sales_completion',
        description: `Monthly sales incentive for ${['January', 'February', 'March'][i]} ${today.getFullYear()}`,
        salesDate: new Date(today.getFullYear(), i, 15),
        status: i === 2 ? 'pending' : 'paid',
        paymentDate: i < 2 ? new Date(today.getFullYear(), i + 1, 15) : null,
        paymentReference: i < 2 ? `PAY${Date.now()}${i}` : null,
        createdBy: adminUser._id
      });
      await incentive.save();
      incentivesCount++;
    }
  }
  console.log('✓ Incentives created:', incentivesCount);

  // ==========================================
  // 13. JOB OPENINGS
  // ==========================================
  console.log('\n💼 Creating job openings...');
  const jobOpenings = [];
  const jobData = [
    { title: 'Senior Sales Executive', department: 'Sales', location: 'Mumbai, MH', employmentType: 'full_time', experience: { min: 3, max: 7 }, salary: { min: 35000, max: 55000 }, vacancies: 2 },
    { title: 'Interior Designer', department: 'Interior Design', location: 'Mumbai, MH', employmentType: 'full_time', experience: { min: 2, max: 5 }, salary: { min: 30000, max: 45000 }, vacancies: 3 },
    { title: 'Production Supervisor', department: 'Production', location: 'Mumbai, MH', employmentType: 'full_time', experience: { min: 4, max: 8 }, salary: { min: 35000, max: 50000 }, vacancies: 2 },
    { title: 'Marketing Executive', department: 'Marketing', location: 'Mumbai, MH', employmentType: 'full_time', experience: { min: 1, max: 4 }, salary: { min: 25000, max: 40000 }, vacancies: 2 },
    { title: 'HR Executive', department: 'HR', location: 'Mumbai, MH', employmentType: 'full_time', experience: { min: 0, max: 2 }, salary: { min: 20000, max: 30000 }, vacancies: 2 }
  ];

  for (const data of jobData) {
    const job = new JobOpening({
      organizationId: organization._id,
      title: data.title,
      department: data.department,
      location: data.location,
      employmentType: data.employmentType,
      description: `We are looking for an experienced ${data.title} to join our team.`,
      skills: ['Communication', 'Team Work', 'Problem Solving'],
      experienceRequired: data.experience,
      salaryRange: data.salary,
      vacancies: data.vacancies,
      status: 'active',
      postedBy: adminUser._id,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true
    });
    await job.save();
    jobOpenings.push(job);
  }
  console.log('✓ Job openings created:', jobOpenings.length);

  // ==========================================
  // 14. CANDIDATES
  // ==========================================
  console.log('\n👥 Creating candidates...');
  const candidates = [];
  const candidateData = [
    { name: 'Aditya Sharma', email: 'aditya.s@email.com', phone: '+91-9988776655', position: 'Senior Sales Executive', department: 'Sales', experience: 4, expectedSalary: 45000, status: 'applied' },
    { name: 'Bhavna Patel', email: 'bhavna.p@email.com', phone: '+91-9988776656', position: 'Interior Designer', department: 'Interior Design', experience: 3, expectedSalary: 38000, status: 'shortlisted' },
    { name: 'Chirag Mehta', email: 'chirag.m@email.com', phone: '+91-9988776657', position: 'Production Supervisor', department: 'Production', experience: 5, expectedSalary: 42000, status: 'interview_scheduled' },
    { name: 'Divya Nair', email: 'divya.n@email.com', phone: '+91-9988776658', position: 'HR Executive', department: 'HR', experience: 1, expectedSalary: 25000, status: 'selected' },
    { name: 'Esha Gupta', email: 'esha.g@email.com', phone: '+91-9988776659', position: 'Marketing Executive', department: 'Marketing', experience: 2, expectedSalary: 30000, status: 'applied' }
  ];

  for (let i = 0; i < candidateData.length; i++) {
    const data = candidateData[i];
    const candidate = new Candidate({
      organizationId: organization._id,
      jobOpeningId: jobOpenings[i % jobOpenings.length]._id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      experience: data.experience,
      expectedSalary: data.expectedSalary,
      source: 'website',
      status: data.status,
      currentSalary: Math.floor(data.expectedSalary * 0.85),
      notes: data.status === 'shortlisted' ? 'Good communication skills' : null,
      tags: ['potential', 'good-fit']
    });
    await candidate.save();
    candidates.push(candidate);
  }
  console.log('✓ Candidates created:', candidates.length);

  // ==========================================
  // 15. PAYROLL RUN & PAYSLIPS
  // ==========================================
  console.log('\n💵 Creating payroll data...');
  const payrollRun = new PayrollRun({
    organizationId: organization._id,
    name: `Salary - ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`,
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
    paymentDate: new Date(today.getFullYear(), today.getMonth(), 28),
    status: 'paid',
    totalEmployees: employees.length,
    processedEmployees: employees.length,
    totalGross: employees.reduce((sum, e) => sum + (e.salary?.basic || 0) + (e.salary?.allowances || 0), 0),
    totalDeductions: employees.length * 2000,
    totalNet: employees.reduce((sum, e) => sum + (e.salary?.basic || 0) + (e.salary?.allowances || 0), 0) - (employees.length * 2000),
    workingDays: 22,
    createdBy: adminUser._id,
    processedBy: adminUser._id,
    approvedBy: adminUser._id,
    approvedAt: new Date(today.getFullYear(), today.getMonth(), 25),
    paidBy: adminUser._id,
    paidAt: new Date(today.getFullYear(), today.getMonth(), 28)
  });
  await payrollRun.save();

  // Create payslips for each employee
  let payslipsCount = 0;
  for (const employee of employees) {
    const basic = employee.salary?.basic || 30000;
    const allowances = employee.salary?.allowances || 5000;
    const gross = basic + allowances;
    const deductions = 2000;
    const net = gross - deductions;

    const payslip = new Payslip({
      organizationId: organization._id,
      payrollRunId: payrollRun._id,
      employeeId: employee._id,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      employeeDetails: {
        employeeCode: employee.employeeId,
        firstName: employee.personalInfo.firstName,
        lastName: employee.personalInfo.lastName,
        department: employee.employment.department,
        designation: employee.employment.designation,
        bankAccount: employee.bankDetails?.accountNumber || 'N/A',
        bankName: employee.bankDetails?.bankName || 'N/A',
        ifscCode: employee.bankDetails?.ifscCode || 'N/A'
      },
      attendance: {
        workingDays: 22,
        presentDays: 20,
        absentDays: 1,
        paidLeaves: 1,
        unpaidLeaves: 0,
        halfDays: 1,
        lateMarks: 2,
        overtimeHours: 4
      },
      earnings: [
        { name: 'Basic Salary', amount: basic },
        { name: 'House Rent Allowance', amount: Math.floor(allowances * 0.6) },
        { name: 'Conveyance Allowance', amount: Math.floor(allowances * 0.3) },
        { name: 'Medical Allowance', amount: Math.floor(allowances * 0.1) }
      ],
      grossEarnings: gross,
      deductions: [
        { name: 'Provident Fund', amount: Math.floor(basic * 0.05), type: 'statutory' },
        { name: 'Professional Tax', amount: 200, type: 'statutory' }
      ],
      grossDeductions: deductions,
      netSalary: net,
      perDaySalary: Math.floor(gross / 22),
      paymentStatus: 'paid',
      paymentMode: 'bank_transfer',
      paymentDate: new Date(today.getFullYear(), today.getMonth(), 28),
      paymentReference: 'NEFT' + Date.now(),
      status: 'sent',
      sentAt: new Date(today.getFullYear(), today.getMonth(), 28),
      createdBy: adminUser._id
    });
    await payslip.save();
    payslipsCount++;
  }
  console.log('✓ Payroll run created');
  console.log('✓ Payslips created:', payslipsCount);

  // ==========================================
  // 16. MARKETING CAMPAIGNS
  // ==========================================
  console.log('\n📢 Creating marketing campaigns...');
  const campaigns = [];
  const campaignData = [
    { name: 'Instagram Summer Sale', type: 'online', channel: 'Instagram', status: 'active', budget: 80000, spent: 62000 },
    { name: 'Google Ads - Product Launch', type: 'online', channel: 'Search Ads', status: 'active', budget: 100000, spent: 78000 },
    { name: 'Facebook Retargeting Q1', type: 'online', channel: 'Social Media Ads', status: 'active', budget: 45000, spent: 32000 },
    { name: 'Billboard - MG Road', type: 'offline', channel: 'Outdoor Advertising', status: 'active', budget: 50000, spent: 45000 },
    { name: 'Home Expo Stall', type: 'offline', channel: 'Event Marketing', status: 'active', budget: 80000, spent: 65000 }
  ];

  for (const data of campaignData) {
    const campaign = new Campaign({
      organizationId: organization._id,
      ...data,
      description: `${data.name} campaign for brand awareness and lead generation`,
      startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      endDate: new Date(today.getFullYear(), today.getMonth() + 1, 30),
      leads: { total: Math.floor(Math.random() * 200) + 50, qualified: Math.floor(Math.random() * 100) + 30, converted: Math.floor(Math.random() * 50) + 10 },
      createdBy: adminUser._id,
      assignedTo: employees[Math.floor(Math.random() * employees.length)]._id
    });
    await campaign.save();
    campaigns.push(campaign);
  }
  console.log('✓ Marketing campaigns created:', campaigns.length);

  // ==========================================
  // 17. MARKETING LEADS
  // ==========================================
  console.log('\n📈 Creating marketing leads...');
  let marketingLeadsCount = 0;
  const leadSources = ['online', 'offline', 'referral', 'organic', 'paid', 'social', 'email'];
  const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'];
  const priorities = ['low', 'medium', 'high', 'hot'];
  const indianFirstNames = ['Rahul', 'Priya', 'Amit', 'Neha', 'Rajesh', 'Sneha', 'Vikram', 'Anita', 'Suresh', 'Kavita'];
  const indianLastNames = ['Sharma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Verma', 'Joshi', 'Agarwal', 'Mehta', 'Shah'];

  for (let i = 0; i < 50; i++) {
    const source = leadSources[Math.floor(Math.random() * leadSources.length)];
    const status = leadStatuses[Math.floor(Math.random() * leadStatuses.length)];
    const isConverted = status === 'converted';

    const firstName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)];
    const lastName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)];

    const lead = new MarketingLead({
      organizationId: organization._id,
      campaignId: campaigns[Math.floor(Math.random() * campaigns.length)]._id,
      source: source,
      sourceDetail: source === 'online' ? 'Website Form' : source === 'social' ? 'Instagram' : 'N/A',
      name: { first: firstName, last: lastName },
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@gmail.com`,
      phone: `+91-9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
      status: status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      score: Math.floor(Math.random() * 100),
      interest: {
        product: ['Modular Kitchen', 'Wardrobe', 'Living Room', 'Bedroom', 'Office'][Math.floor(Math.random() * 5)],
        budget: ['50K-1L', '1L-3L', '3L-5L', '5L-10L'][Math.floor(Math.random() * 4)],
        timeline: ['Immediate', '1-3 months', '3-6 months'][Math.floor(Math.random() * 3)]
      },
      assignedTo: employees[Math.floor(Math.random() * employees.length)]._id,
      isConverted: isConverted,
      createdBy: adminUser._id
    });
    await lead.save();
    marketingLeadsCount++;
  }
  console.log('✓ Marketing leads created:', marketingLeadsCount);

  // ==========================================
  // 18. SALES LEADS
  // ==========================================
  console.log('\n💼 Creating sales leads...');
  const salesLeads = [];
  const salesLeadData = [
    { title: 'Modular Kitchen - Mr. Patil', client: 'Mr. Rajesh Patil', value: 250000, probability: '85%', stage: 'Quotation', priority: 'High', status: 'active' },
    { title: 'Office Interior - Sharma Interiors', client: 'Mrs. Sharma', value: 800000, probability: '70%', stage: '3D (Pending Approval)', priority: 'High', status: 'active' },
    { title: 'Villa Interior - Mr. Joshi', client: 'Mr. Joshi', value: 1500000, probability: '55%', stage: 'Visit', priority: 'High', status: 'active' },
    { title: 'Home Renovation - Ms. Kulkarni', client: 'Ms. Kulkarni', value: 450000, probability: '40%', stage: 'Appointment', priority: 'Medium', status: 'active' },
    { title: 'Restaurant Project - Mr. Mehta', client: 'Mr. Mehta', value: 1200000, probability: '100%', stage: 'Deal Won', priority: 'Medium', status: 'won' },
    { title: 'Luxury Apartment - Mr. Shah', client: 'Mr. Shah', value: 1800000, probability: '100%', stage: 'Deal Won', priority: 'High', status: 'won' },
    { title: 'Cafe Design - Mr. Brown', client: 'Mr. Brown', value: 900000, probability: '0%', stage: 'Deal Lost', priority: 'Low', status: 'lost' }
  ];

  for (const data of salesLeadData) {
    const lead = new SalesLead({
      organizationId: organization._id,
      ...data,
      contact: {
        name: data.client,
        email: `${data.client.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        phone: `+91-9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`
      },
      source: ['Website', 'Referral', 'Google Ads', 'Instagram'][Math.floor(Math.random() * 4)],
      description: `${data.title} - Interior design project`,
      expectedCloseDate: getDate(Math.floor(Math.random() * 30) + 5),
      createdAt: getDate(-Math.floor(Math.random() * 30)),
      createdBy: adminUser._id,
      assignedToName: employees[Math.floor(Math.random() * employees.length)].personalInfo.firstName
    });
    await lead.save();
    salesLeads.push(lead);
  }
  console.log('✓ Sales leads created:', salesLeads.length);

  // ==========================================
  // 19. CLIENT MILESTONES (for won deals)
  // ==========================================
  console.log('\n🏆 Creating client milestones...');
  const wonDeals = salesLeads.filter(l => l.status === 'won');
  let milestonesCount = 0;

  for (const deal of wonDeals) {
    const milestones = [
      { title: 'Booking Amount', description: 'Initial booking advance', amount: Math.floor(deal.value * 0.2), status: 'completed', paymentStatus: 'paid', milestoneType: 'payment', priority: 'High', dueDate: getDate(-45), completedDate: getDate(-43) },
      { title: 'Design Approval', description: 'Final design approval', amount: Math.floor(deal.value * 0.3), status: 'completed', paymentStatus: 'paid', milestoneType: 'design_approval', priority: 'High', dueDate: getDate(-35), completedDate: getDate(-32) },
      { title: 'Material & Fabrication', description: 'Material procurement', amount: Math.floor(deal.value * 0.3), status: 'completed', paymentStatus: 'paid', milestoneType: 'material_delivery', priority: 'Medium', dueDate: getDate(-20), completedDate: getDate(-18) },
      { title: 'Final Handover', description: 'Project completion', amount: Math.floor(deal.value * 0.2), status: 'completed', paymentStatus: 'paid', milestoneType: 'handover', priority: 'High', dueDate: getDate(-6), completedDate: getDate(-5) }
    ];

    for (const milestoneData of milestones) {
      const milestone = new ClientMilestone({
        organizationId: organization._id,
        salesLeadId: deal._id,
        ...milestoneData,
        createdBy: adminUser._id
      });
      await milestone.save();
      milestonesCount++;
    }
  }
  console.log('✓ Client milestones created:', milestonesCount);

  // ==========================================
  // 20. DESIGN PROJECTS (Interior Designer Module)
  // ==========================================
  console.log('\n🎨 Creating design projects...');
  const designProjects = [];
  const designProjectData = [
    { title: 'Modern Kitchen - Sharma Residence', clientName: 'Mr. Rahul Sharma', projectValue: 350000, stage: 'New Request', status: 'active', priority: 'High', projectType: 'Kitchen' },
    { title: 'Master Wardrobe - Patel Villa', clientName: 'Mrs. Priya Patel', projectValue: 180000, stage: 'Assigned', status: 'active', priority: 'Medium', projectType: 'Wardrobe' },
    { title: 'Full Home Interior - Joshi Family', clientName: 'Mr. Amit Joshi', projectValue: 1200000, stage: 'Design In Progress', status: 'active', priority: 'High', projectType: 'Full Home' },
    { title: 'Office Cabin Interior - TechStart', clientName: 'Mr. Vikram Desai', projectValue: 450000, stage: 'Pending Review', status: 'active', priority: 'Medium', projectType: 'Office' },
    { title: 'Luxury Kitchen - Kapoor Mansion', clientName: 'Mr. Raj Kapoor', projectValue: 580000, stage: 'Client Review', status: 'active', priority: 'High', projectType: 'Kitchen' },
    { title: 'Modern Kitchen - Bajaj Family', clientName: 'Mr. Rakesh Bajaj', projectValue: 380000, stage: 'Completed', status: 'completed', priority: 'High', projectType: 'Kitchen' }
  ];

  const designers = employees.filter(e => e.employment.department === 'Interior Design');

  for (const data of designProjectData) {
    const project = new DesignProject({
      organizationId: organization._id,
      ...data,
      clientPhone: `+91 9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
      clientEmail: `${data.clientName.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
      clientAddress: '123 Main Street, Mumbai',
      description: `${data.title} - Interior design project`,
      designDetails: {
        style: ['Modern', 'Contemporary', 'Traditional'][Math.floor(Math.random() * 3)],
        roomType: data.projectType,
        requirements: 'Complete design with premium finishes'
      },
      expectedCompletionDate: getDate(Math.floor(Math.random() * 30) + 15),
      assignedToName: designers.length > 0 ? designers[Math.floor(Math.random() * designers.length)].personalInfo.firstName : 'Unassigned',
      assignedAt: getDate(-Math.floor(Math.random() * 10)),
      createdAt: getDate(-Math.floor(Math.random() * 30)),
      createdBy: adminUser._id
    });
    await project.save();
    designProjects.push(project);
  }
  console.log('✓ Design projects created:', designProjects.length);

  // ==========================================
  // 21. ORDERS (FM Module)
  // ==========================================
  console.log('\n📦 Creating orders...');
  const orders = [];
  const orderData = [
    { orderId: 'ORD-2026-001', customerName: 'Mr. Rajesh Patil', product: 'L-Shaped Modular Kitchen', amount: 450000, orderType: 'FM', status: 'new', currentStage: 'Material Received', completion: 5, priority: 'high' },
    { orderId: 'ORD-2026-002', customerName: 'Mrs. Sharma', product: 'Custom Wardrobe Set', amount: 180000, orderType: 'HM', status: 'new', currentStage: 'Material Received', completion: 5, priority: 'medium' },
    { orderId: 'ORD-2026-003', customerName: 'Mr. Joshi', product: 'TV Unit with Study Table', amount: 95000, orderType: 'FM', status: 'in_production', currentStage: 'Vendor Purchase', completion: 15, priority: 'low' },
    { orderId: 'ORD-2026-004', customerName: 'Ms. Kulkarni', product: 'Complete Home Interior', amount: 850000, orderType: 'FM', status: 'in_production', currentStage: 'IT Team Planning', completion: 35, priority: 'high' },
    { orderId: 'ORD-2026-005', customerName: 'Mr. Mehta', product: 'Restaurant Interior', amount: 1200000, orderType: 'HM', status: 'completed', currentStage: 'Handover', completion: 100, priority: 'medium' }
  ];

  const PRODUCTION_STAGES = ['Material Received', 'Vendor Purchase', 'Hardware Purchase', 'IT Team Planning', 'Delivery', 'Installation Start', 'Rework', 'Quality Check', 'Final', 'Handover'];

  for (const data of orderData) {
    const order = new Order({
      organizationId: organization._id,
      ...data,
      customer: {
        name: data.customerName,
        email: `${data.customerName.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        phone: `+91 9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
        address: { street: '123 Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }
      },
      product: { name: data.product, description: `${data.product} - Premium quality`, category: data.orderType === 'FM' ? 'Factory Made' : 'Hand Made', type: data.orderType },
      trackingStatus: data.status === 'completed' ? 'completed' : 'on_track',
      source: ['Website', 'Referral', 'Phone'][Math.floor(Math.random() * 3)],
      assignedTeam: 'Team Alpha',
      supervisor: employees[0].personalInfo.firstName,
      orderDate: getDate(-Math.floor(Math.random() * 30)),
      expectedDelivery: getDate(Math.floor(Math.random() * 30) + 10),
      createdBy: adminUser._id
    });
    await order.save();
    orders.push(order);
  }
  console.log('✓ Orders created:', orders.length);

  // ==========================================
  // 22. PRODUCTION DATA (Artisans, Work Orders, etc.)
  // ==========================================
  console.log('\n🏭 Creating production data...');

  // Artisans
  const artisans = [];
  const artisanData = [
    { name: 'Ramesh Patel', skillCategory: 'Carpenter', skills: ['Carpentry', 'Assembly', 'Polishing'], specialization: 'Kitchen & Wardrobe', phone: '+91-9876543210', email: 'ramesh.patel@bestkitchenette.com', status: 'Available', dailyRate: 1500, efficiency: 92, experience: 8, completedJobs: 45, activeWorkload: 72, location: 'Workshop A' },
    { name: 'Suresh Kumar', skillCategory: 'Carpenter', skills: ['Furniture', 'Cutting', 'Assembly'], specialization: 'Bedroom & Living', phone: '+91-9876543211', email: 'suresh.kumar@bestkitchenette.com', status: 'Available', dailyRate: 1400, efficiency: 88, experience: 6, completedJobs: 38, activeWorkload: 65, location: 'Workshop B' },
    { name: 'Mohan Singh', skillCategory: 'Carpenter', skills: ['Carpentry', 'Design', 'Polishing'], specialization: 'Study & Office', phone: '+91-9876543212', email: 'mohan.singh@bestkitchenette.com', status: 'On Project', dailyRate: 1300, efficiency: 85, experience: 4, completedJobs: 22, activeWorkload: 30, location: 'Workshop A' }
  ];

  for (const data of artisanData) {
    const artisan = new ProductionArtisan({
      organizationId: organization._id,
      ...data,
      notes: 'Skilled artisan with good track record',
      createdBy: adminUser._id
    });
    await artisan.save();
    artisans.push(artisan);
  }
  console.log('✓ Artisans created:', artisans.length);

  // Production Lines
  const productionLines = [];
  const productionLineData = [
    { name: 'Assembly Line A', type: 'Assembly', status: 'Running', capacity: 100, output: 85, operator: 'Rajesh Kumar', shift: 'Morning', workers: 8, location: 'Factory Floor A' },
    { name: 'Assembly Line B', type: 'Assembly', status: 'Running', capacity: 100, output: 78, operator: 'Suresh Patel', shift: 'Morning', workers: 6, location: 'Factory Floor A' },
    { name: 'Cutting Line', type: 'Cutting', status: 'Running', capacity: 200, output: 190, operator: 'Mohan Singh', shift: 'Morning', workers: 4, location: 'Factory Floor B' }
  ];

  for (const data of productionLineData) {
    const line = new ProductionLine({
      organizationId: organization._id,
      ...data,
      notes: 'Production line for manufacturing',
      createdBy: adminUser._id
    });
    await line.save();
    productionLines.push(line);
  }
  console.log('✓ Production lines created:', productionLines.length);

  // Production Machines
  const machines = [];
  const machineData = [
    { name: 'CNC Router Machine', type: 'Cutting', status: 'Running', efficiency: 94, temperature: 45, runtime: 720, powerConsumption: 15.5, speed: 100, operator: 'Ramesh Kumar', manufacturer: 'Biesse', model: 'Rover A', serialNumber: 'CNC-001-2023', location: 'Factory Floor A' },
    { name: 'Edge Banding Machine', type: 'Edge Banding', status: 'Running', efficiency: 90, temperature: 38, runtime: 720, powerConsumption: 8.2, speed: 85, operator: 'Suresh Patel', manufacturer: 'Homag', model: 'KFL 515', serialNumber: 'EB-002-2023', location: 'Factory Floor A' },
    { name: 'Panel Saw', type: 'Cutting', status: 'Running', efficiency: 88, temperature: 40, runtime: 680, powerConsumption: 12.0, speed: 92, operator: 'Anil Verma', manufacturer: 'Altendorf', model: 'F45', serialNumber: 'PS-004-2023', location: 'Factory Floor B' }
  ];

  for (let i = 0; i < machineData.length; i++) {
    const m = machineData[i];
    const machine = new ProductionMachine({
      organizationId: organization._id,
      ...m,
      line: productionLines[i % productionLines.length]._id,
      createdBy: adminUser._id
    });
    await machine.save();
    machines.push(machine);
  }
  console.log('✓ Machines created:', machines.length);

  // Production Work Orders
  const workOrders = [];
  const workOrderData = [
    { clientName: 'Rajesh Kumar', projectName: 'Modular Kitchen - L-Shaped', workOrderRef: 'WO-REF-001', orderType: 'HM', productType: 'Kitchen Cabinet Set', dueDate: getDate(5), startDate: getDate(-17), priority: 'High', status: 'Active', currentStage: 'Assembly / Build', completion: 62, estimatedCost: 185000, actualCost: 172000, labourCost: 68000, materialCost: 104000 },
    { clientName: 'Priya Sharma', projectName: 'Bedroom Wardrobe - Sliding Door', workOrderRef: 'WO-REF-002', orderType: 'HM', productType: 'Wardrobe', dueDate: getDate(8), startDate: getDate(-12), priority: 'Medium', status: 'Active', currentStage: 'Cutting / Preparation', completion: 37, estimatedCost: 95000, actualCost: 72000, labourCost: 35000, materialCost: 37000 }
  ];

  for (let i = 0; i < workOrderData.length; i++) {
    const wo = workOrderData[i];
    const workOrder = new ProductionWorkOrder({
      organizationId: organization._id,
      ...wo,
      clientPhone: `+91-9988${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      clientEmail: `client${i}@email.com`,
      clientAddress: `${i + 1}00 Main Street, Mumbai`,
      materialStatus: 'Ready',
      qcStatus: 'Pending',
      remarks: 'Work in progress',
      assignedArtisan: artisans[i % artisans.length]._id,
      createdBy: adminUser._id
    });
    await workOrder.save();
    workOrders.push(workOrder);
  }
  console.log('✓ Work orders created:', workOrders.length);

  // Production Inventory
  const inventory = [];
  const inventoryData = [
    { itemName: 'Plywood 18mm', sku: 'PLY-18MM', category: 'Raw Material', unit: 'sheets', currentStock: 85, minStock: 50, maxStock: 200, reorderLevel: 60, unitCost: 2500, location: 'Warehouse A - Rack 1-5', supplier: 'TimberMart', supplierContact: '+91-9876543220', qualityGrade: 'A' },
    { itemName: 'Hardware Fittings Set', sku: 'HW-SET', category: 'Hardware', unit: 'sets', currentStock: 25, minStock: 20, maxStock: 100, reorderLevel: 25, unitCost: 3500, location: 'Warehouse B - Rack 1', supplier: 'HardwareHub', supplierContact: '+91-9876543221', qualityGrade: 'A' },
    { itemName: 'Laminate Sheets', sku: 'LAM-SHT', category: 'Finish', unit: 'sheets', currentStock: 180, minStock: 50, maxStock: 300, reorderLevel: 75, unitCost: 850, location: 'Warehouse A - Rack 13-15', supplier: 'LaminateWorld', supplierContact: '+91-9876543222', qualityGrade: 'A' }
  ];

  for (const data of inventoryData) {
    const inv = new ProductionInventory({
      organizationId: organization._id,
      ...data,
      createdBy: adminUser._id
    });
    await inv.save();
    inventory.push(inv);
  }
  console.log('✓ Inventory items created:', inventory.length);

  // ==========================================
  // PRINT FINAL SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(70));
  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(70));
  console.log('\n📋 LOGIN CREDENTIALS:');
  console.log('─'.repeat(50));
  console.log('Admin:');
  console.log('  Email:    admin@bestkitchenette.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Employee:');
  console.log('  Email:    rajesh.k@bestkitchenette.com');
  console.log('  Password: employee123');
  console.log('─'.repeat(50));
  console.log('\n📊 DATA SUMMARY:');
  console.log('─'.repeat(50));
  console.log(`✓ Organization:      ${organization.name}`);
  console.log(`✓ Users:            1 Admin + 1 Employee + ${hrUsers.length} HR users`);
  console.log(`✓ Shifts:           ${shifts.length}`);
  console.log(`✓ Leave Types:      ${leaveTypes.length}`);
  console.log(`✓ KPIs:             ${kpis.length}`);
  console.log(`✓ Employees:        ${employees.length}`);
  console.log(`✓ Leave Balances:   ${leaveBalancesCount}`);
  console.log(`✓ Attendance:       ${attendanceCount} records`);
  console.log(`✓ Leave Requests:   ${leaveRequests.length}`);
  console.log(`✓ Daily Reports:    ${dwrCount}`);
  console.log(`✓ Incentives:       ${incentivesCount}`);
  console.log(`✓ Job Openings:    ${jobOpenings.length}`);
  console.log(`✓ Candidates:       ${candidates.length}`);
  console.log(`✓ Payroll:          1 run + ${payslipsCount} payslips`);
  console.log(`✓ Campaigns:        ${campaigns.length}`);
  console.log(`✓ Marketing Leads:  ${marketingLeadsCount}`);
  console.log(`✓ Sales Leads:      ${salesLeads.length}`);
  console.log(`✓ Milestones:       ${milestonesCount}`);
  console.log(`✓ Design Projects:  ${designProjects.length}`);
  console.log(`✓ Orders:           ${orders.length}`);
  console.log(`✓ Artisans:         ${artisans.length}`);
  console.log(`✓ Production Lines: ${productionLines.length}`);
  console.log(`✓ Machines:         ${machines.length}`);
  console.log(`✓ Work Orders:      ${workOrders.length}`);
  console.log(`✓ Inventory:        ${inventory.length}`);
  console.log('='.repeat(70) + '\n');

  return {
    organization,
    adminUser,
    employeeUser,
    employees,
    shifts,
    leaveTypes,
    kpis,
    campaigns,
    salesLeads,
    designProjects,
    orders,
    artisans,
    workOrders
  };
};

// ============================================
// RUN SEED
// ============================================
const runSeed = async () => {
  try {
    await connectDB();
    await clearAllData();
    await seedAllData();
    console.log('✅ All seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

runSeed();