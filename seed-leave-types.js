import 'dotenv/config';
import mongoose from 'mongoose';
import Organization from './src/models/Organization.js';
import User from './src/models/User.js';
import LeaveType from './src/models/LeaveType.js';
import LeaveRequest from './src/models/LeaveRequest.js';
import LeaveBalance from './src/models/LeaveBalance.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const run = async () => {
  try {
    await connectDB();

    // Get the first organization (assuming single tenant)
    const organization = await Organization.findOne();
    if (!organization) {
      console.error('No organization found. Please run the main seed first.');
      process.exit(1);
    }

    // Get admin user for createdBy field
    const adminUser = await User.findOne({ role: 'admin', organizationId: organization._id });
    if (!adminUser) {
      console.error('No admin user found.');
      process.exit(1);
    }

    console.log(`Organization: ${organization.name}`);
    console.log(`Admin: ${adminUser.email}`);

    // 1. Delete all approved leave requests
    console.log('\n--- Deleting approved leave requests ---');
    const deleteResult = await LeaveRequest.deleteMany({ status: 'approved' });
    console.log(`Deleted ${deleteResult.deletedCount} approved leave requests`);

    // Also delete pending and rejected leaves if needed
    const deleteAllResult = await LeaveRequest.deleteMany({});
    console.log(`Deleted ${deleteAllResult.deletedCount} total leave requests (all statuses)`);

    // Delete all leave balances to start fresh
    const deleteBalancesResult = await LeaveBalance.deleteMany({});
    console.log(`Deleted ${deleteBalancesResult.deletedCount} leave balances`);

    // 2. Check if leave types already exist
    console.log('\n--- Creating leave types ---');
    const existingTypes = await LeaveType.find({ organizationId: organization._id });
    console.log(`Existing leave types: ${existingTypes.length}`);

    // Define leave types to create
    const leaveTypesData = [
      {
        name: 'Casual Leave',
        code: 'CL',
        description: 'Casual leave for personal purposes',
        annualQuota: 12,
        carryForward: true,
        maxCarryForward: 6,
        isPaid: true,
        isEncashable: false,
        color: '#4CAF50',
        applicableAfterMonths: 0,
        maxConsecutiveDays: 3,
        requireDocument: false
      },
      {
        name: 'Sick Leave',
        code: 'SL',
        description: 'Sick leave for health-related absences',
        annualQuota: 6,
        carryForward: false,
        maxCarryForward: 0,
        isPaid: true,
        isEncashable: false,
        color: '#F44336',
        applicableAfterMonths: 0,
        maxConsecutiveDays: 0,
        requireDocument: true,
        documentMandatoryAfterDays: 2
      }
    ];

    let createdCount = 0;
    for (const leaveTypeData of leaveTypesData) {
      // Check if this leave type already exists
      const existing = await LeaveType.findOne({
        organizationId: organization._id,
        code: leaveTypeData.code
      });

      if (existing) {
        console.log(`Leave type "${leaveTypeData.name}" (${leaveTypeData.code}) already exists - skipping`);
        continue;
      }

      // Create new leave type
      const leaveType = new LeaveType({
        organizationId: organization._id,
        ...leaveTypeData,
        isActive: true,
        createdBy: adminUser._id
      });

      await leaveType.save();
      console.log(`Created leave type: ${leaveType.name} (${leaveType.code})`);
      console.log(`  - Annual Quota: ${leaveType.annualQuota} days`);
      console.log(`  - Carry Forward: ${leaveType.carryForward}`);
      console.log(`  - Paid: ${leaveType.isPaid}`);
      createdCount++;
    }

    console.log(`\n--- Summary ---`);
    console.log(`Deleted ${deleteAllResult.deletedCount} leave requests`);
    console.log(`Deleted ${deleteBalancesResult.deletedCount} leave balances`);
    console.log(`Created ${createdCount} new leave types`);

    // Show all leave types
    const allLeaveTypes = await LeaveType.find({ organizationId: organization._id }).sort({ name: 1 });
    console.log(`\nTotal leave types in organization: ${allLeaveTypes.length}`);
    allLeaveTypes.forEach(lt => {
      console.log(`  - ${lt.name} (${lt.code}): ${lt.annualQuota} days/year`);
    });

    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();