import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Organization from './src/models/Organization.js';
import User from './src/models/User.js';
import Employee from './src/models/Employee.js';
import Shift from './src/models/Shift.js';
import KPI from './src/models/KPI.js';
import JobOpening from './src/models/JobOpening.js';
import Candidate from './src/models/Candidate.js';
import Attendance from './src/models/Attendance.js';
import Incentive from './src/models/Incentive.js';
import TelecallerCampaign from './src/models/TelecallerCampaign.js';
import TelecallerLead from './src/models/TelecallerLead.js';
import CallLog from './src/models/CallLog.js';
import TelecallerTask from './src/models/TelecallerTask.js';
import FollowUp from './src/models/FollowUp.js';

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
  await KPI.deleteMany({});
  await JobOpening.deleteMany({});
  await Candidate.deleteMany({});
  await Attendance.deleteMany({});
  await Incentive.deleteMany({});
  await TelecallerCampaign.deleteMany({});
  await TelecallerLead.deleteMany({});
  await CallLog.deleteMany({});
  await TelecallerTask.deleteMany({});
  await FollowUp.deleteMany({});
  console.log('Data cleared');
};

const seedData = async () => {
  console.log('\n=== Seeding Database ===\n');

  // 1. Create Organization
  console.log('Creating organization...');
  const organization = new Organization({
    name: 'BestKitchen',
    domain: 'bestkitchenette',
    subscriptionPlan: 'premium',
    maxEmployees: 100,
    contactDetails: {
      email: 'contact@bestkitchenette.com',
      phone: '+91-7038672091',
      address: {
        street: '123 Kitchen Street',
        city: 'Mumbai',
        state: 'MH',
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

  // 2. Create Demo Users (Admin, Employee, Telecallers)
  console.log('\n=== Creating Demo Users ===\n');

  // Admin User
  const adminUser = new User({
    organizationId: organization._id,
    email: 'admin@bestkitchenette.com',
    password: 'admin123',
    role: 'admin',
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      phone: '+91-7038672091'
    },
    isActive: true
  });
  await adminUser.save();
  console.log('✓ Admin created: admin@bestkitchenette.com / admin123');

  // Employee User (for testing employee features)
  const employeeUser = new User({
    organizationId: organization._id,
    email: 'rajesh.k@bestkitchenette.com',
    password: 'employee123',
    role: 'employee',
    profile: {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91-7038672092'
    },
    isActive: true
  });
  await employeeUser.save();
  console.log('✓ Employee created: rajesh.k@bestkitchenette.com / employee123');

  // HR Users
  console.log('\nCreating HR users...');
  const hrUsers = [];
  const hrData = [
    { firstName: 'Sneha', lastName: 'Gupta', email: 'sneha.hr@bestkitchenette.com', phone: '+91-7038672093' },
    { firstName: 'Rahul', lastName: 'Sharma', email: 'rahul.hr@bestkitchenette.com', phone: '+91-7038672094' }
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

  // Telecaller Users
  console.log('\nCreating telecaller users...');
  const telecallerUsers = [];
  const telecallerData = [
    { firstName: 'Suresh', lastName: 'Kumar', email: 'suresh.t@bestkitchenette.com', phone: '+91-7038672095' },
    { firstName: 'Priya', lastName: 'Singh', email: 'priya.t@bestkitchenette.com', phone: '+91-7038672096' },
    { firstName: 'Amit', lastName: 'Verma', email: 'amit.t@bestkitchenette.com', phone: '+91-7038672097' },
    { firstName: 'Neha', lastName: 'Patel', email: 'neha.t@bestkitchenette.com', phone: '+91-7038672098' }
  ];
  for (const data of telecallerData) {
    const telecallerUser = new User({
      organizationId: organization._id,
      email: data.email,
      password: 'telecaller123',
      role: 'telecaller',
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      },
      isActive: true
    });
    await telecallerUser.save();
    telecallerUsers.push(telecallerUser);
  }
  console.log('✓ Telecaller users created:', telecallerUsers.length);

  // 3. Create Shifts
  console.log('\nCreating shifts...');
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
      createdBy: adminUser._id
    });
    await shift.save();
    shifts.push(shift);
  }
  console.log('✓ Shifts created:', shifts.length);

  // 4. Create KPIs
  console.log('\nCreating KPIs...');
  const kpis = [];
  const kpiGroups = [
    {
      group: 'Sales',
      kpis: [
        { name: 'Calls Made', unit: 'Count', targetValue: 100, maxValue: 200, description: 'Number of calls made per day', weightage: 4 },
        { name: 'Leads Converted', unit: 'Count', targetValue: 10, maxValue: 30, description: 'Number of leads converted', weightage: 5 },
        { name: 'Follow-ups Completed', unit: 'Count', targetValue: 50, maxValue: 100, description: 'Number of follow-ups completed', weightage: 3 },
        { name: 'Talk Time', unit: 'Hours', targetValue: 3, maxValue: 6, description: 'Total talk time per day', weightage: 3 },
        { name: 'Cold Leads Generated', unit: 'Count', targetValue: 20, maxValue: 50, description: 'New cold leads from calls', weightage: 2 },
        { name: 'Revenue Generated', unit: 'Rs', targetValue: 500000, maxValue: 1000000, description: 'Total revenue generated from sales', weightage: 5 }
      ]
    },
    {
      group: 'Design',
      kpis: [
        { name: 'Unique Designs Created', unit: 'Count', targetValue: 15, maxValue: 30, description: 'Number of unique designs created', weightage: 4 },
        { name: 'Kitchen Designs', unit: 'Count', targetValue: 5, maxValue: 12, description: 'Number of kitchen designs completed', weightage: 3 },
        { name: 'PDF Proposals Generated', unit: 'Count', targetValue: 10, maxValue: 25, description: 'Number of PDF proposals created', weightage: 2 }
      ]
    },
    {
      group: 'Operations',
      kpis: [
        { name: 'Production Units', unit: 'Count', targetValue: 500, maxValue: 1000, description: 'Number of units produced', weightage: 4 },
        { name: 'Quality Score', unit: 'Percentage', targetValue: 95, maxValue: 100, description: 'Quality percentage', weightage: 5 }
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

  // 5. Create Employees
  console.log('\nCreating employees...');
  const employees = [];
  const employeeData = [
    { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.k@bestkitchenette.com', phone: '+91-7038672092', department: 'Sales', designation: 'Senior Sales Executive', salary: { basic: 35000, allowances: 5000 } },
    { firstName: 'Vikram', lastName: 'Singh', email: 'vikram.s@bestkitchenette.com', phone: '+91-7038672100', department: 'Sales', designation: 'Sales Manager', salary: { basic: 55000, allowances: 8000 } },
    { firstName: 'Anita', lastName: 'Patel', email: 'anita.p@bestkitchenette.com', phone: '+91-7038672101', department: 'Sales', designation: 'Sales Executive', salary: { basic: 28000, allowances: 4000 } },
    { firstName: 'Priya', lastName: 'Sharma', email: 'priya.s@bestkitchenette.com', phone: '+91-7038672102', department: 'Interior Design', designation: 'Lead Designer', salary: { basic: 45000, allowances: 7000 } },
    { firstName: 'Neha', lastName: 'Reddy', email: 'neha.r@bestkitchenette.com', phone: '+91-7038672103', department: 'Interior Design', designation: 'Junior Designer', salary: { basic: 25000, allowances: 3500 } },
    { firstName: 'Amit', lastName: 'Patel', email: 'amit.p@bestkitchenette.com', phone: '+91-7038672104', department: 'Production', designation: 'Production Manager', salary: { basic: 50000, allowances: 7500 } },
    { firstName: 'Suresh', lastName: 'Kumar', email: 'suresh.t@bestkitchenette.com', phone: '+91-7038672095', department: 'Telecalling', designation: 'Telecommunication Executive', salary: { basic: 25000, allowances: 3000 } },
    { firstName: 'Priya', lastName: 'Singh', email: 'priya.t@bestkitchenette.com', phone: '+91-7038672096', department: 'Telecalling', designation: 'Senior Telecaller', salary: { basic: 28000, allowances: 3500 } }
  ];

  for (let i = 0; i < employeeData.length; i++) {
    const data = employeeData[i];
    const joiningDate = new Date(2022, i % 12, (i % 28) + 1);

    const employee = new Employee({
      organizationId: organization._id,
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
          state: 'MH',
          country: 'India',
          zipCode: '400001'
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
      salary: data.salary,
      overtimeAllowed: i % 3 === 0
    });
    await employee.save();
    employees.push(employee);
  }
  console.log('✓ Employees created:', employees.length);

  // 6. Create Telecaller Campaigns
  console.log('\nCreating telecaller campaigns...');
  const campaigns = [];
  const campaignData = [
    { name: 'Kitchen Products Campaign', description: 'Outbound calls for kitchen product sales', type: 'outbound', priority: 'high', assignedTo: [telecallerUsers[0]._id, telecallerUsers[1]._id] },
    { name: 'TV Point Promotion', description: 'Promotional calls for TV point services', type: 'outbound', priority: 'medium', assignedTo: [telecallerUsers[1]._id] },
    { name: 'Follow-up Campaign', description: 'Follow-up with warm leads', type: 'outbound', priority: 'urgent', assignedTo: [telecallerUsers[0]._id, telecallerUsers[2]._id, telecallerUsers[3]._id] },
    { name: 'Customer Feedback', description: 'Inbound customer feedback collection', type: 'inbound', priority: 'low', assignedTo: [telecallerUsers[2]._id] }
  ];

  for (const data of campaignData) {
    const campaign = new TelecallerCampaign({
      organizationId: organization._id,
      name: data.name,
      description: data.description,
      type: data.type,
      status: 'active',
      priority: data.priority,
      assignedTo: data.assignedTo,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: adminUser._id
    });
    await campaign.save();
    campaigns.push(campaign);
  }
  console.log('✓ Campaigns created:', campaigns.length);

  // 7. Create Telecaller Leads (ALL WITH PHONE: 7038672091)
  console.log('\nCreating telecaller leads...');
  const leads = [];
  const leadNames = [
    'Raj Kumar Sharma', 'Sunita Devi', 'Amitabh Mishra', 'Kavita Reddy', 'Vikram Patel',
    'Meera Iyer', 'Suresh Nair', 'Priya Menon', 'Deepak Gupta', 'Anjali Singh',
    'Ramesh Kumar', 'Lakshmi Venkat', 'Harsh Vardhan', 'Pooja Sharma', 'Nitin Joshi',
    'Komal Desai', 'Sanjay Rao', 'Divya Nair', 'Manish Tiwari', 'Sneha Agarwal',
    'Ankur Jain', 'Ritu Saxena', 'Gaurav Malhotra', 'Nisha Bhatia', 'Prakash Singh',
    'Rekha Choudhury', 'Arun Kumar', 'Sheetal Verma', 'Dinesh Yadav', 'Madhuri Kale',
    'Rahul Khanna', 'Jaya Krishnan', 'Bhupendra Singh', 'Kritika Sharma', 'Tarun Mehta',
    'Anita Chauhan', 'Vivek Sharma', 'Neha Kapoor', 'Siddharth Roy', 'Pallavi Rao'
  ];

  const leadStatuses = ['new', 'open', 'in_progress', 'follow_up', 'cold', 'warm', 'hot', 'converted', 'closed', 'not_connected'];
  const leadStages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'];
  const leadSources = ['website', 'referral', 'campaign', 'social_media', 'cold_call', 'event', 'other'];

  for (let i = 0; i < leadNames.length; i++) {
    const status = leadStatuses[i % leadStatuses.length];
    const stage = status === 'converted' ? 'converted' : status === 'hot' ? 'proposal' : status === 'warm' ? 'qualified' : status === 'cold' ? 'new' : leadStages[i % leadStages.length];

    const lead = new TelecallerLead({
      organizationId: organization._id,
      name: leadNames[i],
      phone: '7038672091', // Same phone for all leads as requested
      email: leadNames[i].toLowerCase().replace(/ /g, '.') + '@customer.com',
      status: status,
      stage: stage,
      priority: ['urgent', 'high', 'medium', 'low'][i % 4],
      source: leadSources[i % leadSources.length],
      campaignId: campaigns[i % campaigns.length]._id,
      assignedTo: telecallerUsers[i % telecallerUsers.length]._id,
      notes: [{
        content: `Lead notes for ${leadNames[i]}. Interested in kitchen products.`,
        createdBy: adminUser._id,
        createdAt: new Date()
      }],
      lastContactedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      nextFollowUp: status === 'follow_up' ? {
        date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        time: '10:00',
        assignedTo: telecallerUsers[i % telecallerUsers.length]._id
      } : null,
      createdBy: adminUser._id
    });
    await lead.save();
    leads.push(lead);
  }
  console.log('✓ Leads created:', leads.length, '(all with phone: 7038672091)');

  // 8. Create Call Logs
  console.log('\nCreating call logs...');
  const callLogs = [];
  const callStatuses = ['connected', 'not_connected', 'busy', 'no_answer', 'rejected', 'failed', 'missed'];
  const callTypes = ['incoming', 'outgoing', 'missed'];

  for (let i = 0; i < 50; i++) {
    const callLog = new CallLog({
      organizationId: organization._id,
      userId: telecallerUsers[i % telecallerUsers.length]._id,
      phoneNumber: '7038672091',
      leadId: leads[i % leads.length]._id,
      campaignId: campaigns[i % campaigns.length]._id,
      callType: callTypes[i % callTypes.length],
      status: callStatuses[i % callStatuses.length],
      duration: Math.floor(Math.random() * 600) + 30,
      notes: `Call notes for lead ${leads[i % leads.length].name}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
    await callLog.save();
    callLogs.push(callLog);
  }
  console.log('✓ Call logs created:', callLogs.length);

  // 9. Create Tasks
  console.log('\nCreating tasks...');
  const tasks = [];
  const taskTypes = ['call', 'follow_up', 'meeting', 'callback', 'reminder', 'other'];
  const taskStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'];

  for (let i = 0; i < 20; i++) {
    const task = new TelecallerTask({
      organizationId: organization._id,
      title: `Task ${i + 1}: ${['Call lead', 'Follow-up', 'Meeting', 'Callback', 'Reminder'][i % 5]}`,
      description: `Task description for task ${i + 1}`,
      type: taskTypes[i % taskTypes.length],
      status: taskStatuses[i % taskStatuses.length],
      priority: ['urgent', 'high', 'medium', 'low'][i % 4],
      assignedTo: telecallerUsers[i % telecallerUsers.length]._id,
      leadId: leads[i % leads.length]._id,
      dueDate: new Date(Date.now() + (i % 10) * 24 * 60 * 60 * 1000),
      createdBy: adminUser._id
    });
    await task.save();
    tasks.push(task);
  }
  console.log('✓ Tasks created:', tasks.length);

  // 10. Create Follow-ups
  console.log('\nCreating follow-ups...');
  const followUps = [];
  const followUpTypes = ['call', 'email', 'visit', 'meeting', 'other'];
  const followUpStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_answer'];

  for (let i = 0; i < 25; i++) {
    const followUp = new FollowUp({
      organizationId: organization._id,
      leadId: leads[i % leads.length]._id,
      assignedTo: telecallerUsers[i % telecallerUsers.length]._id,
      type: followUpTypes[i % followUpTypes.length],
      scheduledDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000),
      scheduledTime: `${String(9 + (i % 9)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
      status: followUpStatuses[i % followUpStatuses.length],
      notes: `Follow-up notes for lead ${leads[i % leads.length].name}`,
      createdBy: adminUser._id
    });
    await followUp.save();
    followUps.push(followUp);
  }
  console.log('✓ Follow-ups created:', followUps.length);

  // 11. Create Job Openings
  console.log('\nCreating job openings...');
  const jobOpenings = [];
  const jobData = [
    {
      title: 'Senior Sales Executive',
      department: 'Sales',
      location: 'Mumbai, MH',
      employmentType: 'full_time',
      description: 'We are looking for an experienced sales professional.',
      skills: ['Sales', 'Communication', 'Negotiation', 'CRM'],
      experienceRequired: { min: 3, max: 7 },
      salaryRange: { min: 35000, max: 55000 },
      vacancies: 2
    },
    {
      title: 'Interior Designer',
      department: 'Interior Design',
      location: 'Mumbai, MH',
      employmentType: 'full_time',
      description: 'Join our creative design team.',
      skills: ['AutoCAD', 'SketchUp', '3D Modeling', 'Interior Design'],
      experienceRequired: { min: 2, max: 5 },
      salaryRange: { min: 30000, max: 45000 },
      vacancies: 3
    },
    {
      title: 'Telecaller',
      department: 'Telecalling',
      location: 'Mumbai, MH',
      employmentType: 'full_time',
      description: 'Make outbound calls to potential customers.',
      skills: ['Communication', 'Telecalling', 'Customer Service'],
      experienceRequired: { min: 0, max: 2 },
      salaryRange: { min: 18000, max: 28000 },
      vacancies: 5
    }
  ];

  for (const data of jobData) {
    const job = new JobOpening({
      organizationId: organization._id,
      ...data,
      status: 'active',
      postedBy: adminUser._id,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true
    });
    await job.save();
    jobOpenings.push(job);
  }
  console.log('✓ Job openings created:', jobOpenings.length);

  // 12. Create Candidates
  console.log('\nCreating candidates...');
  const candidates = [];
  const candidateData = [
    { name: 'Aditya Sharma', email: 'aditya.s@email.com', phone: '+91-9988776655', position: 'Telecaller', department: 'Telecalling', experience: 1, expectedSalary: 22000, source: 'website', status: 'applied' },
    { name: 'Bhavna Patel', email: 'bhavna.p@email.com', phone: '+91-9988776656', position: 'Interior Designer', department: 'Interior Design', experience: 3, expectedSalary: 38000, source: 'job_portal', status: 'shortlisted' },
    { name: 'Chirag Mehta', email: 'chirag.m@email.com', phone: '+91-9988776657', position: 'Senior Sales Executive', department: 'Sales', experience: 5, expectedSalary: 42000, source: 'referral', status: 'interview_scheduled' },
    { name: 'Divya Nair', email: 'divya.n@email.com', phone: '+91-9988776658', position: 'Telecaller', department: 'Telecalling', experience: 0, expectedSalary: 18000, source: 'website', status: 'selected' }
  ];

  for (const data of candidateData) {
    const candidate = new Candidate({
      organizationId: organization._id,
      jobOpeningId: jobOpenings[0]._id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      experience: data.experience,
      expectedSalary: data.expectedSalary,
      source: data.source,
      status: data.status
    });
    await candidate.save();
    candidates.push(candidate);
  }
  console.log('✓ Candidates created:', candidates.length);

  // 13. Create Attendance Records
  console.log('\nCreating attendance records...');
  const today = new Date();
  const attendanceRecords = [];

  for (let day = 0; day < 30; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);

    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const employee of employees) {
      const isPresent = Math.random() > 0.08;
      const isLate = Math.random() > 0.85;

      if (isPresent) {
        const baseHour = 9;
        const lateMinutes = isLate ? Math.floor(Math.random() * 30) + 5 : 0;
        const checkInTime = new Date(date);
        checkInTime.setHours(baseHour, lateMinutes, 0, 0);

        const checkOutTime = new Date(date);
        const workHours = 8 + Math.floor(Math.random() * 2);
        checkOutTime.setHours(baseHour + workHours, Math.floor(Math.random() * 60), 0, 0);

        const attendance = new Attendance({
          organizationId: organization._id,
          employeeId: employee._id,
          shiftId: employee.shiftId,
          date: date,
          checkIn: {
            time: checkInTime,
            location: { lat: 19.0760 + Math.random() * 0.1, lng: 72.8777 + Math.random() * 0.1 }
          },
          checkOut: {
            time: checkOutTime,
            location: { lat: 19.0760 + Math.random() * 0.1, lng: 72.8777 + Math.random() * 0.1 }
          },
          workingHours: workHours + (Math.random() * 0.5),
          status: 'present',
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
          shiftId: employee.shiftId,
          date: date,
          status: 'absent',
          workingHours: 0
        });
        await attendance.save();
        attendanceRecords.push(attendance);
      }
    }
  }
  console.log('✓ Attendance records created:', attendanceRecords.length);

  // 14. Create Incentives
  console.log('\nCreating incentives...');
  const incentives = [];
  const salesEmployees = employees.filter(e => e.employment.department === 'Sales' || e.employment.department === 'Telecalling');

  for (const employee of salesEmployees) {
    for (let i = 0; i < 3; i++) {
      const salesAmount = Math.floor(Math.random() * 800000) + 100000;
      const incentiveAmount = Math.floor(salesAmount * 0.03);

      const incentive = new Incentive({
        organizationId: organization._id,
        employeeId: employee._id,
        salesAmount: salesAmount,
        incentivePercentage: 3,
        incentiveAmount: incentiveAmount,
        reason: 'sales_completion',
        description: `Monthly sales incentive for ${['January', 'February', 'March'][i]} 2026`,
        salesDate: new Date(2026, i, 15),
        status: i === 2 ? 'pending' : 'paid',
        paymentDate: i < 2 ? new Date(2026, i + 1, 15) : null,
        createdBy: adminUser._id
      });
      await incentive.save();
      incentives.push(incentive);
    }
  }
  console.log('✓ Incentives created:', incentives.length);

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('=== DATABASE SEEDING COMPLETE ===');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log('-----------');
  console.log('Organization:', organization.name);
  console.log('Campaigns:', campaigns.length);
  console.log('Leads:', leads.length, '(all phone: 7038672091)');
  console.log('Call Logs:', callLogs.length);
  console.log('Tasks:', tasks.length);
  console.log('Follow-ups:', followUps.length);
  console.log('Employees:', employees.length);
  console.log('Job Openings:', jobOpenings.length);
  console.log('Candidates:', candidates.length);
  console.log('Attendance Records:', attendanceRecords.length);
  console.log('Incentives:', incentives.length);

  console.log('\n' + '='.repeat(60));
  console.log('🔐 DEMO CREDENTIALS');
  console.log('='.repeat(60));
  console.log('\n👤 Admin:');
  console.log('   Email: admin@bestkitchenette.com');
  console.log('   Password: admin123');
  console.log('\n👤 Employee:');
  console.log('   Email: rajesh.k@bestkitchenette.com');
  console.log('   Password: employee123');
  console.log('\n👤 Telecaller:');
  console.log('   Email: suresh.t@bestkitchenette.com');
  console.log('   Password: telecaller123');
  console.log('\n📞 All Leads Phone: 7038672091');
  console.log('='.repeat(60) + '\n');

  return {
    organization,
    campaigns,
    leads,
    callLogs,
    tasks,
    followUps,
    employees
  };
};

const runSeed = async () => {
  try {
    await connectDB();
    await clearData();
    await seedData();

    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

runSeed();