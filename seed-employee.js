import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Organization from './src/models/Organization.js';
import User from './src/models/User.js';
import Employee from './src/models/Employee.js';
import Shift from './src/models/Shift.js';
import Attendance from './src/models/Attendance.js';
import LeaveType from './src/models/LeaveType.js';
import LeaveBalance from './src/models/LeaveBalance.js';
import LeaveRequest from './src/models/LeaveRequest.js';
import DailyWorkReport from './src/models/DailyWorkReport.js';
import PayrollRun from './src/models/PayrollRun.js';
import Payslip from './src/models/Payslip.js';
import Permission from './src/models/Permission.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const clearData = async () => {
  console.log('Clearing existing data...');
  await Organization.deleteMany({});
  await User.deleteMany({});
  await Employee.deleteMany({});
  await Shift.deleteMany({});
  await Attendance.deleteMany({});
  await LeaveType.deleteMany({});
  await LeaveBalance.deleteMany({});
  await LeaveRequest.deleteMany({});
  await DailyWorkReport.deleteMany({});
  await PayrollRun.deleteMany({});
  await Payslip.deleteMany({});
  await Permission.deleteMany({});
  console.log('Data cleared');
};

const seedData = async () => {
  console.log('\n=== Seeding Single Employee Data ===\n');

  // 1. Create Organization
  console.log('Creating organization...');
  const organization = new Organization({
    name: 'Best Kitchennette',
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

  // 2. Create Admin User (for HR operations)
  console.log('\nCreating admin user...');
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
  console.log('✓ Admin created:', adminUser.email, '(password: admin123)');

  // 3. Create Shift
  console.log('\nCreating shift...');
  const shift = new Shift({
    organizationId: organization._id,
    name: 'General Shift',
    code: 'GS001',
    timings: [{
      days: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00'
    }],
    gracePeriodMinutes: 10,
    halfDayHours: 4,
    fullDayHours: 8,
    isActive: true,
    createdBy: adminUser._id
  });
  await shift.save();
  console.log('✓ Shift created:', shift.name, '(09:00 - 18:00)');

  // 4. Create Leave Types
  console.log('\nCreating leave types...');
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

  // 5. Create Sales Employee
  console.log('\nCreating sales employee...');
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
  console.log('✓ Employee user created:', employeeUser.email, '(password: employee123)');

  const employee = new Employee({
    organizationId: organization._id,
    userId: employeeUser._id,
    employeeId: 'EMP001',
    personalInfo: {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      email: 'rajesh.k@bestkitchenette.com',
      phone: '+91-9876540001',
      dateOfBirth: new Date(1992, 5, 15),
      gender: 'male',
      address: {
        street: '456 Sales Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400051'
      },
      emergencyContact: {
        name: 'Priya Kumar',
        relationship: 'Spouse',
        phone: '+91-9876540002'
      }
    },
    employment: {
      department: 'Sales',
      designation: 'Senior Sales Executive',
      joiningDate: new Date(2023, 0, 15),
      employmentType: 'full-time',
      probationPeriod: 6
    },
    shiftId: shift._id,
    status: 'active',
    overtimeAllowed: true,
    salary: {
      basic: 35000,
      allowances: 5000,
      incentives: 0
    },
    bankDetails: {
      accountNumber: '1234567890123',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'Rajesh Kumar'
    }
  });
  await employee.save();
  console.log('✓ Employee created:', employee.personalInfo.firstName, employee.personalInfo.lastName);
  console.log('  - Employee ID:', employee.employeeId);
  console.log('  - Department:', employee.employment.department);
  console.log('  - Designation:', employee.employment.designation);

  // 6. Create Permissions for Employee
  console.log('\nCreating employee permissions...');
  const permissions = new Permission({
    organizationId: organization._id,
    userId: employeeUser._id,
    employeeId: employee._id,
    modules: {
      hrms: { canView: true, canEdit: false },
      fm: { canView: false, canEdit: false, canCreate: false, canDelete: false, stages: [] },
      hm: { canView: false, canEdit: false, canCreate: false, canDelete: false, stages: [] },
      marketing: { canView: false, canEdit: false },
      sales: { canView: false, canEdit: false },
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
  await permissions.save();
  console.log('✓ Employee permissions created');

  // 7. Create Leave Balances
  console.log('\nCreating leave balances...');
  const currentYear = new Date().getFullYear();
  const leaveBalances = [];
  for (const leaveType of leaveTypes) {
    const balance = new LeaveBalance({
      organizationId: organization._id,
      employeeId: employee._id,
      leaveTypeId: leaveType._id,
      year: currentYear,
      allocated: leaveType.annualQuota,
      used: 0,
      pending: 0,
      carriedForward: 0
    });
    await balance.save();
    leaveBalances.push(balance);
  }
  console.log('✓ Leave balances created');

  // 8. Create Attendance Records (Last 30 days)
  console.log('\nCreating attendance records...');
  const today = new Date();
  const attendanceRecords = [];

  for (let day = 0; day < 30; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const isPresent = Math.random() > 0.05; // 95% attendance
    const isLate = isPresent && Math.random() > 0.85; // 15% late rate
    const isHalfDay = isPresent && Math.random() > 0.95; // 5% half day

    if (isPresent) {
      const baseHour = 9;
      const lateMinutes = isLate ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 5);
      const checkInTime = new Date(date);
      checkInTime.setHours(baseHour, lateMinutes, 0, 0);

      const workHours = isHalfDay ? 4 : 8 + Math.floor(Math.random() * 2);
      const checkOutTime = new Date(date);
      checkOutTime.setHours(baseHour + workHours, Math.floor(Math.random() * 60), 0, 0);

      const attendance = new Attendance({
        organizationId: organization._id,
        employeeId: employee._id,
        shiftId: shift._id,
        date: date,
        checkIn: {
          time: checkInTime,
          location: { lat: 19.0760 + Math.random() * 0.01, lng: 72.8777 + Math.random() * 0.01 },
          ip: '192.168.1.100'
        },
        checkOut: {
          time: checkOutTime,
          location: { lat: 19.0760 + Math.random() * 0.01, lng: 72.8777 + Math.random() * 0.01 },
          ip: '192.168.1.100'
        },
        workingHours: workHours + Math.random() * 0.5,
        status: isHalfDay ? 'half_day' : 'present',
        lateMark: {
          isLate: isLate,
          lateMinutes: lateMinutes,
          deductedHours: isLate ? 1 : 0
        }
      });
      await attendance.save();
      attendanceRecords.push(attendance);
    } else {
      const attendance = new Attendance({
        organizationId: organization._id,
        employeeId: employee._id,
        shiftId: shift._id,
        date: date,
        status: 'absent',
        workingHours: 0
      });
      await attendance.save();
      attendanceRecords.push(attendance);
    }
  }
  console.log('✓ Attendance records created:', attendanceRecords.length);

  // 9. Create Daily Work Reports (Last 10 working days)
  console.log('\nCreating daily work reports...');
  const dwrRecords = [];
  let dwrDay = 0;

  for (let i = 0; i < 15 && dwrRecords.length < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

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
      },
      {
        title: 'Product demonstration',
        description: 'Conducted product demo for prospective customer',
        status: Math.random() > 0.5 ? 'completed' : 'in_progress',
        priority: 'high',
        estimatedHours: 3,
        actualHours: Math.random() > 0.5 ? 3 : 2,
        completionPercentage: Math.random() > 0.5 ? 100 : 80
      }
    ];

    const dwr = new DailyWorkReport({
      organizationId: organization._id,
      employeeId: employee._id,
      date: date,
      tasks: tasks,
      notes: 'Productive day with good client interactions.',
      nextDayPlan: 'Focus on closing pending deals and follow up with warm leads.',
      challenges: 'Some clients requested additional discounts.',
      status: 'submitted',
      reviewStatus: Math.random() > 0.3 ? 'reviewed' : 'pending',
      createdBy: employeeUser._id,
      submittedAt: date,
      submittedFrom: 'web'
    });
    await dwr.save();
    dwrRecords.push(dwr);
    dwrDay++;
  }
  console.log('✓ Daily work reports created:', dwrRecords.length);

  // 10. Create Leave Requests
  console.log('\nCreating leave requests...');
  const leaveRequests = [];

  // Pending leave request
  const pendingLeave = new LeaveRequest({
    organizationId: organization._id,
    employeeId: employee._id,
    leaveTypeId: leaveTypes[0]._id, // Casual Leave
    startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10),
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12),
    totalDays: 3,
    reason: 'Family function out of town',
    status: 'pending',
    appliedBy: employeeUser._id
  });
  await pendingLeave.save();
  leaveRequests.push(pendingLeave);

  // Approved leave request (past)
  const approvedLeave = new LeaveRequest({
    organizationId: organization._id,
    employeeId: employee._id,
    leaveTypeId: leaveTypes[1]._id, // Sick Leave
    startDate: new Date(today.getFullYear(), today.getMonth() - 1, 10),
    endDate: new Date(today.getFullYear(), today.getMonth() - 1, 11),
    totalDays: 2,
    reason: 'Not feeling well, took rest at home',
    status: 'approved',
    appliedBy: employeeUser._id,
    approvedBy: employee._id, // Self-approved for demo
    approvedAt: new Date(today.getFullYear(), today.getMonth() - 1, 8),
    approvalNotes: 'Get well soon!'
  });
  await approvedLeave.save();
  leaveRequests.push(approvedLeave);

  // Another approved leave (past)
  const anotherLeave = new LeaveRequest({
    organizationId: organization._id,
    employeeId: employee._id,
    leaveTypeId: leaveTypes[0]._id, // Casual Leave
    startDate: new Date(today.getFullYear(), today.getMonth() - 2, 15),
    endDate: new Date(today.getFullYear(), today.getMonth() - 2, 16),
    totalDays: 2,
    reason: 'Personal work',
    status: 'approved',
    appliedBy: employeeUser._id,
    approvedBy: employee._id,
    approvedAt: new Date(today.getFullYear(), today.getMonth() - 2, 14)
  });
  await anotherLeave.save();
  leaveRequests.push(anotherLeave);

  // Update leave balance
  await LeaveBalance.updateOne(
    { employeeId: employee._id, leaveTypeId: leaveTypes[0]._id },
    { $inc: { used: 5 } } // 3 pending + 2 approved
  );
  await LeaveBalance.updateOne(
    { employeeId: employee._id, leaveTypeId: leaveTypes[1]._id },
    { $inc: { used: 2 } }
  );

  console.log('✓ Leave requests created:', leaveRequests.length);

  // 11. Create Payroll Run
  console.log('\nCreating payroll run...');
  const payrollRun = new PayrollRun({
    organizationId: organization._id,
    name: `Salary - ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`,
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
    paymentDate: new Date(today.getFullYear(), today.getMonth(), 28),
    status: 'paid',
    totalEmployees: 1,
    processedEmployees: 1,
    totalGross: 40000,
    totalDeductions: 4500,
    totalNet: 35500,
    workingDays: 22,
    createdBy: adminUser._id,
    processedBy: adminUser._id,
    approvedBy: adminUser._id,
    approvedAt: new Date(today.getFullYear(), today.getMonth(), 25),
    paidBy: adminUser._id,
    paidAt: new Date(today.getFullYear(), today.getMonth(), 28)
  });
  await payrollRun.save();
  console.log('✓ Payroll run created');

  // 12. Create Payslip
  console.log('\nCreating payslip...');
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
      bankAccount: employee.bankDetails.accountNumber,
      bankName: employee.bankDetails.bankName,
      ifscCode: employee.bankDetails.ifscCode
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
      { name: 'Basic Salary', amount: 35000 },
      { name: 'House Rent Allowance', amount: 3000 },
      { name: 'Conveyance Allowance', amount: 1500 },
      { name: 'Medical Allowance', amount: 500 }
    ],
    grossEarnings: 40000,
    deductions: [
      { name: 'Provident Fund', amount: 1800, type: 'statutory' },
      { name: 'Professional Tax', amount: 200, type: 'statutory' },
      { name: 'Income Tax (TDS)', amount: 2500, type: 'statutory' }
    ],
    grossDeductions: 4500,
    netSalary: 35500,
    perDaySalary: 1818.18,
    paymentStatus: 'paid',
    paymentMode: 'bank_transfer',
    paymentDate: new Date(today.getFullYear(), today.getMonth(), 28),
    paymentReference: 'NEFT' + Date.now(),
    status: 'sent',
    sentAt: new Date(today.getFullYear(), today.getMonth(), 28),
    createdBy: adminUser._id
  });
  await payslip.save();
  console.log('✓ Payslip created');

  // Print Summary
  console.log('\n========================================');
  console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
  console.log('========================================\n');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('------------------------');
  console.log('Admin:');
  console.log('  Email: admin@bestkitchenette.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Employee (Sales):');
  console.log('  Email: rajesh.k@bestkitchenette.com');
  console.log('  Password: employee123');
  console.log('');
  console.log('📊 DATA CREATED:');
  console.log('------------------------');
  console.log('✓ Organization:', organization.name);
  console.log('✓ 1 Admin User');
  console.log('✓ 1 Shift (General 09:00-18:00)');
  console.log('✓ 4 Leave Types (CL, SL, EL, PL)');
  console.log('✓ 1 Employee (Rajesh Kumar - Sales)');
  console.log('✓ Employee Permissions configured');
  console.log('✓ ~22 Attendance records (30 days)');
  console.log('✓ 10 Daily Work Reports with tasks');
  console.log('✓ 3 Leave Requests (1 pending, 2 approved)');
  console.log('✓ 1 Payroll Run');
  console.log('✓ 1 Payslip');
  console.log('');
  console.log('========================================\n');
};

const runSeed = async () => {
  try {
    await connectDB();
    await clearData();
    await seedData();
    console.log('✅ All done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

runSeed();