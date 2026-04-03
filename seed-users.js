import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const organizationId = '69ce659461390b679fd80ecc';

  console.log('\n=== Seeding Users ===\n');

  // Check if users already exist
  const existingAdmin = await User.findOne({ email: 'admin@bestkitchenette.com' });
  const existingEmployee = await User.findOne({ email: 'rajesh.k@bestkitchenette.com' });

  // Create Admin User
  if (!existingAdmin) {
    console.log('Creating admin user...');
    const adminUser = new User({
      organizationId: organizationId,
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
    console.log('✓ Admin user created:', adminUser.email);
  } else {
    console.log('Admin user already exists:', existingAdmin.email);
  }

  // Create Employee User
  if (!existingEmployee) {
    console.log('Creating employee user...');
    const employeeUser = new User({
      organizationId: organizationId,
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
    console.log('✓ Employee user created:', employeeUser.email);
  } else {
    console.log('Employee user already exists:', existingEmployee.email);
  }

  console.log('\n=== Seeding Complete ===\n');
  console.log('Credentials:');
  console.log('------------------------');
  console.log('Admin:');
  console.log('  Email: admin@bestkitchenette.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Employee:');
  console.log('  Email: rajesh.k@bestkitchenette.com');
  console.log('  Password: employee123');
  console.log('------------------------\n');
};

const runSeed = async () => {
  try {
    await connectDB();
    await seedUsers();
    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

runSeed();