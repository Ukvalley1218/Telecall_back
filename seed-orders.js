/**
 * Order Management Seeder
 * Populates the database with sample orders for operations module testing
 */

import mongoose from 'mongoose';
import Order from './src/models/Order.js';
import Organization from './src/models/Organization.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '.env') });

// Helper to get date relative to today
const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

// Production Stages
const PRODUCTION_STAGES = [
  'Material Received',
  'Vendor Purchase',
  'Hardware Purchase',
  'IT Team Planning',
  'Delivery',
  'Installation Start',
  'Rework',
  'Quality Check',
  'Final',
  'Handover'
];

// Teams
const TEAMS = [
  { id: 1, name: 'Team Alpha', lead: 'Rahul Sharma', type: 'FM' },
  { id: 2, name: 'Team Beta', lead: 'Priya Patel', type: 'HM' },
  { id: 3, name: 'Team Gamma', lead: 'Amit Kumar', type: 'FM' },
  { id: 4, name: 'Team Delta', lead: 'Sneha Reddy', type: 'HM' },
  { id: 5, name: 'Team Omega', lead: 'Vikram Singh', type: 'FM' }
];

// Sample Orders Data
const sampleOrders = [
  // ===== NEW ORDERS (Recently placed) =====
  {
    orderId: 'ORD-2026-001',
    customer: {
      name: 'Mr. Rajesh Patil',
      email: 'patil.furniture@gmail.com',
      phone: '+91 99887 76655',
      address: { street: '123 MG Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' }
    },
    product: { name: 'L-Shaped Modular Kitchen', description: 'Premium L-shaped kitchen with island', category: 'Kitchen', type: 'FM' },
    amount: 450000,
    orderType: 'FM',
    status: 'new',
    trackingStatus: 'on_track',
    currentStage: 'Material Received',
    stageProgress: 1,
    completion: 5,
    priority: 'high',
    source: 'Website',
    assignedTeam: 'Team Alpha',
    supervisor: 'Rahul Sharma',
    orderDate: getDate(-2),
    expectedDelivery: getDate(25),
    notes: 'Premium finish with soft-close drawers'
  },
  {
    orderId: 'ORD-2026-002',
    customer: {
      name: 'Mrs. Sharma',
      email: 'sharma.interiors@gmail.com',
      phone: '+91 88776 65544',
      address: { street: '456 Park Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }
    },
    product: { name: 'Custom Wardrobe Set', description: 'Full bedroom wardrobe with loft', category: 'Bedroom', type: 'HM' },
    amount: 180000,
    orderType: 'HM',
    status: 'new',
    trackingStatus: 'on_track',
    currentStage: 'Material Received',
    stageProgress: 1,
    completion: 5,
    priority: 'medium',
    source: 'Referral',
    assignedTeam: 'Team Beta',
    supervisor: 'Priya Patel',
    orderDate: getDate(-1),
    expectedDelivery: getDate(30),
    notes: 'Custom design as per client requirements'
  },
  {
    orderId: 'ORD-2026-003',
    customer: {
      name: 'Mr. Joshi',
      email: 'joshi.kitchen@gmail.com',
      phone: '+91 77665 54433',
      address: { street: '789 Hill Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' }
    },
    product: { name: 'TV Unit with Study Table', description: 'Wall-mounted TV unit with study table', category: 'Living Room', type: 'FM' },
    amount: 95000,
    orderType: 'FM',
    status: 'new',
    trackingStatus: 'on_track',
    currentStage: 'Material Received',
    stageProgress: 1,
    completion: 3,
    priority: 'low',
    source: 'Walk-in',
    assignedTeam: 'Team Gamma',
    supervisor: 'Amit Kumar',
    orderDate: getDate(0),
    expectedDelivery: getDate(20),
    notes: 'Compact design for small apartment'
  },

  // ===== IN PRODUCTION ORDERS =====
  {
    orderId: 'ORD-2026-004',
    customer: {
      name: 'Ms. Kulkarni',
      email: 'kulkarni.home@gmail.com',
      phone: '+91 66554 43322',
      address: { street: '101 Lake View', city: 'Hyderabad', state: 'Telangana', pincode: '500001' }
    },
    product: { name: 'Complete Home Interior', description: '2BHK full interior package', category: 'Full Home', type: 'FM' },
    amount: 850000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'Vendor Purchase',
    stageProgress: 2,
    completion: 15,
    priority: 'high',
    source: 'Campaign',
    assignedTeam: 'Team Alpha',
    supervisor: 'Rahul Sharma',
    orderDate: getDate(-8),
    expectedDelivery: getDate(22),
    notes: 'Includes kitchen, wardrobes, and living room'
  },
  {
    orderId: 'ORD-2026-005',
    customer: {
      name: 'Mr. Verma',
      email: 'verma.enterprise@gmail.com',
      phone: '+91 55443 32211',
      address: { street: '202 Commercial Street', city: 'Delhi', state: 'Delhi', pincode: '110001' }
    },
    product: { name: 'Office Cabin Set', description: 'Executive office furniture', category: 'Office', type: 'FM' },
    amount: 320000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'Hardware Purchase',
    stageProgress: 3,
    completion: 25,
    priority: 'medium',
    source: 'Phone',
    assignedTeam: 'Team Gamma',
    supervisor: 'Amit Kumar',
    orderDate: getDate(-12),
    expectedDelivery: getDate(18),
    notes: '6 cabins with modular desks'
  },
  {
    orderId: 'ORD-2026-006',
    customer: {
      name: 'Mrs. Gupta',
      email: 'gupta.residency@gmail.com',
      phone: '+91 44332 21100',
      address: { street: '303 Green Park', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' }
    },
    product: { name: 'Modular Kitchen with Chimney', description: 'Full modular kitchen setup', category: 'Kitchen', type: 'FM' },
    amount: 280000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'IT Team Planning',
    stageProgress: 4,
    completion: 35,
    priority: 'high',
    source: 'Website',
    assignedTeam: 'Team Omega',
    supervisor: 'Vikram Singh',
    orderDate: getDate(-15),
    expectedDelivery: getDate(10),
    notes: 'Includes chimney and hob installation'
  },
  {
    orderId: 'ORD-2026-007',
    customer: {
      name: 'Mr. Kapoor',
      email: 'kapoor.props@gmail.com',
      phone: '+91 98765 43210',
      address: { street: '404 Skyline Tower', city: 'Mumbai', state: 'Maharashtra', pincode: '400051' }
    },
    product: { name: 'Penthouse Interior', description: 'Complete penthouse interior', category: 'Full Home', type: 'HM' },
    amount: 2500000,
    orderType: 'HM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'IT Team Planning',
    stageProgress: 4,
    completion: 30,
    priority: 'critical',
    source: 'Referral',
    assignedTeam: 'Team Delta',
    supervisor: 'Sneha Reddy',
    orderDate: getDate(-20),
    expectedDelivery: getDate(40),
    notes: 'High-end luxury interior with custom carpentry'
  },
  {
    orderId: 'ORD-2026-008',
    customer: {
      name: 'Ms. Reddy',
      email: 'reddy@techflow.com',
      phone: '+91 76543 21098',
      address: { street: '505 Tech Park', city: 'Bangalore', state: 'Karnataka', pincode: '560034' }
    },
    product: { name: 'Office Pantry Setup', description: 'Modern office pantry furniture', category: 'Office', type: 'FM' },
    amount: 150000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'Delivery',
    stageProgress: 5,
    completion: 50,
    priority: 'medium',
    source: 'Phone',
    assignedTeam: 'Team Beta',
    supervisor: 'Priya Patel',
    orderDate: getDate(-18),
    expectedDelivery: getDate(5),
    notes: 'Compact pantry for startup office'
  },
  {
    orderId: 'ORD-2026-009',
    customer: {
      name: 'Mrs. Patel',
      email: 'patel.residency@gmail.com',
      phone: '+91 65432 10987',
      address: { street: '606 River View', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' }
    },
    product: { name: '2BHK Interior Package', description: 'Complete 2BHK interior', category: 'Full Home', type: 'FM' },
    amount: 420000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'Installation Start',
    stageProgress: 6,
    completion: 60,
    priority: 'medium',
    source: 'Website',
    assignedTeam: 'Team Alpha',
    supervisor: 'Rahul Sharma',
    orderDate: getDate(-25),
    expectedDelivery: getDate(8),
    notes: 'Kitchen, wardrobes, and living room included'
  },

  // ===== DELAYED ORDERS =====
  {
    orderId: 'ORD-2026-010',
    customer: {
      name: 'Mr. Singh',
      email: 'singh.electronics@gmail.com',
      phone: '+91 54321 09876',
      address: { street: '707 Market Street', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' }
    },
    product: { name: 'Showroom Display Units', description: 'Custom showroom furniture', category: 'Commercial', type: 'FM' },
    amount: 580000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'delayed',
    currentStage: 'Rework',
    stageProgress: 7,
    completion: 65,
    delayDays: 5,
    delayReason: 'Material quality issue - needs rework',
    priority: 'critical',
    source: 'Campaign',
    assignedTeam: 'Team Gamma',
    supervisor: 'Amit Kumar',
    orderDate: getDate(-35),
    expectedDelivery: getDate(-5),
    notes: 'Urgent - client has showroom opening soon'
  },
  {
    orderId: 'ORD-2026-011',
    customer: {
      name: 'Mrs. Rao',
      email: 'rao.education@gmail.com',
      phone: '+91 43210 98765',
      address: { street: '808 School Lane', city: 'Hyderabad', state: 'Telangana', pincode: '500034' }
    },
    product: { name: 'School Furniture Set', description: 'Classroom and office furniture', category: 'Institutional', type: 'HM' },
    amount: 750000,
    orderType: 'HM',
    status: 'in_production',
    trackingStatus: 'delayed',
    currentStage: 'Hardware Purchase',
    stageProgress: 3,
    completion: 20,
    delayDays: 8,
    delayReason: 'Vendor delay in material supply',
    priority: 'high',
    source: 'Referral',
    assignedTeam: 'Team Delta',
    supervisor: 'Sneha Reddy',
    orderDate: getDate(-28),
    expectedDelivery: getDate(12),
    notes: 'Bulk order - 20 classrooms'
  },
  {
    orderId: 'ORD-2026-012',
    customer: {
      name: 'Mr. Desai',
      email: 'desai.props@gmail.com',
      phone: '+91 98765 11111',
      address: { street: '909 Palm Avenue', city: 'Pune', state: 'Maharashtra', pincode: '411004' }
    },
    product: { name: 'Villa Kitchen & Wardrobes', description: 'Premium villa interior', category: 'Full Home', type: 'FM' },
    amount: 1200000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'delayed',
    currentStage: 'IT Team Planning',
    stageProgress: 4,
    completion: 30,
    delayDays: 3,
    delayReason: 'Design revision requested by client',
    priority: 'high',
    source: 'Website',
    assignedTeam: 'Team Omega',
    supervisor: 'Vikram Singh',
    orderDate: getDate(-22),
    expectedDelivery: getDate(18),
    notes: 'Premium materials - Italian marble finish'
  },

  // ===== COMPLETED ORDERS (Last 3 months) =====
  {
    orderId: 'ORD-2026-013',
    customer: {
      name: 'Mr. Mehta',
      email: 'mehta.restaurants@gmail.com',
      phone: '+91 98765 12345',
      address: { street: '1010 Food Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' }
    },
    product: { name: 'Restaurant Interior', description: 'Complete restaurant setup', category: 'Commercial', type: 'HM' },
    amount: 1200000,
    orderType: 'HM',
    status: 'completed',
    trackingStatus: 'completed',
    currentStage: 'Handover',
    stageProgress: 10,
    completion: 100,
    priority: 'medium',
    source: 'Referral',
    assignedTeam: 'Team Alpha',
    supervisor: 'Rahul Sharma',
    orderDate: getDate(-60),
    expectedDelivery: getDate(-10),
    actualDelivery: getDate(-8),
    completedDate: getDate(-8),
    rating: 5,
    review: 'Excellent work! Very professional team.',
    notes: 'Successful handover with client appreciation'
  },
  {
    orderId: 'ORD-2026-014',
    customer: {
      name: 'Mr. Shah',
      email: 'shah.luxury@gmail.com',
      phone: '+91 88776 12345',
      address: { street: '1111 Luxury Towers', city: 'Delhi', state: 'Delhi', pincode: '110021' }
    },
    product: { name: 'Luxury 4BHK Interior', description: 'Complete luxury apartment', category: 'Full Home', type: 'FM' },
    amount: 1800000,
    orderType: 'FM',
    status: 'completed',
    trackingStatus: 'completed',
    currentStage: 'Handover',
    stageProgress: 10,
    completion: 100,
    priority: 'high',
    source: 'Website',
    assignedTeam: 'Team Delta',
    supervisor: 'Sneha Reddy',
    orderDate: getDate(-75),
    expectedDelivery: getDate(-15),
    actualDelivery: getDate(-12),
    completedDate: getDate(-12),
    rating: 5,
    review: 'Outstanding quality and timely delivery',
    notes: 'High-profile client - VIP treatment'
  },
  {
    orderId: 'ORD-2026-015',
    customer: {
      name: 'Mr. Gupta',
      email: 'gupta@abccorp.com',
      phone: '+91 99887 54321',
      address: { street: '1212 Corporate Hub', city: 'Bangalore', state: 'Karnataka', pincode: '560042' }
    },
    product: { name: 'Corporate Office Setup', description: 'Full office interior', category: 'Office', type: 'FM' },
    amount: 2500000,
    orderType: 'FM',
    status: 'completed',
    trackingStatus: 'completed',
    currentStage: 'Handover',
    stageProgress: 10,
    completion: 100,
    priority: 'critical',
    source: 'Phone',
    assignedTeam: 'Team Gamma',
    supervisor: 'Amit Kumar',
    orderDate: getDate(-90),
    expectedDelivery: getDate(-20),
    actualDelivery: getDate(-18),
    completedDate: getDate(-18),
    rating: 4,
    review: 'Good quality, minor delays but managed well',
    notes: 'Large project - 10000 sq ft'
  },
  {
    orderId: 'ORD-2026-016',
    customer: {
      name: 'Mrs. Kapoor',
      email: 'kapoor.fashions@gmail.com',
      phone: '+91 76543 21098',
      address: { street: '1313 Fashion Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400058' }
    },
    product: { name: 'Fashion Boutique', description: 'Boutique store interior', category: 'Commercial', type: 'HM' },
    amount: 450000,
    orderType: 'HM',
    status: 'completed',
    trackingStatus: 'completed',
    currentStage: 'Handover',
    stageProgress: 10,
    completion: 100,
    priority: 'medium',
    source: 'Website',
    assignedTeam: 'Team Beta',
    supervisor: 'Priya Patel',
    orderDate: getDate(-55),
    expectedDelivery: getDate(-30),
    actualDelivery: getDate(-28),
    completedDate: getDate(-28),
    rating: 5,
    review: 'Perfect design exactly as envisioned',
    notes: 'Instagram-worthy boutique'
  },
  {
    orderId: 'ORD-2026-017',
    customer: {
      name: 'Mr. Brown',
      email: 'brown.cafe@gmail.com',
      phone: '+91 87654 32109',
      address: { street: '1414 Cafe Lane', city: 'Pune', state: 'Maharashtra', pincode: '411005' }
    },
    product: { name: 'Cafe Chain - 3 Outlets', description: 'Three cafe outlets interior', category: 'Commercial', type: 'FM' },
    amount: 1500000,
    orderType: 'FM',
    status: 'completed',
    trackingStatus: 'completed',
    currentStage: 'Handover',
    stageProgress: 10,
    completion: 100,
    priority: 'high',
    source: 'Campaign',
    assignedTeam: 'Team Omega',
    supervisor: 'Vikram Singh',
    orderDate: getDate(-70),
    expectedDelivery: getDate(-25),
    actualDelivery: getDate(-25),
    completedDate: getDate(-25),
    rating: 4,
    review: 'Great work on all three locations',
    notes: 'Multiple location coordination'
  },

  // ===== NEAR COMPLETION ORDERS =====
  {
    orderId: 'ORD-2026-018',
    customer: {
      name: 'Mr. Agarwal',
      email: 'agarwal.homes@gmail.com',
      phone: '+91 76543 12345',
      address: { street: '1515 Residential Complex', city: 'Delhi', state: 'Delhi', pincode: '110032' }
    },
    product: { name: '3BHK Interior', description: 'Full apartment interior', category: 'Full Home', type: 'FM' },
    amount: 650000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'Quality Check',
    stageProgress: 8,
    completion: 80,
    priority: 'high',
    source: 'Website',
    assignedTeam: 'Team Alpha',
    supervisor: 'Rahul Sharma',
    orderDate: getDate(-40),
    expectedDelivery: getDate(3),
    notes: 'Final quality checks in progress'
  },
  {
    orderId: 'ORD-2026-019',
    customer: {
      name: 'Mrs. Sharma',
      email: 'sharma.villa@gmail.com',
      phone: '+91 65432 11111',
      address: { street: '1616 Villa Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600041' }
    },
    product: { name: 'Villa Renovation', description: 'Complete villa renovation', category: 'Full Home', type: 'HM' },
    amount: 980000,
    orderType: 'HM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'Final',
    stageProgress: 9,
    completion: 90,
    priority: 'high',
    source: 'Referral',
    assignedTeam: 'Team Delta',
    supervisor: 'Sneha Reddy',
    orderDate: getDate(-50),
    expectedDelivery: getDate(2),
    notes: 'Handover preparation in final stage'
  },
  {
    orderId: 'ORD-2026-020',
    customer: {
      name: 'Mr. Kumar',
      email: 'kumar.office@gmail.com',
      phone: '+91 54321 22222',
      address: { street: '1717 IT Park', city: 'Hyderabad', state: 'Telangana', pincode: '500081' }
    },
    product: { name: 'IT Office Setup', description: 'Modern IT office furniture', category: 'Office', type: 'FM' },
    amount: 520000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'Quality Check',
    stageProgress: 8,
    completion: 85,
    priority: 'medium',
    source: 'Phone',
    assignedTeam: 'Team Gamma',
    supervisor: 'Amit Kumar',
    orderDate: getDate(-30),
    expectedDelivery: getDate(5),
    notes: 'Ergonomic furniture for tech office'
  },

  // ===== MORE IN-PRODUCTION ORDERS FOR PIPELINE =====
  {
    orderId: 'ORD-2026-021',
    customer: {
      name: 'Mrs. Nair',
      email: 'nair.residency@gmail.com',
      phone: '+91 43210 33333',
      address: { street: '1818 Coconut Grove', city: 'Kochi', state: 'Kerala', pincode: '682001' }
    },
    product: { name: 'Traditional Kitchen', description: 'Traditional style modular kitchen', category: 'Kitchen', type: 'HM' },
    amount: 220000,
    orderType: 'HM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'Installation Start',
    stageProgress: 6,
    completion: 55,
    priority: 'medium',
    source: 'Website',
    assignedTeam: 'Team Beta',
    supervisor: 'Priya Patel',
    orderDate: getDate(-20),
    expectedDelivery: getDate(10),
    notes: 'Traditional Kerala style kitchen'
  },
  {
    orderId: 'ORD-2026-022',
    customer: {
      name: 'Mr. Menon',
      email: 'menon.furniture@gmail.com',
      phone: '+91 32109 44444',
      address: { street: '1919 Temple Street', city: 'Thiruvananthapuram', state: 'Kerala', pincode: '695001' }
    },
    product: { name: 'Office Cabinetry', description: 'Executive office furniture', category: 'Office', type: 'FM' },
    amount: 175000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'Delivery',
    stageProgress: 5,
    completion: 45,
    priority: 'low',
    source: 'Referral',
    assignedTeam: 'Team Omega',
    supervisor: 'Vikram Singh',
    orderDate: getDate(-15),
    expectedDelivery: getDate(8),
    notes: 'Modern executive setup'
  },
  {
    orderId: 'ORD-2026-023',
    customer: {
      name: 'Dr. Rao',
      email: 'rao.clinic@gmail.com',
      phone: '+91 21098 55555',
      address: { street: '2020 Medical Complex', city: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '530001' }
    },
    product: { name: 'Clinic Interior', description: 'Medical clinic interior', category: 'Commercial', type: 'FM' },
    amount: 380000,
    orderType: 'FM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'IT Team Planning',
    stageProgress: 4,
    completion: 35,
    priority: 'high',
    source: 'Phone',
    assignedTeam: 'Team Alpha',
    supervisor: 'Rahul Sharma',
    orderDate: getDate(-10),
    expectedDelivery: getDate(20),
    notes: 'Medical-grade materials required'
  },
  {
    orderId: 'ORD-2026-024',
    customer: {
      name: 'Mrs. Iyer',
      email: 'iyer.homes@gmail.com',
      phone: '+91 10987 66666',
      address: { street: '2121 Garden View', city: 'Mysore', state: 'Karnataka', pincode: '570001' }
    },
    product: { name: 'Master Bedroom Suite', description: 'Complete bedroom furniture', category: 'Bedroom', type: 'HM' },
    amount: 145000,
    orderType: 'HM',
    status: 'in_production',
    trackingStatus: 'on_track',
    currentStage: 'Vendor Purchase',
    stageProgress: 2,
    completion: 15,
    priority: 'medium',
    source: 'Website',
    assignedTeam: 'Team Delta',
    supervisor: 'Sneha Reddy',
    orderDate: getDate(-5),
    expectedDelivery: getDate(25),
    notes: 'Custom carved furniture'
  },
  {
    orderId: 'ORD-2026-025',
    customer: {
      name: 'Mr. Choudhary',
      email: 'choudhary.business@gmail.com',
      phone: '+91 99887 77777',
      address: { street: '2222 Business Park', city: 'Indore', state: 'Madhya Pradesh', pincode: '452001' }
    },
    product: { name: 'Conference Room Setup', description: 'Premium conference furniture', category: 'Office', type: 'FM' },
    amount: 265000,
    orderType: 'FM',
    status: 'new',
    trackingStatus: 'on_track',
    currentStage: 'Material Received',
    stageProgress: 1,
    completion: 5,
    priority: 'high',
    source: 'Campaign',
    assignedTeam: 'Team Gamma',
    supervisor: 'Amit Kumar',
    orderDate: getDate(-1),
    expectedDelivery: getDate(28),
    notes: 'Video conferencing integration needed'
  }
];

// Internal steps for each stage (FM type)
const FM_INTERNAL_STEPS = {
  'Material Received': ['Material Inspection', 'Quality Verification', 'Inventory Update'],
  'Vendor Purchase': ['Vendor Selection', 'PO Generation', 'Payment Processing'],
  'Hardware Purchase': ['Hardware List Finalization', 'Procurement', 'Quality Check'],
  'IT Team Planning': ['Design Review', 'Production Planning', 'Resource Allocation'],
  'Delivery': ['Packing', 'Dispatch', 'Transportation'],
  'Installation Start': ['Site Preparation', 'Installation', 'Testing'],
  'Rework': ['Issue Identification', 'Correction', 'Re-verification'],
  'Quality Check': ['Visual Inspection', 'Dimensional Check', 'Functionality Test'],
  'Final': ['Final Touch', 'Documentation', 'Client Preview'],
  'Handover': ['Client Walkthrough', 'Training', 'Handover Sign-off']
};

// Helper to generate internal steps based on current stage
const generateInternalSteps = (currentStage, orderType) => {
  const steps = orderType === 'FM' ? FM_INTERNAL_STEPS[currentStage] : FM_INTERNAL_STEPS[currentStage];
  const stageProgress = PRODUCTION_STAGES.indexOf(currentStage) + 1;

  return steps.map((step, index) => ({
    name: step,
    completed: index < Math.floor(stageProgress / 3) || (stageProgress >= 8 && index < steps.length - 1)
  }));
};

// Main seed function
async function seedOrders() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/bestkitchenette';
    console.log('Connecting to MongoDB...');
    console.log('Database URI:', mongoUri.replace(/:[^:@]+@/, ':****@'));
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);

    // Get organization - use DemoKitchenette (bestkitchenette.com domain)
    let organization = await Organization.findOne({ name: 'DemoKitchenette' });
    if (!organization) {
      // Fallback to BestKitchenette if DemoKitchenette doesn't exist
      organization = await Organization.findOne({ name: 'BestKitchenette' });
    }
    if (!organization) {
      // Fallback to any organization
      organization = await Organization.findOne();
    }
    if (!organization) {
      throw new Error('No organization found. Please run the main seed file first.');
    }
    console.log(`Using organization: ${organization.name}`);

    // Get admin user for createdBy
    const adminUser = await User.findOne({ role: 'admin' });
    const createdBy = adminUser ? adminUser._id : null;
    if (!createdBy) {
      console.warn('Warning: No admin user found. Orders will be created without createdBy.');
    }

    // Clear ALL existing orders (orderId has unique index)
    console.log('\nClearing existing orders...');
    await Order.deleteMany({});

    // Transform orders with organizationId and internal steps
    const ordersToInsert = sampleOrders.map(order => ({
      ...order,
      organizationId: organization._id,
      createdBy: createdBy,
      internalSteps: generateInternalSteps(order.currentStage, order.orderType)
    }));

    // Insert orders
    console.log('\nInserting orders...');
    const insertedOrders = await Order.insertMany(ordersToInsert);
    console.log(`Successfully inserted ${insertedOrders.length} orders`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('ORDER SUMMARY BY STATUS');
    console.log('='.repeat(60));

    const statusSummary = {};
    insertedOrders.forEach(order => {
      statusSummary[order.status] = (statusSummary[order.status] || 0) + 1;
    });

    Object.entries(statusSummary).forEach(([status, count]) => {
      console.log(`  ${status.padEnd(20)} ${count} orders`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('ORDER SUMMARY BY STAGE');
    console.log('='.repeat(60));

    const stageSummary = {};
    insertedOrders.forEach(order => {
      stageSummary[order.currentStage] = (stageSummary[order.currentStage] || 0) + 1;
    });

    PRODUCTION_STAGES.forEach(stage => {
      const count = stageSummary[stage] || 0;
      console.log(`  ${stage.padEnd(25)} ${count} orders`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('ORDER SUMMARY BY TYPE');
    console.log('='.repeat(60));

    const typeSummary = { FM: 0, HM: 0 };
    insertedOrders.forEach(order => {
      typeSummary[order.orderType]++;
    });

    console.log(`  Factory Made (FM):    ${typeSummary.FM} orders`);
    console.log(`  Hand Made (HM):       ${typeSummary.HM} orders`);

    console.log('\n' + '='.repeat(60));
    console.log('TRACKING STATUS SUMMARY');
    console.log('='.repeat(60));

    const trackingSummary = {};
    insertedOrders.forEach(order => {
      trackingSummary[order.trackingStatus] = (trackingSummary[order.trackingStatus] || 0) + 1;
    });

    Object.entries(trackingSummary).forEach(([status, count]) => {
      console.log(`  ${status.padEnd(20)} ${count} orders`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('PRIORITY SUMMARY');
    console.log('='.repeat(60));

    const prioritySummary = {};
    insertedOrders.forEach(order => {
      prioritySummary[order.priority] = (prioritySummary[order.priority] || 0) + 1;
    });

    Object.entries(prioritySummary).forEach(([priority, count]) => {
      console.log(`  ${priority.padEnd(15)} ${count} orders`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('TOTAL VALUE');
    console.log('='.repeat(60));

    const totalValue = insertedOrders.reduce((sum, order) => sum + order.amount, 0);
    console.log(`  Total Order Value:    ₹${totalValue.toLocaleString('en-IN')}`);

    // Disconnect from database
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding orders:', error);
    process.exit(1);
  }
}

// Run seeder
seedOrders();