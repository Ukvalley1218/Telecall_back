import 'dotenv/config';
import mongoose from 'mongoose';
import Employee from './src/models/Employee.js';
import Attendance from './src/models/Attendance.js';
import Shift from './src/models/Shift.js';
import Organization from './src/models/Organization.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedTodayAttendance = async () => {
  try {
    console.log('\n=== Seeding Today\'s Attendance ===\n');

    // Get the organization
    const organization = await Organization.findOne();
    if (!organization) {
      console.log('❌ No organization found. Please run the main seed script first.');
      process.exit(1);
    }

    // Get all active employees with their shifts
    const employees = await Employee.find({ organizationId: organization._id, status: 'active' })
      .populate('shiftId');

    if (employees.length === 0) {
      console.log('❌ No employees found. Please run the main seed script first.');
      process.exit(1);
    }

    console.log(`Found ${employees.length} active employees`);

    // Get default shift
    const defaultShift = await Shift.findOne({ organizationId: organization._id });
    if (!defaultShift) {
      console.log('❌ No shifts found. Please run the main seed script first.');
      process.exit(1);
    }

    // Clear today's attendance records
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deleteResult = await Attendance.deleteMany({
      organizationId: organization._id,
      date: today
    });
    console.log(`Cleared ${deleteResult.deletedCount} existing attendance records for today`);

    // Distribution:
    // 70% present
    // 10% late
    // 8% on leave (approved)
    // 12% absent

    let presentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;
    let absentCount = 0;

    const attendanceRecords = [];

    for (const employee of employees) {
      const shiftId = employee.shiftId?._id || defaultShift._id;
      const random = Math.random();

      let attendance;

      if (random < 0.70) {
        // Present (70%)
        presentCount++;
        const checkInTime = new Date(today);
        checkInTime.setHours(9, Math.floor(Math.random() * 10), 0, 0); // 9:00-9:10

        const checkOutTime = new Date(today);
        checkOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0); // 17:00-19:00

        attendance = new Attendance({
          organizationId: organization._id,
          employeeId: employee._id,
          shiftId: shiftId,
          date: today,
          checkIn: {
            time: checkInTime,
            location: { lat: 19.0760 + Math.random() * 0.05, lng: 72.8777 + Math.random() * 0.05 },
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`
          },
          checkOut: {
            time: checkOutTime,
            location: { lat: 19.0760 + Math.random() * 0.05, lng: 72.8777 + Math.random() * 0.05 },
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`
          },
          workingHours: 8 + Math.random() * 0.5,
          status: 'present',
          lateMark: { isLate: false, lateMinutes: 0, deductedHours: 0 }
        });
      } else if (random < 0.80) {
        // Late (10%)
        lateCount++;
        const lateMinutes = Math.floor(Math.random() * 30) + 10; // 10-40 minutes late
        const checkInTime = new Date(today);
        checkInTime.setHours(9, lateMinutes, 0, 0);

        const checkOutTime = new Date(today);
        checkOutTime.setHours(18, Math.floor(Math.random() * 30), 0, 0);

        attendance = new Attendance({
          organizationId: organization._id,
          employeeId: employee._id,
          shiftId: shiftId,
          date: today,
          checkIn: {
            time: checkInTime,
            location: { lat: 19.0760 + Math.random() * 0.05, lng: 72.8777 + Math.random() * 0.05 },
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`
          },
          checkOut: {
            time: checkOutTime,
            location: { lat: 19.0760 + Math.random() * 0.05, lng: 72.8777 + Math.random() * 0.05 },
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`
          },
          workingHours: 8,
          status: 'present',
          lateMark: { isLate: true, lateMinutes: lateMinutes, deductedHours: 1 }
        });
      } else if (random < 0.88) {
        // On Leave (8%)
        leaveCount++;
        attendance = new Attendance({
          organizationId: organization._id,
          employeeId: employee._id,
          shiftId: shiftId,
          date: today,
          status: 'leave',
          workingHours: 0,
          notes: 'Approved leave'
        });
      } else {
        // Absent (12%)
        absentCount++;
        attendance = new Attendance({
          organizationId: organization._id,
          employeeId: employee._id,
          shiftId: shiftId,
          date: today,
          status: 'absent',
          workingHours: 0
        });
      }

      await attendance.save();
      attendanceRecords.push(attendance);
    }

    console.log('\n=== Today\'s Attendance Summary ===');
    console.log(`Total Employees: ${employees.length}`);
    console.log(`Present: ${presentCount}`);
    console.log(`Late: ${lateCount}`);
    console.log(`On Leave: ${leaveCount}`);
    console.log(`Absent: ${absentCount}`);
    console.log('=================================\n');

    // Add some employees with birthdays this month
    const currentMonth = today.getMonth();
    const employeesWithBirthdays = employees.slice(0, 3).map(emp => {
      // Set birthday to current month
      const dob = new Date(emp.personalInfo.dateOfBirth);
      dob.setMonth(currentMonth);
      dob.setDate(today.getDate() + Math.floor(Math.random() * 28) + 1);
      return Employee.findByIdAndUpdate(emp._id, {
        'personalInfo.dateOfBirth': dob
      });
    });

    await Promise.all(employeesWithBirthdays);
    console.log('✅ Updated birthdates for upcoming birthdays');

    // Set some employees' joining dates to ~1 year ago for milestone
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setDate(oneYearAgo.getDate() - Math.floor(Math.random() * 30));

    const milestoneEmployees = employees.slice(5, 8);
    for (const emp of milestoneEmployees) {
      await Employee.findByIdAndUpdate(emp._id, {
        'employment.joiningDate': oneYearAgo
      });
    }
    console.log('✅ Updated joining dates for milestone achievers');

    console.log('\n✅ Today\'s attendance seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding attendance:', error);
    process.exit(1);
  }
};

// Run the seed
connectDB().then(() => {
  seedTodayAttendance();
});