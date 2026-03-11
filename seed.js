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
  console.log('Data cleared');
};

const seedData = async () => {
  console.log('\n=== Seeding Database ===\n');

  // 1. Create Organization
  console.log('Creating organization...');
  const organization = new Organization({
    name: 'BestKitchen',
    domain: 'bestkitchen',
    subscriptionPlan: 'premium',
    maxEmployees: 100,
    contactDetails: {
      email: 'contact@bestkitchen.com',
      phone: '+91-9876543210',
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

  // 2. Create Admin User
  console.log('\nCreating admin user...');
  const adminUser = new User({
    organizationId: organization._id,
    email: 'admin@bestkitchen.com',
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
  console.log('✓ Admin user created:', adminUser.email);

  // 3. Create HR Users
  console.log('\nCreating HR users...');
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

  // 4. Create Shifts
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

  // 5. Create KPIs with proper groups
  console.log('\nCreating KPIs...');
  const kpis = [];

  // Sales Team KPIs
  const salesKPIs = [
    { name: 'Revenue Generated', unit: 'Rs', targetValue: 500000, maxValue: 1000000, description: 'Total revenue generated from sales', weightage: 5 },
    { name: 'Calls Made', unit: 'Count', targetValue: 100, maxValue: 200, description: 'Number of calls made to prospects', weightage: 2 },
    { name: 'Leads Generated', unit: 'Count', targetValue: 30, maxValue: 60, description: 'Number of qualified leads generated', weightage: 3 },
    { name: 'Deals Closed', unit: 'Count', targetValue: 5, maxValue: 15, description: 'Number of deals successfully closed', weightage: 4 },
    { name: 'Client Meetings', unit: 'Count', targetValue: 20, maxValue: 40, description: 'Number of client meetings conducted', weightage: 2 }
  ];

  // Design Team KPIs
  const designKPIs = [
    { name: 'Unique Designs Created', unit: 'Count', targetValue: 15, maxValue: 30, description: 'Number of unique designs created', weightage: 4 },
    { name: 'Kitchen Designs', unit: 'Count', targetValue: 5, maxValue: 12, description: 'Number of kitchen designs completed', weightage: 3 },
    { name: 'Bedroom Designs', unit: 'Count', targetValue: 4, maxValue: 10, description: 'Number of bedroom designs completed', weightage: 3 },
    { name: 'PDF Proposals Generated', unit: 'Count', targetValue: 10, maxValue: 25, description: 'Number of PDF proposals created', weightage: 2 },
    { name: 'Client Approvals', unit: 'Count', targetValue: 8, maxValue: 20, description: 'Number of designs approved by clients', weightage: 4 }
  ];

  // Production Team KPIs
  const productionKPIs = [
    { name: 'Units Produced', unit: 'Count', targetValue: 500, maxValue: 1000, description: 'Number of units produced', weightage: 4 },
    { name: 'Quality Score', unit: 'Percentage', targetValue: 95, maxValue: 100, description: 'Quality percentage of produced items', weightage: 5 },
    { name: 'Efficiency Rate', unit: 'Percentage', targetValue: 90, maxValue: 100, description: 'Production efficiency percentage', weightage: 4 },
    { name: 'Downtime Hours', unit: 'Hours', targetValue: 5, maxValue: 20, description: 'Maximum acceptable downtime', weightage: 2 },
    { name: 'Safety Compliance', unit: 'Percentage', targetValue: 100, maxValue: 100, description: 'Safety compliance score', weightage: 5 }
  ];

  // Recruitment HR KPIs
  const recruitmentKPIs = [
    { name: 'Calls Made', unit: 'Count', targetValue: 80, maxValue: 150, description: 'Number of recruitment calls made', weightage: 3 },
    { name: 'Candidates Screened', unit: 'Count', targetValue: 40, maxValue: 80, description: 'Number of candidates screened', weightage: 4 },
    { name: 'Interviews Scheduled', unit: 'Count', targetValue: 15, maxValue: 30, description: 'Number of interviews scheduled', weightage: 3 },
    { name: 'Successful Onboards', unit: 'Count', targetValue: 3, maxValue: 10, description: 'Number of successful onboardings', weightage: 5 },
    { name: 'Offer Acceptance Rate', unit: 'Percentage', targetValue: 80, maxValue: 100, description: 'Percentage of offers accepted', weightage: 3 }
  ];

  // IT KPIs
  const itKPIs = [
    { name: 'Tickets Resolved', unit: 'Count', targetValue: 50, maxValue: 100, description: 'Number of tickets resolved', weightage: 4 },
    { name: 'System Uptime', unit: 'Percentage', targetValue: 99, maxValue: 100, description: 'System uptime percentage', weightage: 5 },
    { name: 'Response Time', unit: 'Hours', targetValue: 4, maxValue: 24, description: 'Average response time in hours', weightage: 3 },
    { name: 'Bug Fixes', unit: 'Count', targetValue: 20, maxValue: 50, description: 'Number of bugs fixed', weightage: 3 }
  ];

  // Marketing KPIs
  const marketingKPIs = [
    { name: 'Campaigns Launched', unit: 'Count', targetValue: 5, maxValue: 15, description: 'Number of campaigns launched', weightage: 4 },
    { name: 'Social Media Engagement', unit: 'Percentage', targetValue: 10, maxValue: 30, description: 'Social media engagement rate', weightage: 3 },
    { name: 'Website Traffic', unit: 'Count', targetValue: 10000, maxValue: 50000, description: 'Monthly website visitors', weightage: 4 },
    { name: 'Lead Conversion', unit: 'Percentage', targetValue: 15, maxValue: 40, description: 'Lead conversion rate', weightage: 5 }
  ];

  const kpiGroups = [
    { group: 'Sales', kpis: salesKPIs },
    { group: 'Design', kpis: designKPIs },
    { group: 'Production', kpis: productionKPIs },
    { group: 'Recruitment', kpis: recruitmentKPIs },
    { group: 'IT', kpis: itKPIs },
    { group: 'Marketing', kpis: marketingKPIs }
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

  // 6. Create Employees
  console.log('\nCreating employees...');
  const employees = [];
  const employeeData = [
    // Sales Team
    { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh.k@bestkitchen.com', phone: '+91-9876540001', department: 'Sales', designation: 'Senior Sales Executive', salary: { basic: 35000, allowances: 5000 } },
    { firstName: 'Vikram', lastName: 'Singh', email: 'vikram.s@bestkitchen.com', phone: '+91-9876540002', department: 'Sales', designation: 'Sales Manager', salary: { basic: 55000, allowances: 8000 } },
    { firstName: 'Anita', lastName: 'Patel', email: 'anita.p@bestkitchen.com', phone: '+91-9876540003', department: 'Sales', designation: 'Sales Executive', salary: { basic: 28000, allowances: 4000 } },
    { firstName: 'Deepak', lastName: 'Verma', email: 'deepak.v@bestkitchen.com', phone: '+91-9876540004', department: 'Sales', designation: 'Senior Sales Executive', salary: { basic: 38000, allowances: 5500 } },

    // Design Team
    { firstName: 'Priya', lastName: 'Sharma', email: 'priya.s@bestkitchen.com', phone: '+91-9876540005', department: 'Interior Design', designation: 'Lead Designer', salary: { basic: 45000, allowances: 7000 } },
    { firstName: 'Neha', lastName: 'Reddy', email: 'neha.r@bestkitchen.com', phone: '+91-9876540006', department: 'Interior Design', designation: 'Junior Designer', salary: { basic: 25000, allowances: 3500 } },
    { firstName: 'Arjun', lastName: 'Nair', email: 'arjun.n@bestkitchen.com', phone: '+91-9876540007', department: 'Interior Design', designation: 'Senior Designer', salary: { basic: 42000, allowances: 6000 } },

    // Production Team
    { firstName: 'Amit', lastName: 'Patel', email: 'amit.p@bestkitchen.com', phone: '+91-9876540008', department: 'Production', designation: 'Production Manager', salary: { basic: 50000, allowances: 7500 } },
    { firstName: 'Suresh', lastName: 'Kumar', email: 'suresh.k@bestkitchen.com', phone: '+91-9876540009', department: 'Production', designation: 'Production Supervisor', salary: { basic: 32000, allowances: 4800 } },
    { firstName: 'Ramesh', lastName: 'Yadav', email: 'ramesh.y@bestkitchen.com', phone: '+91-9876540010', department: 'Production', designation: 'Quality Inspector', salary: { basic: 30000, allowances: 4500 } },

    // Recruitment HR
    { firstName: 'Pooja', lastName: 'Mehta', email: 'pooja.m@bestkitchen.com', phone: '+91-9876540011', department: 'Recruitment HR', designation: 'HR Executive', salary: { basic: 28000, allowances: 4000 } },
    { firstName: 'Kiran', lastName: 'Desai', email: 'kiran.d@bestkitchen.com', phone: '+91-9876540012', department: 'Recruitment HR', designation: 'Senior HR Executive', salary: { basic: 35000, allowances: 5000 } },

    // IT Team
    { firstName: 'Rohit', lastName: 'Gupta', email: 'rohit.g@bestkitchen.com', phone: '+91-9876540013', department: 'IT', designation: 'Software Developer', salary: { basic: 48000, allowances: 7000 } },
    { firstName: 'Sanjay', lastName: 'Joshi', email: 'sanjay.j@bestkitchen.com', phone: '+91-9876540014', department: 'IT', designation: 'System Administrator', salary: { basic: 40000, allowances: 6000 } },

    // Marketing Team
    { firstName: 'Meera', lastName: 'Iyer', email: 'meera.i@bestkitchen.com', phone: '+91-9876540015', department: 'Marketing', designation: 'Marketing Manager', salary: { basic: 52000, allowances: 8000 } },
    { firstName: 'Kavita', lastName: 'Rao', email: 'kavita.r@bestkitchen.com', phone: '+91-9876540016', department: 'Marketing', designation: 'Content Writer', salary: { basic: 30000, allowances: 4500 } },

    // Finance
    { firstName: 'Arun', lastName: 'Menon', email: 'arun.m@bestkitchen.com', phone: '+91-9876540017', department: 'Finance', designation: 'Accountant', salary: { basic: 38000, allowances: 5500 } },
    { firstName: 'Lakshmi', lastName: 'Krishnan', email: 'lakshmi.k@bestkitchen.com', phone: '+91-9876540018', department: 'Finance', designation: 'Senior Accountant', salary: { basic: 45000, allowances: 6500 } }
  ];

  const getKPIGroupForDepartment = (department) => {
    const mapping = {
      'Sales': 'Sales',
      'Interior Design': 'Design',
      'Production': 'Production',
      'Recruitment HR': 'Recruitment',
      'IT': 'IT',
      'Marketing': 'Marketing',
      'Finance': 'IT'
    };
    return mapping[department] || 'Other';
  };

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
      salary: data.salary,
      overtimeAllowed: i % 3 === 0,
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

  // 7. Create Job Openings
  console.log('\nCreating job openings...');
  const jobOpenings = [];
  const jobData = [
    {
      title: 'Senior Sales Executive',
      department: 'Sales',
      location: 'Mumbai, MH',
      employmentType: 'full_time',
      description: 'We are looking for an experienced sales professional to join our growing sales team. The ideal candidate will have experience in B2B sales, excellent communication skills, and a proven track record of meeting targets.',
      skills: ['Sales', 'Communication', 'Negotiation', 'CRM', 'Lead Generation'],
      experienceRequired: { min: 3, max: 7 },
      salaryRange: { min: 35000, max: 55000 },
      vacancies: 2
    },
    {
      title: 'Interior Designer',
      department: 'Interior Design',
      location: 'Mumbai, MH',
      employmentType: 'full_time',
      description: 'Join our creative design team to create stunning kitchen and interior designs. Must be proficient in design software and have a keen eye for aesthetics.',
      skills: ['AutoCAD', 'SketchUp', '3D Modeling', 'Interior Design', 'Space Planning'],
      experienceRequired: { min: 2, max: 5 },
      salaryRange: { min: 30000, max: 45000 },
      vacancies: 3
    },
    {
      title: 'Production Supervisor',
      department: 'Production',
      location: 'Mumbai, MH',
      employmentType: 'full_time',
      description: 'Lead our production team to ensure quality and efficiency. Must have experience in manufacturing and team management.',
      skills: ['Production Management', 'Quality Control', 'Team Leadership', 'Lean Manufacturing'],
      experienceRequired: { min: 4, max: 8 },
      salaryRange: { min: 35000, max: 50000 },
      vacancies: 2
    },
    {
      title: 'HR Executive',
      department: 'Recruitment HR',
      location: 'Mumbai, MH',
      employmentType: 'full_time',
      description: 'Handle end-to-end recruitment and employee engagement activities. Freshers with good communication skills are welcome.',
      skills: ['Recruitment', 'Communication', 'MS Office', 'Employee Engagement'],
      experienceRequired: { min: 0, max: 2 },
      salaryRange: { min: 20000, max: 30000 },
      vacancies: 2
    },
    {
      title: 'Software Developer',
      department: 'IT',
      location: 'Remote',
      employmentType: 'full_time',
      description: 'Develop and maintain our internal systems. Experience with React, Node.js, and MongoDB required.',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'REST APIs'],
      experienceRequired: { min: 2, max: 5 },
      salaryRange: { min: 40000, max: 60000 },
      vacancies: 1,
      isRemote: true
    },
    {
      title: 'Marketing Executive',
      department: 'Marketing',
      location: 'Mumbai, MH',
      employmentType: 'full_time',
      description: 'Execute marketing campaigns and manage social media presence. Creative thinking and digital marketing knowledge required.',
      skills: ['Digital Marketing', 'Social Media', 'Content Writing', 'Google Analytics', 'SEO'],
      experienceRequired: { min: 1, max: 4 },
      salaryRange: { min: 25000, max: 40000 },
      vacancies: 2
    },
    {
      title: 'Sales Intern',
      department: 'Sales',
      location: 'Mumbai, MH',
      employmentType: 'internship',
      description: 'Great opportunity for freshers to learn sales. Stipend provided with potential for full-time offer.',
      skills: ['Communication', 'MS Office', 'Eagerness to Learn'],
      experienceRequired: { min: 0, max: 1 },
      salaryRange: { min: 10000, max: 15000 },
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

  // 8. Create Candidates in various stages
  console.log('\nCreating candidates...');
  const candidates = [];
  const candidateData = [
    // Applied candidates
    { name: 'Aditya Sharma', email: 'aditya.s@email.com', phone: '+91-9988776655', position: 'Senior Sales Executive', department: 'Sales', experience: 4, expectedSalary: 45000, source: 'website', status: 'applied' },
    { name: 'Bhavna Patel', email: 'bhavna.p@email.com', phone: '+91-9988776656', position: 'Interior Designer', department: 'Interior Design', experience: 3, expectedSalary: 38000, source: 'job_portal', status: 'applied' },
    { name: 'Chirag Mehta', email: 'chirag.m@email.com', phone: '+91-9988776657', position: 'Production Supervisor', department: 'Production', experience: 5, expectedSalary: 42000, source: 'referral', status: 'applied' },
    { name: 'Divya Nair', email: 'divya.n@email.com', phone: '+91-9988776658', position: 'HR Executive', department: 'Recruitment HR', experience: 1, expectedSalary: 25000, source: 'website', status: 'applied' },

    // Shortlisted candidates
    { name: 'Esha Gupta', email: 'esha.g@email.com', phone: '+91-9988776659', position: 'Senior Sales Executive', department: 'Sales', experience: 5, expectedSalary: 50000, source: 'job_portal', status: 'shortlisted' },
    { name: 'Farhan Khan', email: 'farhan.k@email.com', phone: '+91-9988776660', position: 'Interior Designer', department: 'Interior Design', experience: 2, expectedSalary: 32000, source: 'website', status: 'shortlisted' },
    { name: 'Gauri Joshi', email: 'gauri.j@email.com', phone: '+91-9988776661', position: 'Marketing Executive', department: 'Marketing', experience: 2, expectedSalary: 30000, source: 'referral', status: 'shortlisted' },

    // Screening stage
    { name: 'Harsh Vardhan', email: 'harsh.v@email.com', phone: '+91-9988776662', position: 'Software Developer', department: 'IT', experience: 3, expectedSalary: 55000, source: 'website', status: 'screening' },
    { name: 'Isha Singh', email: 'isha.s@email.com', phone: '+91-9988776663', position: 'HR Executive', department: 'Recruitment HR', experience: 0, expectedSalary: 22000, source: 'job_portal', status: 'screening' },

    // Interview scheduled
    { name: 'Jayesh Kumar', email: 'jayesh.k@email.com', phone: '+91-9988776664', position: 'Senior Sales Executive', department: 'Sales', experience: 6, expectedSalary: 52000, source: 'referral', status: 'interview_scheduled' },
    { name: 'Komal Reddy', email: 'komal.r@email.com', phone: '+91-9988776665', position: 'Interior Designer', department: 'Interior Design', experience: 4, expectedSalary: 40000, source: 'website', status: 'interview_scheduled' },

    // Selected candidates
    { name: 'Lakshya Sharma', email: 'lakshya.s@email.com', phone: '+91-9988776666', position: 'Production Supervisor', department: 'Production', experience: 6, expectedSalary: 48000, source: 'job_portal', status: 'selected' },

    // Training stage
    { name: 'Manasi Desai', email: 'manasi.d@email.com', phone: '+91-9988776667', position: 'HR Executive', department: 'Recruitment HR', experience: 1, expectedSalary: 26000, source: 'website', status: 'training' },
    { name: 'Nikhil Rao', email: 'nikhil.r@email.com', phone: '+91-9988776668', position: 'Sales Intern', department: 'Sales', experience: 0, expectedSalary: 12000, source: 'job_portal', status: 'training' },

    // Offer sent
    { name: 'Ojas Patel', email: 'ojas.p@email.com', phone: '+91-9988776669', position: 'Marketing Executive', department: 'Marketing', experience: 3, expectedSalary: 35000, source: 'referral', status: 'offer_sent' },

    // Rejected candidates
    { name: 'Pallavi Verma', email: 'pallavi.v@email.com', phone: '+91-9988776670', position: 'Software Developer', department: 'IT', experience: 1, expectedSalary: 45000, source: 'website', status: 'rejected' },
    { name: 'Quasim Ali', email: 'quasim.a@email.com', phone: '+91-9988776671', position: 'Sales Intern', department: 'Sales', experience: 0, expectedSalary: 15000, source: 'walk_in', status: 'rejected' }
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
      source: data.source,
      status: data.status,
      resumeUrl: data.status !== 'applied' ? `/uploads/resumes/${data.name.replace(' ', '_')}.pdf` : null,
      currentSalary: data.expectedSalary ? Math.floor(data.expectedSalary * 0.85) : null,
      notes: data.status === 'shortlisted' ? 'Good communication skills, relevant experience' : null,
      tags: ['potential', 'good-fit']
    });

    // Add interview details for interview_scheduled status
    if (data.status === 'interview_scheduled') {
      candidate.interviewDetails = {
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        interviewer: 'Admin User',
        location: 'Mumbai Office',
        notes: 'Technical round + HR round',
        completed: false,
        result: 'pending'
      };
    }

    // Add training details for training status
    if (data.status === 'training') {
      candidate.training = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        days: 15,
        status: 'in_progress',
        notes: 'Initial training on company processes'
      };
    }

    await candidate.save();
    candidates.push(candidate);
  }
  console.log('✓ Candidates created:', candidates.length);

  // 9. Create Attendance Records
  console.log('\nCreating attendance records...');
  const today = new Date();
  const attendanceRecords = [];

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

        const checkOutTime = new Date(date);
        const workHours = isHalfDay ? 4 : 8 + Math.floor(Math.random() * 2);
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
        attendanceRecords.push(attendance);
      } else {
        // Absent
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

  // 10. Create Incentives
  console.log('\nCreating incentives...');
  const incentives = [];
  const salesEmployees = employees.filter(e =>
    e.employment.department === 'Sales' || e.employment.department === 'Marketing'
  );

  // Incentive slabs based on salary
  const getIncentivePercentage = (amount) => {
    if (amount < 300000) return 2;
    if (amount < 600000) return 2.5;
    if (amount < 900000) return 3;
    if (amount < 1200000) return 3.5;
    if (amount < 1500000) return 4;
    if (amount < 2000000) return 4.5;
    return 5;
  };

  for (const employee of salesEmployees) {
    // Create 3 months of incentive data
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
        description: `Monthly sales incentive for ${['January', 'February', 'March'][i]} 2026`,
        salesDate: new Date(2026, i, 15),
        status: i === 2 ? 'pending' : 'paid',
        paymentDate: i < 2 ? new Date(2026, i + 1, 15) : null,
        paymentReference: i < 2 ? `PAY${Date.now()}${i}` : null,
        createdBy: adminUser._id
      });
      await incentive.save();
      incentives.push(incentive);
    }
  }
  console.log('✓ Incentives created:', incentives.length);

  console.log('\n=== Database Seeding Complete ===\n');
  console.log('Summary:');
  console.log('--------');
  console.log('Organization:', organization.name);
  console.log('Admin:', adminUser.email, '(password: admin123)');
  console.log('HR Users:', hrUsers.length);
  console.log('Shifts:', shifts.length);
  console.log('KPIs:', kpis.length, '(by groups: Sales, Design, Production, Recruitment, IT, Marketing)');
  console.log('Employees:', employees.length);
  console.log('Job Openings:', jobOpenings.length);
  console.log('Candidates:', candidates.length, '(in various stages: applied, shortlisted, screening, interview, selected, training, offer_sent, rejected)');
  console.log('Attendance Records:', attendanceRecords.length);
  console.log('Incentives:', incentives.length);
  console.log('\n------------------------');
  console.log('You can now login with:');
  console.log('Email: admin@bestkitchen.com');
  console.log('Password: admin123');
  console.log('========================\n');

  return {
    organization,
    adminUser,
    hrUsers,
    employees,
    shifts,
    kpis,
    jobOpenings,
    candidates,
    attendanceRecords,
    incentives
  };
};

const runSeed = async () => {
  try {
    await connectDB();
    await clearData();
    const data = await seedData();

    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

runSeed();