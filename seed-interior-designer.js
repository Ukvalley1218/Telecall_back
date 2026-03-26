/**
 * Interior Designer Projects Seeder
 * Populates the database with sample design projects for testing
 */

import mongoose from 'mongoose';
import DesignProject from './src/models/DesignProject.js';
import Organization from './src/models/Organization.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Helper to get date relative to today
const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

// Sample design projects data
const sampleProjects = [
  // ===== NEW REQUESTS =====
  {
    title: "Modern Kitchen - Sharma Residence",
    clientName: "Mr. Rahul Sharma",
    clientPhone: "+91 98765 43210",
    clientEmail: "sharma.residence@gmail.com",
    clientAddress: "A-402, Green Valley Apartments, Pune",
    projectType: "Kitchen",
    projectValue: 350000,
    stage: "New Request",
    status: "active",
    priority: "High",
    description: "Complete modular kitchen with island counter, modern appliances, and storage solutions. Client prefers contemporary style with matte finish.",
    designDetails: {
      style: "Modern",
      roomType: "Kitchen",
      requirements: "Island counter with breakfast bar, tall unit for appliances, corner solutions for L-shaped layout",
      materials: ["Marble", "MDF", "Acrylic"]
    },
    expectedCompletionDate: getDate(45),
    createdAt: getDate(-1)
  },
  {
    title: "Master Wardrobe - Patel Villa",
    clientName: "Mrs. Priya Patel",
    clientPhone: "+91 87654 32109",
    clientEmail: "patel.villa@gmail.com",
    clientAddress: "B-101, Royal Enclave, Mumbai",
    projectType: "Wardrobe",
    projectValue: 180000,
    stage: "New Request",
    status: "active",
    priority: "Medium",
    description: "Walk-in wardrobe for master bedroom with mirror panels and integrated lighting. Contemporary design with sliding doors.",
    designDetails: {
      style: "Contemporary",
      roomType: "Master Bedroom",
      requirements: "Walk-in concept, mirror panels, LED strip lighting, soft-close drawers",
      materials: ["MDF", "Glass", "Mirror"]
    },
    expectedCompletionDate: getDate(30),
    createdAt: getDate(0)
  },

  // ===== ASSIGNED PROJECTS =====
  {
    title: "Full Home Interior - Joshi Family",
    clientName: "Mr. Amit Joshi",
    clientPhone: "+91 76543 21098",
    clientEmail: "amit.joshi@gmail.com",
    clientAddress: "C-501, Sky Heights, Bangalore",
    projectType: "Full Home",
    projectValue: 1200000,
    stage: "Assigned",
    status: "active",
    priority: "High",
    assignedToName: "Sarah Johnson",
    assignedAt: getDate(-2),
    description: "Complete 3BHK interior including kitchen, wardrobes, living room, and bedroom furniture. Modern minimalist style.",
    designDetails: {
      style: "Minimalist",
      roomType: "Full Home",
      requirements: "Modular kitchen, 3 wardrobes, TV unit, study table, dining set",
      materials: ["Plywood", "Laminate", "Acrylic"]
    },
    expectedCompletionDate: getDate(60),
    createdAt: getDate(-5)
  },
  {
    title: "Office Cabin Interior - TechStart Solutions",
    clientName: "Mr. Vikram Desai",
    clientPhone: "+91 65432 10987",
    clientEmail: "vikram@techstart.com",
    clientAddress: "Business Hub, Sector 15, Gurgaon",
    projectType: "Office",
    projectValue: 450000,
    stage: "Assigned",
    status: "active",
    priority: "Medium",
    assignedToName: "Michael Chen",
    assignedAt: getDate(-3),
    description: "CEO cabin and conference room interior with premium finishes. Corporate style with wooden elements.",
    designDetails: {
      style: "Contemporary",
      roomType: "Office",
      requirements: "Executive desk, seating for 8, display wall, storage cabinets",
      materials: ["Wood", "Glass", "Leather"]
    },
    expectedCompletionDate: getDate(35),
    createdAt: getDate(-7)
  },

  // ===== DESIGN IN PROGRESS =====
  {
    title: "Luxury Kitchen - Kapoor Mansion",
    clientName: "Mr. Raj Kapoor",
    clientPhone: "+91 54321 09876",
    clientEmail: "kapoor.mansion@gmail.com",
    clientAddress: "12, Palace Road, Delhi",
    projectType: "Kitchen",
    projectValue: 580000,
    stage: "Design In Progress",
    status: "active",
    priority: "High",
    assignedToName: "Emily Davis",
    assignedAt: getDate(-10),
    description: "High-end modular kitchen with imported appliances, quartz countertops, and custom cabinetry. Luxury finish required.",
    designDetails: {
      style: "Modern",
      roomType: "Kitchen",
      requirements: "Island counter with hob, breakfast counter, pantry unit, appliance garage",
      materials: ["Quartz", "Solid Surface", "Premium MDF"]
    },
    notes: "Client wants premium brands for appliances - Siemens/Miele",
    expectedCompletionDate: getDate(25),
    createdAt: getDate(-15)
  },
  {
    title: "Wardrobe Set - Mehta Apartments",
    clientName: "Mrs. Sunita Mehta",
    clientPhone: "+91 43210 98765",
    clientEmail: "sunita.mehta@gmail.com",
    clientAddress: "D-302, Mehta Apartments, Ahmedabad",
    projectType: "Wardrobe",
    projectValue: 280000,
    stage: "Design In Progress",
    status: "active",
    priority: "Medium",
    assignedToName: "James Wilson",
    assignedAt: getDate(-8),
    description: "Three wardrobes for different bedrooms with varying requirements. Master wardrobe with walk-in concept.",
    designDetails: {
      style: "Contemporary",
      roomType: "Bedrooms",
      requirements: "Master walk-in, children room wardrobe, guest room wardrobe",
      materials: ["MDF", "Laminate", "Mirror"]
    },
    expectedCompletionDate: getDate(20),
    createdAt: getDate(-12)
  },
  {
    title: "Restaurant Interior - Spice Garden",
    clientName: "Mr. Anil Kumar",
    clientPhone: "+91 32109 87654",
    clientEmail: "spice.garden@gmail.com",
    clientAddress: "Food Court, Mall Road, Jaipur",
    projectType: "Commercial",
    projectValue: 850000,
    stage: "Design In Progress",
    status: "active",
    priority: "High",
    assignedToName: "Lisa Anderson",
    assignedAt: getDate(-5),
    description: "Complete restaurant interior with kitchen, dining area, and bar counter. Theme-based design required.",
    designDetails: {
      style: "Industrial",
      roomType: "Restaurant",
      requirements: "Open kitchen concept, 40-seater dining, bar counter, outdoor seating",
      materials: ["Wood", "Metal", "Concrete Finish"]
    },
    notes: "Rush order - client needs before festival season",
    expectedCompletionDate: getDate(40),
    createdAt: getDate(-10)
  },

  // ===== PENDING REVIEW =====
  {
    title: "3BHK Interior - Gupta Family",
    clientName: "Mr. Sanjay Gupta",
    clientPhone: "+91 21098 76543",
    clientEmail: "sanjay.gupta@gmail.com",
    clientAddress: "E-101, Green Park, Hyderabad",
    projectType: "Full Home",
    projectValue: 950000,
    stage: "Pending Review",
    status: "active",
    priority: "High",
    assignedToName: "Sarah Johnson",
    assignedAt: getDate(-20),
    description: "Complete 3BHK interior with modular kitchen, wardrobes, and living room. Contemporary style.",
    designDetails: {
      style: "Contemporary",
      roomType: "3BHK Apartment",
      requirements: "Kitchen, 3 wardrobes, TV unit, study, dining",
      materials: ["Plywood", "Laminate", "Glass"]
    },
    notes: "Design submitted for internal review",
    expectedCompletionDate: getDate(15),
    createdAt: getDate(-25)
  },
  {
    title: "Modular Kitchen - Reddy Residence",
    clientName: "Mrs. Lakshmi Reddy",
    clientPhone: "+91 10987 65432",
    clientEmail: "lakshmi.reddy@gmail.com",
    clientAddress: "F-501, Lake View, Chennai",
    projectType: "Kitchen",
    projectValue: 320000,
    stage: "Pending Review",
    status: "active",
    priority: "Medium",
    assignedToName: "Michael Chen",
    assignedAt: getDate(-12),
    description: "U-shaped modular kitchen with breakfast counter. Traditional meets modern style.",
    designDetails: {
      style: "Contemporary",
      roomType: "Kitchen",
      requirements: "U-shaped layout, breakfast counter, tall unit, corner carousels",
      materials: ["Marine Plywood", "Laminate", "Acrylic"]
    },
    expectedCompletionDate: getDate(18),
    createdAt: getDate(-18)
  },

  // ===== CLIENT REVIEW =====
  {
    title: "Villa Interior - Singh Palace",
    clientName: "Mr. Harpreet Singh",
    clientPhone: "+91 09876 54321",
    clientEmail: "singh.palace@gmail.com",
    clientAddress: "Villa 5, Green Heights, Chandigarh",
    projectType: "Full Home",
    projectValue: 2500000,
    stage: "Client Review",
    status: "active",
    priority: "High",
    assignedToName: "Emily Davis",
    assignedAt: getDate(-30),
    description: "Complete villa interior with 5 bedrooms, kitchen, living areas, and home theater. Luxury finish.",
    designDetails: {
      style: "Modern",
      roomType: "Villa",
      requirements: "5 bedrooms, kitchen, living, dining, home theater, gym",
      materials: ["Solid Wood", "Italian Marble", "Premium Veneer"]
    },
    notes: "Design sent to client for approval. Awaiting feedback.",
    expectedCompletionDate: getDate(30),
    createdAt: getDate(-35)
  },
  {
    title: "Office Interior - Startup Hub",
    clientName: "Ms. Neha Agarwal",
    clientPhone: "+91 98765 12345",
    clientEmail: "neha@startuphub.com",
    clientAddress: "Tech Park, Electronic City, Bangalore",
    projectType: "Office",
    projectValue: 1500000,
    stage: "Client Review",
    status: "active",
    priority: "High",
    assignedToName: "James Wilson",
    assignedAt: getDate(-18),
    description: "Complete startup office with open workspace, meeting rooms, cafeteria, and recreation area.",
    designDetails: {
      style: "Industrial",
      roomType: "Office",
      requirements: "Open workspace 50 seats, 5 meeting rooms, cafeteria, recreation zone",
      materials: ["Metal", "Wood", "Glass"]
    },
    notes: "Client reviewing final design proposal",
    expectedCompletionDate: getDate(25),
    createdAt: getDate(-22)
  },

  // ===== REVISION =====
  {
    title: "Kitchen Renovation - Sharma House",
    clientName: "Mr. Deepak Sharma",
    clientPhone: "+91 87654 21098",
    clientEmail: "deepak.sharma@gmail.com",
    clientAddress: "G-202, Silver Tower, Mumbai",
    projectType: "Kitchen",
    projectValue: 280000,
    stage: "Revision",
    status: "active",
    priority: "Medium",
    assignedToName: "Lisa Anderson",
    assignedAt: getDate(-25),
    description: "Kitchen renovation with new layout. Client requested changes in color scheme and storage options.",
    designDetails: {
      style: "Modern",
      roomType: "Kitchen",
      requirements: "L-shaped layout, more storage, bright colors, easy maintenance",
      materials: ["MDF", "Acrylic", "Quartz"]
    },
    notes: "Client wants lighter color scheme and additional drawer units",
    expectedCompletionDate: getDate(12),
    createdAt: getDate(-30)
  },
  {
    title: "Children Room - Verma Family",
    clientName: "Mrs. Anita Verma",
    clientPhone: "+91 76543 10987",
    clientEmail: "anita.verma@gmail.com",
    clientAddress: "H-401, Children's Park, Noida",
    projectType: "Wardrobe",
    projectValue: 150000,
    stage: "Revision",
    status: "active",
    priority: "Low",
    assignedToName: "Sarah Johnson",
    assignedAt: getDate(-15),
    description: "Children's room furniture with study table and wardrobe. Need to incorporate more playful elements.",
    designDetails: {
      style: "Contemporary",
      roomType: "Children Bedroom",
      requirements: "Study table with storage, bunk bed friendly, colorful elements",
      materials: ["MDF", "Laminate"]
    },
    notes: "Revision: Add more colorful elements and toy storage",
    expectedCompletionDate: getDate(20),
    createdAt: getDate(-20)
  },

  // ===== APPROVED =====
  {
    title: "Premium Kitchen - Malhotra Residence",
    clientName: "Mr. Rajesh Malhotra",
    clientPhone: "+91 65432 19876",
    clientEmail: "malhotra.residence@gmail.com",
    clientAddress: "I-101, Premium Towers, Gurgaon",
    projectType: "Kitchen",
    projectValue: 420000,
    stage: "Approved",
    status: "active",
    priority: "High",
    assignedToName: "Emily Davis",
    assignedAt: getDate(-22),
    description: "Premium modular kitchen with high-end finishes. Design approved, ready for execution.",
    designDetails: {
      style: "Modern",
      roomType: "Kitchen",
      requirements: "Island kitchen, breakfast counter, wine cooler unit, appliance garage",
      materials: ["Quartz", "Solid Surface", "Premium Acrylic"]
    },
    notes: "Design approved by client. Waiting for advance payment.",
    expectedCompletionDate: getDate(35),
    createdAt: getDate(-28)
  },
  {
    title: "Wardrobe Collection - Kumar House",
    clientName: "Mr. Suresh Kumar",
    clientPhone: "+91 54321 08765",
    clientEmail: "suresh.kumar@gmail.com",
    clientAddress: "J-502, Kumar Residency, Bangalore",
    projectType: "Wardrobe",
    projectValue: 380000,
    stage: "Approved",
    status: "active",
    priority: "High",
    assignedToName: "Michael Chen",
    assignedAt: getDate(-20),
    description: "Four wardrobes for different rooms with varying specifications. Design approved.",
    designDetails: {
      style: "Contemporary",
      roomType: "Full Home",
      requirements: "Master wardrobe, 2 kids room wardrobes, guest wardrobe",
      materials: ["Plywood", "Laminate", "Mirror"]
    },
    notes: "Advance received. Starting execution next week.",
    expectedCompletionDate: getDate(30),
    createdAt: getDate(-25)
  },

  // ===== COMPLETED =====
  {
    title: "Modern Kitchen - Bajaj Family",
    clientName: "Mr. Rakesh Bajaj",
    clientPhone: "+91 43210 97654",
    clientEmail: "bajaj.family@gmail.com",
    clientAddress: "K-301, Modern Heights, Pune",
    projectType: "Kitchen",
    projectValue: 380000,
    stage: "Completed",
    status: "completed",
    priority: "High",
    assignedToName: "Sarah Johnson",
    assignedAt: getDate(-50),
    description: "Successfully completed modular kitchen with modern aesthetics.",
    designDetails: {
      style: "Modern",
      roomType: "Kitchen",
      requirements: "Complete modular kitchen with island",
      materials: ["MDF", "Acrylic", "Quartz"]
    },
    notes: "Project completed successfully. Client satisfied.",
    clientFeedback: {
      rating: 5,
      comments: "Excellent work! Very happy with the final result.",
      feedbackDate: getDate(-5)
    },
    actualCompletionDate: getDate(-5),
    expectedCompletionDate: getDate(-5),
    createdAt: getDate(-55)
  },
  {
    title: "2BHK Interior - Rao Family",
    clientName: "Mrs. Kavitha Rao",
    clientPhone: "+91 32109 86543",
    clientEmail: "kavitha.rao@gmail.com",
    clientAddress: "L-401, Rao Apartments, Hyderabad",
    projectType: "Full Home",
    projectValue: 650000,
    stage: "Completed",
    status: "completed",
    priority: "High",
    assignedToName: "James Wilson",
    assignedAt: getDate(-60),
    description: "Complete 2BHK interior with kitchen and wardrobes. Project delivered successfully.",
    designDetails: {
      style: "Contemporary",
      roomType: "2BHK Apartment",
      requirements: "Kitchen, 2 wardrobes, TV unit, dining table",
      materials: ["Plywood", "Laminate"]
    },
    notes: "Project completed on time.",
    clientFeedback: {
      rating: 4,
      comments: "Good work, minor delays but overall satisfied.",
      feedbackDate: getDate(-12)
    },
    actualCompletionDate: getDate(-12),
    expectedCompletionDate: getDate(-15),
    createdAt: getDate(-70)
  },
  {
    title: "Office Setup - Creative Agency",
    clientName: "Mr. Arjun Nair",
    clientPhone: "+91 21098 75432",
    clientEmail: "arjun@creativeagency.com",
    clientAddress: "Business Center, CBD Belapur, Mumbai",
    projectType: "Office",
    projectValue: 580000,
    stage: "Completed",
    status: "completed",
    priority: "Medium",
    assignedToName: "Lisa Anderson",
    assignedAt: getDate(-45),
    description: "Creative agency office with unique design elements. Successfully delivered.",
    designDetails: {
      style: "Industrial",
      roomType: "Office",
      requirements: "Creative workspace, meeting pods, cafeteria",
      materials: ["Metal", "Wood", "Glass"]
    },
    notes: "Unique design appreciated by client.",
    clientFeedback: {
      rating: 5,
      comments: "Amazing creativity! Our team loves the new office.",
      feedbackDate: getDate(-8)
    },
    actualCompletionDate: getDate(-8),
    expectedCompletionDate: getDate(-10),
    createdAt: getDate(-55)
  },
  {
    title: "Wardrobe - Gupta Villa",
    clientName: "Mr. Sunil Gupta",
    clientPhone: "+91 10987 64321",
    clientEmail: "sunil.gupta@gmail.com",
    clientAddress: "M-201, Gupta Villa, Delhi",
    projectType: "Wardrobe",
    projectValue: 220000,
    stage: "Completed",
    status: "completed",
    priority: "Medium",
    assignedToName: "Emily Davis",
    assignedAt: getDate(-35),
    description: "Walk-in wardrobe with premium finishes. Completed and handed over.",
    designDetails: {
      style: "Modern",
      roomType: "Master Bedroom",
      requirements: "Walk-in wardrobe, mirror panels, LED lighting",
      materials: ["MDF", "Mirror", "Glass"]
    },
    notes: "Client very happy with quality.",
    clientFeedback: {
      rating: 5,
      comments: "Exceeds expectations! The walk-in is beautiful.",
      feedbackDate: getDate(-3)
    },
    actualCompletionDate: getDate(-3),
    expectedCompletionDate: getDate(-5),
    createdAt: getDate(-40)
  }
];

async function seedDesignProjects() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://yuva99:yuvaninenine@yuva99.rzz98mq.mongodb.net/bestkitchenette_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get first organization
    const organization = await Organization.findOne();
    if (!organization) {
      console.error('No organization found. Please create an organization first.');
      process.exit(1);
    }

    // Get admin user for createdBy
    const adminUser = await User.findOne({ role: 'admin' });
    const createdBy = adminUser ? adminUser._id : null;

    console.log(`Using organization: ${organization.name}`);
    console.log(`Seeding ${sampleProjects.length} design projects...`);

    // Clear existing design projects for this organization
    await DesignProject.deleteMany({ organizationId: organization._id });
    console.log('Cleared existing design projects');

    // Insert new projects
    const projectsToInsert = sampleProjects.map(project => ({
      ...project,
      organizationId: organization._id,
      createdBy: createdBy
    }));

    const insertedProjects = await DesignProject.insertMany(projectsToInsert);
    console.log(`Successfully inserted ${insertedProjects.length} design projects`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('PROJECT SUMMARY BY STAGE');
    console.log('='.repeat(60));

    const stageSummary = {};
    insertedProjects.forEach(project => {
      stageSummary[project.stage] = (stageSummary[project.stage] || 0) + 1;
    });

    Object.entries(stageSummary).forEach(([stage, count]) => {
      console.log(`  ${stage.padEnd(25)} ${count} projects`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('PROJECT VALUE SUMMARY');
    console.log('='.repeat(60));

    const activeProjects = insertedProjects.filter(p => p.status === 'active');
    const completedProjects = insertedProjects.filter(p => p.status === 'completed');

    const activeValue = activeProjects.reduce((sum, p) => sum + p.projectValue, 0);
    const completedValue = completedProjects.reduce((sum, p) => sum + p.projectValue, 0);

    console.log(`  Active Projects:        ${activeProjects.length} (₹${activeValue.toLocaleString('en-IN')})`);
    console.log(`  Completed Projects:    ${completedProjects.length} (₹${completedValue.toLocaleString('en-IN')})`);
    console.log(`  Total Project Value:   ₹${(activeValue + completedValue).toLocaleString('en-IN')}`);

    console.log('\n' + '='.repeat(60));
    console.log('PRIORITY BREAKDOWN');
    console.log('='.repeat(60));

    const prioritySummary = {};
    insertedProjects.forEach(project => {
      prioritySummary[project.priority] = (prioritySummary[project.priority] || 0) + 1;
    });

    Object.entries(prioritySummary).forEach(([priority, count]) => {
      console.log(`  ${priority.padEnd(10)} ${count} projects`);
    });

    // Disconnect from database
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding design projects:', error);
    process.exit(1);
  }
}

// Run seeder
seedDesignProjects();