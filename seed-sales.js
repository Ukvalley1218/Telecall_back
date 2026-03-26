/**
 * Sales Lead & Client Milestone Seeder
 * Populates the database with sample sales leads and milestones for testing
 */

import mongoose from 'mongoose';
import SalesLead from './src/models/SalesLead.js';
import ClientMilestone from './src/models/ClientMilestone.js';
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

// Sample leads data - mix of current and historical
const sampleLeads = [
  // ===== CURRENT LEADS (March 2026) =====
  {
    title: "Modular Kitchen - Mr. Patil",
    client: "Mr. Rajesh Patil",
    company: "Patil Furniture Works",
    value: 250000,
    probability: "85%",
    stage: "Quotation",
    leadType: "new",
    priority: "High",
    contact: { name: "Mr. Patil", email: "patil.furniture@gmail.com", phone: "+91 99887 76655" },
    source: "Website",
    assignedToName: "Rahul Sharma",
    description: "2BHK Modular Kitchen with premium finishes",
    notes: "Final quotation sent, waiting for approval",
    expectedCloseDate: getDate(5),
    createdAt: getDate(-2)
  },
  {
    title: "Office Interior - Sharma Interiors",
    client: "Mrs. Sharma",
    company: "Sharma Interiors",
    value: 800000,
    probability: "70%",
    stage: "3D (Pending Approval)",
    leadType: "followup",
    priority: "High",
    contact: { name: "Mrs. Sharma", email: "sharma.interiors@gmail.com", phone: "+91 88776 65544" },
    source: "Referral",
    assignedToName: "Amit Patel",
    description: "Complete office interior design",
    notes: "3D design submitted, awaiting client approval",
    expectedCloseDate: getDate(10),
    createdAt: getDate(-5)
  },
  {
    title: "Villa Interior - Mr. Joshi",
    client: "Mr. Joshi",
    company: "Joshi Modular Kitchen",
    value: 1500000,
    probability: "55%",
    stage: "Visit",
    leadType: "new",
    priority: "High",
    contact: { name: "Mr. Joshi", email: "joshi.kitchen@gmail.com", phone: "+91 77665 54433" },
    source: "Trade Show",
    assignedToName: "Sneha Verma",
    description: "Full villa interior including kitchen, wardrobes, living room",
    notes: "Site visit completed, discussing requirements",
    expectedCloseDate: getDate(20),
    createdAt: getDate(-7)
  },
  {
    title: "Home Renovation - Ms. Kulkarni",
    client: "Ms. Kulkarni",
    company: "Kulkarni Home Solutions",
    value: 450000,
    probability: "40%",
    stage: "Appointment",
    leadType: "followup",
    priority: "Medium",
    contact: { name: "Ms. Kulkarni", email: "kulkarni.home@gmail.com", phone: "+91 66554 43322" },
    source: "Cold Call",
    assignedToName: "Vikram Desai",
    description: "Home renovation project",
    notes: "Appointment scheduled for next week",
    expectedCloseDate: getDate(30),
    createdAt: getDate(-10)
  },
  {
    title: "Shop Interior - Mr. Verma",
    client: "Mr. Verma",
    company: "Verma Enterprises",
    value: 300000,
    probability: "25%",
    stage: "Telecalling",
    leadType: "new",
    priority: "Medium",
    contact: { name: "Mr. Verma", email: "verma.enterprise@gmail.com", phone: "+91 55443 32211" },
    source: "Website",
    assignedToName: "Karan Mehta",
    description: "Retail shop interior design",
    notes: "First call completed, follow-up scheduled",
    expectedCloseDate: getDate(35),
    createdAt: getDate(-3)
  },
  {
    title: "3BHK Flat - Mrs. Gupta",
    client: "Mrs. Gupta",
    company: "Gupta Residency",
    value: 550000,
    probability: "10%",
    stage: "Marketing Lead Generation",
    leadType: "new",
    priority: "High",
    contact: { name: "Mrs. Gupta", email: "gupta.residency@gmail.com", phone: "+91 44332 21100" },
    source: "Instagram",
    assignedToName: "Priya Singh",
    description: "3BHK flat complete interior",
    notes: "New lead from marketing campaign",
    expectedCloseDate: getDate(45),
    createdAt: getDate(-1)
  },
  {
    title: "Penthouse Interior - Mr. Kapoor",
    client: "Mr. Kapoor",
    company: "Kapoor Properties",
    value: 2500000,
    probability: "40%",
    stage: "Appointment",
    leadType: "new",
    priority: "High",
    contact: { name: "Mr. Kapoor", email: "kapoor.props@gmail.com", phone: "+91 98765 43210" },
    source: "Google Ads",
    assignedToName: "Amit Patel",
    description: "Luxury penthouse complete interior",
    notes: "Initial meeting scheduled, high potential client",
    expectedCloseDate: getDate(60),
    createdAt: getDate(-4)
  },
  {
    title: "Office Renovation - Tech Startup",
    client: "Ms. Reddy",
    company: "TechFlow Solutions",
    value: 600000,
    probability: "25%",
    stage: "Telecalling",
    leadType: "followup",
    priority: "Medium",
    contact: { name: "Ms. Reddy", email: "reddy@techflow.com", phone: "+91 76543 21098" },
    source: "Other",
    assignedToName: "Vikram Desai",
    description: "Office renovation for tech startup",
    notes: "Interested in modern design, budget discussion pending",
    expectedCloseDate: getDate(45),
    createdAt: getDate(-6)
  },
  {
    title: "2BHK Interior - Mrs. Patel",
    client: "Mrs. Patel",
    company: "Patel Residency",
    value: 400000,
    probability: "55%",
    stage: "Visit",
    leadType: "new",
    priority: "Medium",
    contact: { name: "Mrs. Patel", email: "patel.residency@gmail.com", phone: "+91 65432 10987" },
    source: "Referral",
    assignedToName: "Priya Singh",
    description: "2BHK complete interior with modular kitchen",
    notes: "Site visit done, preparing quotation",
    expectedCloseDate: getDate(25),
    createdAt: getDate(-8)
  },
  {
    title: "Showroom Design - Mr. Singh",
    client: "Mr. Singh",
    company: "Singh Electronics",
    value: 750000,
    probability: "70%",
    stage: "3D (Pending Approval)",
    leadType: "followup",
    priority: "High",
    contact: { name: "Mr. Singh", email: "singh.electronics@gmail.com", phone: "+91 54321 09876" },
    source: "Trade Show",
    assignedToName: "Karan Mehta",
    description: "Electronics showroom complete design",
    notes: "3D design ready for review",
    expectedCloseDate: getDate(12),
    createdAt: getDate(-15)
  },

  // ===== WON DEALS (Historical - Last 3 months) =====
  {
    title: "Restaurant Project - Mr. Mehta",
    client: "Mr. Mehta",
    company: "Mehta Restaurants",
    value: 1200000,
    probability: "100%",
    stage: "Deal Won",
    leadType: "new",
    priority: "Medium",
    contact: { name: "Mr. Mehta", email: "mehta.restaurants@gmail.com", phone: "+91 98765 12345" },
    source: "Referral",
    assignedToName: "Rahul Sharma",
    description: "Complete restaurant interior",
    notes: "Deal closed, project in progress",
    expectedCloseDate: getDate(-6),
    createdAt: getDate(-45),
    status: "won"
  },
  {
    title: "Luxury Apartment - Mr. Shah",
    client: "Mr. Shah",
    company: "Shah Residency",
    value: 1800000,
    probability: "100%",
    stage: "Deal Won",
    leadType: "new",
    priority: "High",
    contact: { name: "Mr. Shah", email: "shah.luxury@gmail.com", phone: "+91 88776 12345" },
    source: "Website",
    assignedToName: "Sneha Verma",
    description: "4BHK luxury apartment complete interior",
    notes: "Project completed successfully",
    expectedCloseDate: getDate(-15),
    createdAt: getDate(-60),
    status: "won"
  },
  {
    title: "Corporate Office - ABC Corp",
    client: "Mr. Gupta",
    company: "ABC Corporation",
    value: 2500000,
    probability: "100%",
    stage: "Deal Won",
    leadType: "followup",
    priority: "High",
    contact: { name: "Mr. Gupta", email: "gupta@abccorp.com", phone: "+91 99887 54321" },
    source: "Cold Call",
    assignedToName: "Amit Patel",
    description: "Full corporate office interior - 10,000 sq ft",
    notes: "Large project, ongoing work",
    expectedCloseDate: getDate(-20),
    createdAt: getDate(-75),
    status: "won"
  },
  {
    title: "Boutique Store - Mrs. Kapoor",
    client: "Mrs. Kapoor",
    company: "Kapoor Fashions",
    value: 450000,
    probability: "100%",
    stage: "Deal Won",
    leadType: "new",
    priority: "Medium",
    contact: { name: "Mrs. Kapoor", email: "kapoor.fashions@gmail.com", phone: "+91 76543 21098" },
    source: "Instagram",
    assignedToName: "Priya Singh",
    description: "Fashion boutique store interior",
    notes: "Handover completed",
    expectedCloseDate: getDate(-30),
    createdAt: getDate(-55),
    status: "won"
  },
  {
    title: "Villa Project - Mr. Desai",
    client: "Mr. Desai",
    company: "Desai Properties",
    value: 3200000,
    probability: "100%",
    stage: "Deal Won",
    leadType: "new",
    priority: "High",
    contact: { name: "Mr. Desai", email: "desai.props@gmail.com", phone: "+91 98765 11111" },
    source: "Referral",
    assignedToName: "Rahul Sharma",
    description: "Complete villa interior - 5000 sq ft",
    notes: "High value project, milestone payments",
    expectedCloseDate: getDate(-10),
    createdAt: getDate(-50),
    status: "won"
  },
  {
    title: "Cafe Chain - Mr. Brown",
    client: "Mr. Brown",
    company: "Brown Cafe Chain",
    value: 1500000,
    probability: "100%",
    stage: "Deal Won",
    leadType: "followup",
    priority: "High",
    contact: { name: "Mr. Brown", email: "brown.cafe@gmail.com", phone: "+91 87654 32109" },
    source: "Trade Show",
    assignedToName: "Vikram Desai",
    description: "3 cafe outlets interior",
    notes: "Multiple locations",
    expectedCloseDate: getDate(-25),
    createdAt: getDate(-40),
    status: "won"
  },

  // ===== LOST DEALS (Historical) =====
  {
    title: "Cafe Design - Mr. Brown",
    client: "Mr. Brown",
    company: "Brown Cafe Chain",
    value: 900000,
    probability: "0%",
    stage: "Deal Lost",
    leadType: "followup",
    priority: "Low",
    contact: { name: "Mr. Brown", email: "brown.cafe@gmail.com", phone: "+91 87654 32109" },
    source: "Website",
    assignedToName: "Sneha Verma",
    description: "Cafe interior design project",
    notes: "Client went with competitor - lower price",
    expectedCloseDate: getDate(-10),
    createdAt: getDate(-20),
    status: "lost"
  },
  {
    title: "Hotel Lobby - Mr. Kumar",
    client: "Mr. Kumar",
    company: "Kumar Hotels",
    value: 3500000,
    probability: "0%",
    stage: "Deal Lost",
    leadType: "new",
    priority: "High",
    contact: { name: "Mr. Kumar", email: "kumar.hotels@gmail.com", phone: "+91 99887 99999" },
    source: "Google Ads",
    assignedToName: "Amit Patel",
    description: "5-star hotel lobby renovation",
    notes: "Budget exceeded client expectations",
    expectedCloseDate: getDate(-18),
    createdAt: getDate(-35),
    status: "lost"
  },
  {
    title: "School Interior - Mrs. Rao",
    client: "Mrs. Rao",
    company: "Rao Educational Trust",
    value: 2000000,
    probability: "0%",
    stage: "Deal Lost",
    leadType: "new",
    priority: "Medium",
    contact: { name: "Mrs. Rao", email: "rao.trust@gmail.com", phone: "+91 76543 00000" },
    source: "Referral",
    assignedToName: "Karan Mehta",
    description: "School interior and furniture",
    notes: "Project cancelled by client",
    expectedCloseDate: getDate(-22),
    createdAt: getDate(-45),
    status: "lost"
  },

  // ===== MORE ACTIVE LEADS =====
  {
    title: "Duplex Apartment - Mr. Agarwal",
    client: "Mr. Agarwal",
    company: "Agarwal Heights",
    value: 1100000,
    probability: "70%",
    stage: "Quotation",
    leadType: "followup",
    priority: "High",
    contact: { name: "Mr. Agarwal", email: "agarwal.heights@gmail.com", phone: "+91 98765 22222" },
    source: "Website",
    assignedToName: "Rahul Sharma",
    description: "Duplex apartment modern interior",
    notes: "Quotation sent, follow-up scheduled",
    expectedCloseDate: getDate(8),
    createdAt: getDate(-12)
  },
  {
    title: "Medical Clinic - Dr. Patel",
    client: "Dr. Patel",
    company: "Patel Healthcare",
    value: 650000,
    probability: "55%",
    stage: "Visit",
    leadType: "new",
    priority: "Medium",
    contact: { name: "Dr. Patel", email: "patel.healthcare@gmail.com", phone: "+91 88776 33333" },
    source: "Referral",
    assignedToName: "Sneha Verma",
    description: "Medical clinic interior design",
    notes: "Initial visit completed",
    expectedCloseDate: getDate(28),
    createdAt: getDate(-5)
  },
  {
    title: "Restaurant Chain - Mr. Khan",
    client: "Mr. Khan",
    company: "Khan Foods",
    value: 2800000,
    probability: "40%",
    stage: "Appointment",
    leadType: "new",
    priority: "High",
    contact: { name: "Mr. Khan", email: "khan.foods@gmail.com", phone: "+91 76543 44444" },
    source: "Trade Show",
    assignedToName: "Vikram Desai",
    description: "5 restaurant outlets interior",
    notes: "Large project, multiple locations",
    expectedCloseDate: getDate(50),
    createdAt: getDate(-8)
  },
  {
    title: "Gym Interior - Mr. Sharma",
    client: "Mr. Sharma",
    company: "FitZone Gym",
    value: 500000,
    probability: "25%",
    stage: "Telecalling",
    leadType: "followup",
    priority: "Medium",
    contact: { name: "Mr. Sharma", email: "fitzone.gym@gmail.com", phone: "+91 65432 55555" },
    source: "Instagram",
    assignedToName: "Karan Mehta",
    description: "Complete gym interior",
    notes: "Budget discussion in progress",
    expectedCloseDate: getDate(40),
    createdAt: getDate(-4)
  },
  {
    title: "Salon Interior - Mrs. Joshi",
    client: "Mrs. Joshi",
    company: "Joshi Beauty",
    value: 350000,
    probability: "10%",
    stage: "Marketing Lead Generation",
    leadType: "new",
    priority: "Medium",
    contact: { name: "Mrs. Joshi", email: "joshi.beauty@gmail.com", phone: "+91 54321 66666" },
    source: "Facebook",
    assignedToName: "Priya Singh",
    description: "Beauty salon interior",
    notes: "New lead from social media",
    expectedCloseDate: getDate(55),
    createdAt: getDate(0)
  }
];

// Milestones for won deals
const sampleMilestones = [
  // Restaurant Project - Mr. Mehta (₹12,00,000)
  {
    title: "Booking Amount",
    description: "Initial booking advance",
    amount: 240000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "payment",
    priority: "High",
    dueDate: getDate(-45),
    completedDate: getDate(-43)
  },
  {
    title: "Design Approval",
    description: "Final design approval milestone",
    amount: 360000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "design_approval",
    priority: "High",
    dueDate: getDate(-35),
    completedDate: getDate(-32)
  },
  {
    title: "Material & Fabrication",
    description: "Material procurement and fabrication",
    amount: 360000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "material_delivery",
    priority: "High",
    dueDate: getDate(-20),
    completedDate: getDate(-18)
  },
  {
    title: "Final Handover",
    description: "Project completion and handover",
    amount: 240000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "handover",
    priority: "High",
    dueDate: getDate(-6),
    completedDate: getDate(-5)
  },

  // Luxury Apartment - Mr. Shah (₹18,00,000)
  {
    title: "Advance Payment",
    description: "Initial 30% advance",
    amount: 540000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "payment",
    priority: "High",
    dueDate: getDate(-55),
    completedDate: getDate(-52)
  },
  {
    title: "2BHK Design Complete",
    description: "First phase design",
    amount: 450000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "design_approval",
    priority: "High",
    dueDate: getDate(-40),
    completedDate: getDate(-38)
  },
  {
    title: "Master Bedroom & Kitchen",
    description: "Final phase completion",
    amount: 540000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "installation",
    priority: "High",
    dueDate: getDate(-25),
    completedDate: getDate(-22)
  },
  {
    title: "Final Settlement",
    description: "Remaining payment on handover",
    amount: 270000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "handover",
    priority: "High",
    dueDate: getDate(-15),
    completedDate: getDate(-14)
  },

  // Corporate Office - ABC Corp (₹25,00,000)
  {
    title: "Project Advance",
    description: "25% advance payment",
    amount: 625000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "payment",
    priority: "High",
    dueDate: getDate(-70),
    completedDate: getDate(-68)
  },
  {
    title: "Reception & Conference",
    description: "Reception and conference rooms",
    amount: 750000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "installation",
    priority: "High",
    dueDate: getDate(-50),
    completedDate: getDate(-48)
  },
  {
    title: "Workstations & Cabins",
    description: "Employee workstations",
    amount: 750000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "installation",
    priority: "Medium",
    dueDate: getDate(-35),
    completedDate: getDate(-33)
  },
  {
    title: "Final Phase",
    description: "Pantry, break areas, final touches",
    amount: 375000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "handover",
    priority: "Medium",
    dueDate: getDate(-20),
    completedDate: getDate(-18)
  },

  // Boutique Store - Mrs. Kapoor (₹4,50,000)
  {
    title: "Booking Advance",
    description: "Initial booking amount",
    amount: 135000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "payment",
    priority: "Medium",
    dueDate: getDate(-50),
    completedDate: getDate(-48)
  },
  {
    title: "Design & Material",
    description: "Design approval and material procurement",
    amount: 180000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "material_delivery",
    priority: "Medium",
    dueDate: getDate(-40),
    completedDate: getDate(-38)
  },
  {
    title: "Final Handover",
    description: "Completion and handover",
    amount: 135000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "handover",
    priority: "Medium",
    dueDate: getDate(-30),
    completedDate: getDate(-28)
  },

  // Villa Project - Mr. Desai (₹32,00,000)
  {
    title: "Project Advance",
    description: "20% initial advance",
    amount: 640000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "payment",
    priority: "High",
    dueDate: getDate(-48),
    completedDate: getDate(-45)
  },
  {
    title: "Ground Floor Completion",
    description: "Ground floor interior complete",
    amount: 800000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "installation",
    priority: "High",
    dueDate: getDate(-35),
    completedDate: getDate(-32)
  },
  {
    title: "First Floor Completion",
    description: "First floor interior complete",
    amount: 800000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "installation",
    priority: "High",
    dueDate: getDate(-25),
    completedDate: getDate(-22)
  },
  {
    title: "Kitchen & Wardrobes",
    description: "Modular kitchen and wardrobes",
    amount: 480000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "installation",
    priority: "Medium",
    dueDate: getDate(-15),
    completedDate: getDate(-12)
  },
  {
    title: "Final Handover",
    description: "Project completion and final touches",
    amount: 480000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "handover",
    priority: "High",
    dueDate: getDate(-10),
    completedDate: getDate(-8)
  },

  // Cafe Chain - Mr. Brown (₹15,00,000)
  {
    title: "Branch 1 Advance",
    description: "First cafe advance",
    amount: 500000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "payment",
    priority: "High",
    dueDate: getDate(-38),
    completedDate: getDate(-35)
  },
  {
    title: "Branch 1 Completion",
    description: "First cafe complete",
    amount: 500000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "handover",
    priority: "High",
    dueDate: getDate(-28),
    completedDate: getDate(-25)
  },
  {
    title: "Branches 2 & 3",
    description: "Remaining two cafes",
    amount: 500000,
    status: "completed",
    paymentStatus: "paid",
    milestoneType: "handover",
    priority: "Medium",
    dueDate: getDate(-25),
    completedDate: getDate(-22)
  }
];

async function seedSalesLeads() {
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
    console.log(`Seeding ${sampleLeads.length} sales leads...`);

    // Clear existing sales leads and milestones for this organization
    await SalesLead.deleteMany({ organizationId: organization._id });
    await ClientMilestone.deleteMany({ organizationId: organization._id });
    console.log('Cleared existing sales leads and milestones');

    // Insert new leads
    const leadsToInsert = sampleLeads.map(lead => ({
      ...lead,
      organizationId: organization._id,
      createdBy: createdBy,
      status: lead.status || 'active'
    }));

    const insertedLeads = await SalesLead.insertMany(leadsToInsert);
    console.log(`Successfully inserted ${insertedLeads.length} sales leads`);

    // Find won deals to associate milestones
    const wonDeals = insertedLeads.filter(lead => lead.stage === 'Deal Won');
    console.log(`\nFound ${wonDeals.length} won deals for milestones`);

    // Assign milestones to won deals
    let milestoneIndex = 0;
    const milestonesToInsert = [];

    for (const deal of wonDeals) {
      // Get number of milestones for this deal (4 milestones per deal typically)
      const milestonesForDeal = sampleMilestones.slice(milestoneIndex, milestoneIndex + 4);

      for (const milestone of milestonesForDeal) {
        milestonesToInsert.push({
          ...milestone,
          organizationId: organization._id,
          salesLeadId: deal._id,
          createdBy: createdBy
        });
      }
      milestoneIndex += 4;

      // Break if we've assigned all milestones
      if (milestoneIndex >= sampleMilestones.length) break;
    }

    if (milestonesToInsert.length > 0) {
      const insertedMilestones = await ClientMilestone.insertMany(milestonesToInsert);
      console.log(`Successfully inserted ${insertedMilestones.length} client milestones`);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('LEAD SUMMARY BY STAGE');
    console.log('='.repeat(60));

    const stageSummary = {};
    insertedLeads.forEach(lead => {
      stageSummary[lead.stage] = (stageSummary[lead.stage] || 0) + 1;
    });

    Object.entries(stageSummary).forEach(([stage, count]) => {
      console.log(`  ${stage.padEnd(30)} ${count} leads`);
    });

    const activeLeads = insertedLeads.filter(l => l.status === 'active');
    const wonDealsList = insertedLeads.filter(l => l.status === 'won');
    const lostDealsList = insertedLeads.filter(l => l.status === 'lost');

    console.log('\n' + '='.repeat(60));
    console.log('PIPELINE VALUE SUMMARY');
    console.log('='.repeat(60));

    const activePipelineValue = activeLeads.reduce((sum, lead) => sum + lead.value, 0);
    const wonValue = wonDealsList.reduce((sum, lead) => sum + lead.value, 0);
    const lostValue = lostDealsList.reduce((sum, lead) => sum + lead.value, 0);

    console.log(`  Active Pipeline:    ₹${activePipelineValue.toLocaleString('en-IN')}`);
    console.log(`  Won Deals:          ₹${wonValue.toLocaleString('en-IN')}`);
    console.log(`  Lost Deals:        ₹${lostValue.toLocaleString('en-IN')}`);
    console.log(`  Total Pipeline:     ₹${(activePipelineValue + wonValue).toLocaleString('en-IN')}`);

    console.log('\n' + '='.repeat(60));
    console.log('MILESTONE SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Total Milestones: ${milestonesToInsert.length}`);
    console.log(`  Won Deals with Milestones: ${wonDeals.length}`);

    // Disconnect from database
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding sales leads:', error);
    process.exit(1);
  }
}

// Run seeder
seedSalesLeads();