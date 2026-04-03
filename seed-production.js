/**
 * Production Module Seeder
 * Populates the database with sample production data for testing
 */

import mongoose from 'mongoose';
import ProductionWorkOrder from './src/models/ProductionWorkOrder.js';
import ProductionBatchOrder from './src/models/ProductionBatchOrder.js';
import ProductionArtisan from './src/models/ProductionArtisan.js';
import ProductionMaterial from './src/models/ProductionMaterial.js';
import ProductionQualityCheck from './src/models/ProductionQualityCheck.js';
import ProductionLine from './src/models/ProductionLine.js';
import ProductionMachine from './src/models/ProductionMachine.js';
import ProductionInventory from './src/models/ProductionInventory.js';
import Organization from './src/models/Organization.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

// ==================== ARTISANS DATA (HM) ====================
const artisansData = [
  {
    name: 'Ramesh Patel',
    skillCategory: 'Carpenter',
    skills: ['Carpentry', 'Assembly', 'Polishing'],
    specialization: 'Kitchen & Wardrobe',
    phone: '+91-9876543210',
    email: 'ramesh.patel@bestkitchen.com',
    status: 'Available',
    dailyRate: 1500,
    efficiency: 92,
    experience: 8,
    completedJobs: 45,
    activeWorkload: 72,
    location: 'Workshop A',
    notes: 'Expert carpenter specializing in modular kitchens'
  },
  {
    name: 'Suresh Kumar',
    skillCategory: 'Carpenter',
    skills: ['Furniture', 'Cutting', 'Assembly'],
    specialization: 'Bedroom & Living',
    phone: '+91-9876543211',
    email: 'suresh.kumar@bestkitchen.com',
    status: 'Available',
    dailyRate: 1400,
    efficiency: 88,
    experience: 6,
    completedJobs: 38,
    activeWorkload: 65,
    location: 'Workshop B',
    notes: 'Skilled in wardrobe and bedroom furniture'
  },
  {
    name: 'Mohan Singh',
    skillCategory: 'Carpenter',
    skills: ['Carpentry', 'Design', 'Polishing'],
    specialization: 'Study & Office',
    phone: '+91-9876543212',
    email: 'mohan.singh@bestkitchen.com',
    status: 'On Project',
    dailyRate: 1300,
    efficiency: 85,
    experience: 4,
    completedJobs: 22,
    activeWorkload: 30,
    location: 'Workshop A',
    notes: 'Good at study units and office furniture'
  },
  {
    name: 'Anil Verma',
    skillCategory: 'Carpenter',
    skills: ['Wood Work', 'Design', 'Assembly'],
    specialization: 'Dining & Living',
    phone: '+91-9876543213',
    email: 'anil.verma@bestkitchen.com',
    status: 'Available',
    dailyRate: 1600,
    efficiency: 90,
    experience: 10,
    completedJobs: 55,
    activeWorkload: 15,
    location: 'Workshop C',
    notes: 'Expert in dining tables and living room furniture'
  },
  {
    name: 'Deepak Sharma',
    skillCategory: 'Painter',
    skills: ['Polishing', 'Finishing', 'Painting'],
    specialization: 'Finishing Expert',
    phone: '+91-9876543214',
    email: 'deepak.sharma@bestkitchen.com',
    status: 'Available',
    dailyRate: 1200,
    efficiency: 87,
    experience: 5,
    completedJobs: 30,
    activeWorkload: 0,
    location: 'Workshop B',
    notes: 'Specialist in surface finishing and polishing'
  }
];

// ==================== WORK ORDERS DATA (HM) ====================
const workOrdersData = [
  {
    clientName: 'Rajesh Kumar',
    projectName: 'Modular Kitchen - L-Shaped',
    workOrderRef: 'WO-REF-001',
    orderType: 'HM',
    productType: 'Kitchen Cabinet Set',
    description: 'Full modular kitchen with overhead cabinets and island counter',
    dueDate: getDate(5),
    startDate: getDate(-17),
    priority: 'High',
    status: 'Active',
    currentStage: 'Assembly / Build',
    currentStageIndex: 5,
    completion: 62,
    completedStages: 4,
    estimatedCost: 185000,
    actualCost: 172000,
    labourCost: 68000,
    materialCost: 104000,
    clientPhone: '+91-9988776655',
    clientEmail: 'rajesh.kumar@email.com',
    clientAddress: 'A-402, Green Valley Apartments, Pune',
    stageData: {
      supervisor: { status: 'Completed', completedDate: getDate(-17), remarks: 'Assigned to Ramesh Patel' },
      workingTeam: { status: 'Completed', completedDate: getDate(-15), remarks: 'Team of 3 assigned' },
      purchase: { status: 'Completed', completedDate: getDate(-12), remarks: 'Materials ordered' },
      delivery: { status: 'Completed', completedDate: getDate(-10), remarks: 'All materials received' },
      startWork: { status: 'Completed', completedDate: getDate(-8), remarks: 'Work started' },
      stage: { status: 'Completed', completedDate: getDate(-5), remarks: 'Initial stage completed' },
      s1Structure: { status: 'In Progress', progress: 80, remarks: 'Structure work in progress' },
      s2Laminate: { status: 'Not Started', progress: 0 },
      s3Hardware: { status: 'Not Started', progress: 0 },
      qc: { status: 'Not Started' },
      remark: { status: 'Not Started' },
      handover: { status: 'Not Started' },
      clientSatisfaction: { status: 'Not Started' }
    },
    materialStatus: 'Ready',
    qcStatus: 'Pending',
    remarks: 'Urgent delivery - premium client'
  },
  {
    clientName: 'Priya Sharma',
    projectName: 'Bedroom Wardrobe - Sliding Door',
    workOrderRef: 'WO-REF-002',
    orderType: 'HM',
    productType: 'Wardrobe',
    description: '3-door sliding wardrobe with mirror finish',
    dueDate: getDate(8),
    startDate: getDate(-12),
    priority: 'Medium',
    status: 'Active',
    currentStage: 'Cutting / Preparation',
    currentStageIndex: 4,
    completion: 37,
    completedStages: 3,
    estimatedCost: 95000,
    actualCost: 72000,
    labourCost: 35000,
    materialCost: 37000,
    clientPhone: '+91-8877665544',
    clientEmail: 'priya.sharma@email.com',
    clientAddress: 'B-101, Royal Enclave, Mumbai',
    stageData: {
      supervisor: { status: 'Completed', completedDate: getDate(-12) },
      workingTeam: { status: 'Completed', completedDate: getDate(-10) },
      purchase: { status: 'Completed', completedDate: getDate(-8) },
      delivery: { status: 'In Progress', progress: 50 },
      startWork: { status: 'Not Started' },
      stage: { status: 'Not Started' },
      s1Structure: { status: 'Not Started', progress: 0 },
      s2Laminate: { status: 'Not Started', progress: 0 },
      s3Hardware: { status: 'Not Started', progress: 0 },
      qc: { status: 'Not Started' },
      remark: { status: 'Not Started' },
      handover: { status: 'Not Started' },
      clientSatisfaction: { status: 'Not Started' }
    },
    materialStatus: 'Partial',
    qcStatus: 'Pending',
    remarks: 'Client requested extra shelves'
  },
  {
    clientName: 'Amit Patel',
    projectName: 'Study Room Furniture Set',
    workOrderRef: 'WO-REF-003',
    orderType: 'HM',
    productType: 'Study Unit',
    description: 'Study table with bookshelf and filing cabinet',
    dueDate: getDate(-1),
    startDate: getDate(-26),
    priority: 'High',
    status: 'Delayed',
    currentStage: 'Material Ready',
    currentStageIndex: 3,
    completion: 25,
    completedStages: 2,
    estimatedCost: 75000,
    actualCost: 25000,
    labourCost: 12000,
    materialCost: 13000,
    clientPhone: '+91-7766554433',
    clientEmail: 'amit.patel@email.com',
    clientAddress: 'C-501, Sky Heights, Bangalore',
    stageData: {
      supervisor: { status: 'Completed', completedDate: getDate(-26) },
      workingTeam: { status: 'Completed', completedDate: getDate(-24) },
      purchase: { status: 'Delayed', remarks: 'Material shortage - plywood not available' },
      delivery: { status: 'Not Started' },
      startWork: { status: 'Not Started' },
      stage: { status: 'Not Started' },
      s1Structure: { status: 'Not Started', progress: 0 },
      s2Laminate: { status: 'Not Started', progress: 0 },
      s3Hardware: { status: 'Not Started', progress: 0 },
      qc: { status: 'Not Started' },
      remark: { status: 'Not Started' },
      handover: { status: 'Not Started' },
      clientSatisfaction: { status: 'Not Started' }
    },
    materialStatus: 'Missing',
    qcStatus: 'Pending',
    remarks: 'Material shortage - plywood not available'
  },
  {
    clientName: 'Sneha Desai',
    projectName: 'Living Room Entertainment Unit',
    workOrderRef: 'WO-REF-004',
    orderType: 'HM',
    productType: 'TV Unit',
    description: 'Wall-mounted TV unit with storage compartments',
    dueDate: getDate(2),
    startDate: getDate(-26),
    priority: 'Medium',
    status: 'Active',
    currentStage: 'Polishing / Finishing',
    currentStageIndex: 6,
    completion: 75,
    completedStages: 5,
    estimatedCost: 65000,
    actualCost: 58000,
    labourCost: 28000,
    materialCost: 30000,
    clientPhone: '+91-6655443322',
    clientEmail: 'sneha.desai@email.com',
    clientAddress: 'D-302, Lake View, Chennai',
    stageData: {
      supervisor: { status: 'Completed', completedDate: getDate(-26) },
      workingTeam: { status: 'Completed', completedDate: getDate(-24) },
      purchase: { status: 'Completed', completedDate: getDate(-20) },
      delivery: { status: 'Completed', completedDate: getDate(-18) },
      startWork: { status: 'Completed', completedDate: getDate(-15) },
      stage: { status: 'Completed', completedDate: getDate(-10) },
      s1Structure: { status: 'Completed', progress: 100, completedDate: getDate(-5) },
      s2Laminate: { status: 'In Progress', progress: 60 },
      s3Hardware: { status: 'Not Started', progress: 0 },
      qc: { status: 'Not Started' },
      remark: { status: 'Not Started' },
      handover: { status: 'Not Started' },
      clientSatisfaction: { status: 'Not Started' }
    },
    materialStatus: 'Ready',
    qcStatus: 'Pending',
    remarks: 'On track for delivery'
  },
  {
    clientName: 'Meera Joshi',
    projectName: 'Kitchen Cabinets - Wall Units',
    workOrderRef: 'WO-REF-005',
    orderType: 'HM',
    productType: 'Cabinets',
    description: 'Upper and lower kitchen cabinets',
    dueDate: getDate(-3),
    startDate: getDate(-39),
    priority: 'High',
    status: 'Completed',
    currentStage: 'Client Satisfaction %',
    currentStageIndex: 13,
    completion: 100,
    completedStages: 13,
    estimatedCost: 85000,
    actualCost: 82000,
    labourCost: 42000,
    materialCost: 40000,
    clientPhone: '+91-5544332211',
    clientEmail: 'meera.joshi@email.com',
    clientAddress: 'E-201, Green Park, Hyderabad',
    stageData: {
      supervisor: { status: 'Completed', completedDate: getDate(-39) },
      workingTeam: { status: 'Completed', completedDate: getDate(-37) },
      purchase: { status: 'Completed', completedDate: getDate(-33) },
      delivery: { status: 'Completed', completedDate: getDate(-30) },
      startWork: { status: 'Completed', completedDate: getDate(-27) },
      stage: { status: 'Completed', completedDate: getDate(-20) },
      s1Structure: { status: 'Completed', progress: 100, completedDate: getDate(-15) },
      s2Laminate: { status: 'Completed', progress: 100, completedDate: getDate(-10) },
      s3Hardware: { status: 'Completed', progress: 100, completedDate: getDate(-5) },
      qc: { status: 'Completed', completedDate: getDate(-4), qcStatus: 'Passed' },
      remark: { status: 'Completed', completedDate: getDate(-4) },
      handover: { status: 'Completed', completedDate: getDate(-3) },
      clientSatisfaction: { status: 'Completed', satisfactionPercentage: 95 }
    },
    materialStatus: 'Ready',
    qcStatus: 'Passed',
    completedDate: getDate(-3),
    remarks: 'Completed - ready for dispatch'
  }
];

// ==================== PRODUCTION LINES DATA (FM) ====================
const productionLinesData = [
  {
    name: 'Assembly Line A',
    type: 'Assembly',
    status: 'Running',
    capacity: 100,
    output: 85,
    operator: 'Rajesh Kumar',
    shift: 'Morning',
    workers: 8,
    location: 'Factory Floor A',
    notes: 'Primary assembly line'
  },
  {
    name: 'Assembly Line B',
    type: 'Assembly',
    status: 'Running',
    capacity: 100,
    output: 78,
    operator: 'Suresh Patel',
    shift: 'Morning',
    workers: 6,
    location: 'Factory Floor A',
    notes: 'Secondary assembly line'
  },
  {
    name: 'Cutting Line',
    type: 'Cutting',
    status: 'Running',
    capacity: 200,
    output: 190,
    operator: 'Mohan Singh',
    shift: 'Morning',
    workers: 4,
    location: 'Factory Floor B',
    notes: 'High precision cutting'
  },
  {
    name: 'Finishing Line',
    type: 'Finishing',
    status: 'Maintenance',
    capacity: 80,
    output: 0,
    operator: 'Anil Verma',
    shift: 'Morning',
    workers: 5,
    location: 'Factory Floor C',
    notes: 'Under scheduled maintenance'
  },
  {
    name: 'Edge Banding Line',
    type: 'Edge Banding',
    status: 'Running',
    capacity: 150,
    output: 128,
    operator: 'Deepak Sharma',
    shift: 'Evening',
    workers: 3,
    location: 'Factory Floor B',
    notes: 'Automated edge banding'
  }
];

// ==================== MACHINES DATA (FM) ====================
const machinesData = [
  {
    name: 'CNC Router Machine',
    type: 'Cutting',
    status: 'Running',
    efficiency: 94,
    temperature: 45,
    runtime: 720,
    powerConsumption: 15.5,
    speed: 100,
    operator: 'Ramesh Kumar',
    manufacturer: 'Biesse',
    model: 'Rover A',
    serialNumber: 'CNC-001-2023',
    location: 'Factory Floor A'
  },
  {
    name: 'Edge Banding Machine',
    type: 'Edge Banding',
    status: 'Running',
    efficiency: 90,
    temperature: 38,
    runtime: 720,
    powerConsumption: 8.2,
    speed: 85,
    operator: 'Suresh Patel',
    manufacturer: 'Homag',
    model: 'KFL 515',
    serialNumber: 'EB-002-2023',
    location: 'Factory Floor A'
  },
  {
    name: 'Drilling Machine',
    type: 'Drilling',
    status: 'Running',
    efficiency: 92,
    temperature: 32,
    runtime: 720,
    powerConsumption: 5.0,
    speed: 90,
    operator: 'Mohan Singh',
    manufacturer: 'Biesse',
    model: 'Skipper',
    serialNumber: 'DR-003-2023',
    location: 'Factory Floor A'
  },
  {
    name: 'Panel Saw',
    type: 'Cutting',
    status: 'Running',
    efficiency: 88,
    temperature: 40,
    runtime: 680,
    powerConsumption: 12.0,
    speed: 92,
    operator: 'Anil Verma',
    manufacturer: 'Altendorf',
    model: 'F45',
    serialNumber: 'PS-004-2023',
    location: 'Factory Floor B'
  },
  {
    name: 'Hot Press Machine',
    type: 'Pressing',
    status: 'Running',
    efficiency: 85,
    temperature: 120,
    runtime: 700,
    powerConsumption: 25.0,
    speed: 78,
    operator: 'Deepak Sharma',
    manufacturer: 'Dieffenbacher',
    model: 'CPS',
    serialNumber: 'HP-005-2023',
    location: 'Factory Floor B'
  },
  {
    name: 'Spray Booth',
    type: 'Finishing',
    status: 'Maintenance',
    efficiency: 0,
    temperature: 25,
    runtime: 0,
    powerConsumption: 0,
    speed: 0,
    operator: null,
    manufacturer: 'Spray Systems',
    model: 'PRO-2000',
    serialNumber: 'SB-006-2023',
    location: 'Factory Floor C',
    notes: 'Scheduled maintenance - filter replacement'
  },
  {
    name: 'UV Curing Machine',
    type: 'Finishing',
    status: 'Maintenance',
    efficiency: 0,
    temperature: 22,
    runtime: 0,
    powerConsumption: 0,
    speed: 0,
    operator: null,
    manufacturer: 'IST',
    model: 'UV-TECH',
    serialNumber: 'UV-007-2023',
    location: 'Factory Floor C',
    notes: 'Under maintenance with spray booth'
  }
];

// ==================== BATCH ORDERS DATA (FM) ====================
const batchOrdersData = [
  {
    clientName: 'HomeStyle Interiors',
    projectName: 'Batch Kitchen Cabinets - 50 Units',
    batchRef: 'BATCH-2026-001',
    orderType: 'FM',
    productType: 'Kitchen Cabinet Set',
    quantity: 50,
    completedUnits: 42,
    dueDate: getDate(5),
    startDate: getDate(-27),
    priority: 'High',
    status: 'In Progress',
    currentStage: 'Assembly',
    completion: 84,
    estimatedCost: 1250000,
    actualCost: 1050000,
    clientPhone: '+91-4433221100',
    clientEmail: 'homestyle@interiors.com',
    clientAddress: 'Commercial Complex, Pune',
    stageData: {
      materialReceived: { status: 'Completed', completedDate: getDate(-25) },
      preInstallation: { status: 'Completed', completedDate: getDate(-23) },
      vendorPurchase: { status: 'Completed', completedDate: getDate(-20) },
      hardwarePurchase: { status: 'Completed', completedDate: getDate(-18) },
      itPlanning: { status: 'Completed', completedDate: getDate(-15) },
      supervisor: { status: 'Completed', completedDate: getDate(-12) },
      measurementTeam: { status: 'Completed', completedDate: getDate(-10) },
      delivery: { status: 'Completed', completedDate: getDate(-8) },
      installationStart: { status: 'In Progress', progress: 80 },
      rework: { status: 'Not Started' },
      qualityCheck: { status: 'Not Started' },
      final: { status: 'Not Started' },
      handover: { status: 'Not Started' }
    },
    notes: 'Large batch order - priority client'
  },
  {
    clientName: 'Modern Living Co.',
    projectName: 'Wardrobe Panels Batch - 30 Units',
    batchRef: 'BATCH-2026-002',
    orderType: 'FM',
    productType: 'Wardrobe Panel',
    quantity: 30,
    completedUnits: 24,
    dueDate: getDate(8),
    startDate: getDate(-23),
    priority: 'Medium',
    status: 'In Progress',
    currentStage: 'Assembly',
    completion: 80,
    estimatedCost: 750000,
    actualCost: 600000,
    clientPhone: '+91-3322110099',
    clientEmail: 'orders@modernliving.com',
    clientAddress: 'Industrial Area, Mumbai',
    stageData: {
      materialReceived: { status: 'Completed', completedDate: getDate(-21) },
      preInstallation: { status: 'Completed', completedDate: getDate(-19) },
      vendorPurchase: { status: 'Completed', completedDate: getDate(-16) },
      hardwarePurchase: { status: 'Completed', completedDate: getDate(-14) },
      itPlanning: { status: 'Completed', completedDate: getDate(-12) },
      supervisor: { status: 'Completed', completedDate: getDate(-10) },
      measurementTeam: { status: 'Completed', completedDate: getDate(-8) },
      delivery: { status: 'Completed', completedDate: getDate(-6) },
      installationStart: { status: 'In Progress', progress: 70 },
      rework: { status: 'Not Started' },
      qualityCheck: { status: 'Not Started' },
      final: { status: 'Not Started' },
      handover: { status: 'Not Started' }
    },
    notes: 'Standard batch order'
  },
  {
    clientName: 'Furniture Hub',
    projectName: 'Plywood Cutting Batch',
    batchRef: 'BATCH-2026-003',
    orderType: 'FM',
    productType: 'Raw Material',
    quantity: 200,
    completedUnits: 190,
    dueDate: getDate(0),
    startDate: getDate(-18),
    priority: 'High',
    status: 'In Progress',
    currentStage: 'Cutting',
    completion: 95,
    estimatedCost: 500000,
    actualCost: 480000,
    clientPhone: '+91-2211009988',
    clientEmail: 'supply@furniturehub.com',
    clientAddress: 'Warehouse District, Delhi',
    stageData: {
      materialReceived: { status: 'Completed', completedDate: getDate(-17) },
      preInstallation: { status: 'Completed', completedDate: getDate(-15) },
      vendorPurchase: { status: 'Completed', completedDate: getDate(-12) },
      hardwarePurchase: { status: 'Completed', completedDate: getDate(-10) },
      itPlanning: { status: 'Completed', completedDate: getDate(-8) },
      supervisor: { status: 'Completed', completedDate: getDate(-6) },
      measurementTeam: { status: 'Completed', completedDate: getDate(-4) },
      delivery: { status: 'Completed', completedDate: getDate(-2) },
      installationStart: { status: 'In Progress', progress: 95 },
      rework: { status: 'Not Started' },
      qualityCheck: { status: 'Not Started' },
      final: { status: 'Not Started' },
      handover: { status: 'Not Started' }
    },
    notes: 'Bulk cutting order'
  },
  {
    clientName: 'Office Solutions',
    projectName: 'Office Desk Batch - 25 Units',
    batchRef: 'BATCH-2026-004',
    orderType: 'FM',
    productType: 'Office Desk',
    quantity: 25,
    completedUnits: 25,
    dueDate: getDate(-6),
    startDate: getDate(-30),
    priority: 'Medium',
    status: 'Completed',
    currentStage: 'Handover',
    completion: 100,
    estimatedCost: 375000,
    actualCost: 362000,
    clientPhone: '+91-1100998877',
    clientEmail: 'procurement@officesolutions.com',
    clientAddress: 'IT Park, Bangalore',
    stageData: {
      materialReceived: { status: 'Completed', completedDate: getDate(-28) },
      preInstallation: { status: 'Completed', completedDate: getDate(-25) },
      vendorPurchase: { status: 'Completed', completedDate: getDate(-22) },
      hardwarePurchase: { status: 'Completed', completedDate: getDate(-20) },
      itPlanning: { status: 'Completed', completedDate: getDate(-18) },
      supervisor: { status: 'Completed', completedDate: getDate(-15) },
      measurementTeam: { status: 'Completed', completedDate: getDate(-12) },
      delivery: { status: 'Completed', completedDate: getDate(-10) },
      installationStart: { status: 'Completed', completedDate: getDate(-8) },
      rework: { status: 'Completed', completedDate: getDate(-7) },
      qualityCheck: { status: 'Completed', completedDate: getDate(-6) },
      final: { status: 'Completed', completedDate: getDate(-6) },
      handover: { status: 'Completed', completedDate: getDate(-6) }
    },
    completedDate: getDate(-6),
    notes: 'Completed batch order'
  }
];

// ==================== MATERIALS DATA ====================
const materialsData = [
  {
    materialName: 'Plywood 18mm',
    materialRef: 'PLY-18MM',
    category: 'Raw Material',
    unit: 'sheets',
    requiredQty: 15,
    availableQty: 15,
    unitCost: 2500,
    totalCost: 37500,
    status: 'Ready',
    supplier: 'TimberMart',
    supplierContact: '+91-9876543220',
    qualityGrade: 'A',
    notes: 'Premium quality plywood'
  },
  {
    materialName: 'Hardware Fittings Set',
    materialRef: 'HW-SET',
    category: 'Hardware',
    unit: 'sets',
    requiredQty: 8,
    availableQty: 8,
    unitCost: 3500,
    totalCost: 28000,
    status: 'Ready',
    supplier: 'HardwareHub',
    supplierContact: '+91-9876543221',
    qualityGrade: 'A',
    notes: 'Complete hardware kit'
  },
  {
    materialName: 'Laminate Sheets',
    materialRef: 'LAM-SHT',
    category: 'Finish',
    unit: 'sheets',
    requiredQty: 20,
    availableQty: 20,
    unitCost: 850,
    totalCost: 17000,
    status: 'Ready',
    supplier: 'LaminateWorld',
    supplierContact: '+91-9876543222',
    qualityGrade: 'A',
    notes: 'High-gloss laminate'
  },
  {
    materialName: 'Sliding Door Hardware',
    materialRef: 'SLD-HW',
    category: 'Hardware',
    unit: 'sets',
    requiredQty: 2,
    availableQty: 1,
    unitCost: 5000,
    totalCost: 10000,
    status: 'Partial',
    supplier: 'HardwareHub',
    supplierContact: '+91-9876543221',
    qualityGrade: 'A',
    notes: 'Premium sliding mechanism'
  },
  {
    materialName: 'Solid Wood - Teak',
    materialRef: 'WD-TEAK',
    category: 'Raw Material',
    unit: 'cubic ft',
    requiredQty: 25,
    availableQty: 0,
    unitCost: 3200,
    totalCost: 80000,
    status: 'Ordered',
    supplier: 'WoodWorld',
    supplierContact: '+91-9876543224',
    qualityGrade: 'A',
    notes: 'Premium teak wood - ordered'
  }
];

// ==================== QUALITY CHECKS DATA ====================
const qualityChecksData = [
  {
    qcType: 'Work Order',
    workOrderRef: 'WO-REF-005',
    status: 'Passed',
    overallScore: 100,
    inspector: 'Rajesh QC',
    inspectionDate: getDate(-4),
    approvedBy: 'Manager Sharma',
    approvalDate: getDate(-4),
    checklist: [
      { item: 'Dimension Accuracy', status: 'Pass', notes: 'Within tolerance ±2mm' },
      { item: 'Surface Finish', status: 'Pass', notes: 'Smooth finish, no scratches' },
      { item: 'Joint Strength', status: 'Pass', notes: 'All joints secure' },
      { item: 'Hardware Fitting', status: 'Pass', notes: 'All hinges properly installed' },
      { item: 'Visual Inspection', status: 'Pass', notes: 'No visible defects' }
    ],
    notes: 'Excellent quality. Ready for dispatch.'
  },
  {
    qcType: 'Batch Order',
    batchOrderRef: 'BATCH-2026-001',
    status: 'In Progress',
    overallScore: 95,
    inspector: 'Rajesh QC',
    inspectionDate: getDate(0),
    checklist: [
      { item: 'Assembly Check', status: 'Pass', notes: 'All parts assembled correctly' },
      { item: 'Surface Preparation', status: 'Pass', notes: 'Surface ready for finishing' },
      { item: 'Dimensional Check', status: 'Pending', notes: 'Checking dimensions' }
    ],
    notes: 'Batch QC in progress'
  },
  {
    qcType: 'Work Order',
    workOrderRef: 'WO-REF-003',
    status: 'Pending',
    inspector: null,
    checklist: [
      { item: 'Material Quality', status: 'Pending', notes: 'Awaiting material' },
      { item: 'Dimension Verification', status: 'Pending', notes: '' }
    ],
    issues: [{ description: 'Material shortage - plywood not available', severity: 'High' }],
    notes: 'QC pending due to material delay'
  }
];

// ==================== INVENTORY DATA ====================
const inventoryData = [
  {
    itemName: 'Plywood 18mm',
    sku: 'PLY-18MM',
    category: 'Raw Material',
    unit: 'sheets',
    currentStock: 85,
    minStock: 50,
    maxStock: 200,
    reorderLevel: 60,
    unitCost: 2500,
    location: 'Warehouse A - Rack 1-5',
    supplier: 'TimberMart',
    supplierContact: '+91-9876543220',
    qualityGrade: 'A'
  },
  {
    itemName: 'Plywood 12mm',
    sku: 'PLY-12MM',
    category: 'Raw Material',
    unit: 'sheets',
    currentStock: 42,
    minStock: 30,
    maxStock: 100,
    reorderLevel: 40,
    unitCost: 1800,
    location: 'Warehouse A - Rack 6-8',
    supplier: 'BoardSupply',
    supplierContact: '+91-9876543225',
    qualityGrade: 'A'
  },
  {
    itemName: 'MDF Board 18mm',
    sku: 'MDF-18MM',
    category: 'Raw Material',
    unit: 'sheets',
    currentStock: 120,
    minStock: 40,
    maxStock: 150,
    reorderLevel: 50,
    unitCost: 2200,
    location: 'Warehouse A - Rack 9-12',
    supplier: 'BoardSupply',
    supplierContact: '+91-9876543225',
    qualityGrade: 'A'
  },
  {
    itemName: 'Hardware Fittings Set',
    sku: 'HW-SET',
    category: 'Hardware',
    unit: 'sets',
    currentStock: 25,
    minStock: 20,
    maxStock: 100,
    reorderLevel: 25,
    unitCost: 3500,
    location: 'Warehouse B - Rack 1',
    supplier: 'HardwareHub',
    supplierContact: '+91-9876543221',
    qualityGrade: 'A'
  },
  {
    itemName: 'Laminate Sheets',
    sku: 'LAM-SHT',
    category: 'Finish',
    unit: 'sheets',
    currentStock: 180,
    minStock: 50,
    maxStock: 300,
    reorderLevel: 75,
    unitCost: 850,
    location: 'Warehouse A - Rack 13-15',
    supplier: 'LaminateWorld',
    supplierContact: '+91-9876543222',
    qualityGrade: 'A'
  },
  {
    itemName: 'Edge Banding Tape',
    sku: 'EB-TAPE',
    category: 'Consumable',
    unit: 'rolls',
    currentStock: 15,
    minStock: 20,
    maxStock: 50,
    reorderLevel: 20,
    unitCost: 500,
    location: 'Warehouse B - Rack 2',
    supplier: 'HardwareHub',
    supplierContact: '+91-9876543221',
    qualityGrade: 'A'
  },
  {
    itemName: 'Solid Wood - Teak',
    sku: 'WD-TEAK',
    category: 'Raw Material',
    unit: 'cubic ft',
    currentStock: 8,
    minStock: 30,
    maxStock: 100,
    reorderLevel: 35,
    unitCost: 3200,
    location: 'Warehouse C - Rack 1',
    supplier: 'WoodWorld',
    supplierContact: '+91-9876543224',
    qualityGrade: 'A'
  },
  {
    itemName: 'Screws & Fasteners',
    sku: 'SCR-FAST',
    category: 'Hardware',
    unit: 'boxes',
    currentStock: 150,
    minStock: 50,
    maxStock: 200,
    reorderLevel: 60,
    unitCost: 450,
    location: 'Warehouse B - Rack 3',
    supplier: 'HardwareHub',
    supplierContact: '+91-9876543221',
    qualityGrade: 'A'
  }
];

async function seedProduction() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://yuva99:yuvaninenine@yuva99.rzz98mq.mongodb.net/hrms_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.name}`);

    // Use the specific organization ID from the logged-in user
    const ORGANIZATION_ID = '69ce659461390b679fd80ecc';

    // Find the organization
    const organization = await Organization.findById(ORGANIZATION_ID);
    if (!organization) {
      console.error(`Organization with ID ${ORGANIZATION_ID} not found.`);
      process.exit(1);
    }

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@bestkitchenette.com' });
    const createdBy = adminUser ? adminUser._id : null;

    if (!adminUser) {
      console.error('Admin user not found. Please check the email.');
    }

    console.log(`Using organization: ${organization.name} (${organization._id})`);
    console.log(`Admin user: ${adminUser?.email || 'None found'} (${adminUser?._id || 'N/A'})`);

    // Clear ALL production data (not just by organization, to avoid duplicate key errors)
    console.log('Clearing ALL production data...');
    await Promise.all([
      ProductionWorkOrder.deleteMany({}),
      ProductionBatchOrder.deleteMany({}),
      ProductionArtisan.deleteMany({}),
      ProductionMaterial.deleteMany({}),
      ProductionQualityCheck.deleteMany({}),
      ProductionLine.deleteMany({}),
      ProductionMachine.deleteMany({}),
      ProductionInventory.deleteMany({})
    ]);

    // Seed Artisans (using save to trigger pre-save hooks)
    console.log('Seeding artisans...');
    const artisans = [];
    for (const artisanData of artisansData) {
      const artisan = new ProductionArtisan({
        ...artisanData,
        organizationId: organization._id,
        createdBy
      });
      await artisan.save();
      artisans.push(artisan);
    }
    console.log(`Inserted ${artisans.length} artisans`);

    // Seed Production Lines
    console.log('Seeding production lines...');
    const productionLines = [];
    for (const lineData of productionLinesData) {
      const line = new ProductionLine({
        ...lineData,
        organizationId: organization._id,
        createdBy
      });
      await line.save();
      productionLines.push(line);
    }
    console.log(`Inserted ${productionLines.length} production lines`);

    // Seed Machines (link to production lines)
    console.log('Seeding machines...');
    const machines = [];
    for (let i = 0; i < machinesData.length; i++) {
      const m = machinesData[i];
      const machine = new ProductionMachine({
        ...m,
        organizationId: organization._id,
        createdBy,
        line: i < 3 ? productionLines[0]._id : i < 5 ? productionLines[1]._id : productionLines[2]._id
      });
      await machine.save();
      machines.push(machine);
    }
    console.log(`Inserted ${machines.length} machines`);

    // Seed Work Orders (link to artisans)
    console.log('Seeding work orders...');
    const workOrders = [];
    for (let i = 0; i < workOrdersData.length; i++) {
      const wo = workOrdersData[i];
      const workOrder = new ProductionWorkOrder({
        ...wo,
        organizationId: organization._id,
        createdBy,
        assignedArtisan: artisans[i % artisans.length]._id
      });
      await workOrder.save();
      workOrders.push(workOrder);
    }
    console.log(`Inserted ${workOrders.length} work orders`);

    // Seed Batch Orders (link to production lines)
    console.log('Seeding batch orders...');
    const batchOrders = [];
    for (let i = 0; i < batchOrdersData.length; i++) {
      const bo = batchOrdersData[i];
      const batchOrder = new ProductionBatchOrder({
        ...bo,
        organizationId: organization._id,
        createdBy,
        productionLine: productionLines[i % productionLines.length]._id
      });
      await batchOrder.save();
      batchOrders.push(batchOrder);
    }
    console.log(`Inserted ${batchOrders.length} batch orders`);

    // Seed Materials
    console.log('Seeding materials...');
    const materials = [];
    for (const materialData of materialsData) {
      const material = new ProductionMaterial({
        ...materialData,
        organizationId: organization._id,
        createdBy,
        workOrderId: workOrders[Math.floor(Math.random() * workOrders.length)]._id
      });
      await material.save();
      materials.push(material);
    }
    console.log(`Inserted ${materials.length} materials`);

    // Seed Quality Checks
    console.log('Seeding quality checks...');
    const qualityChecks = [];
    for (let i = 0; i < qualityChecksData.length; i++) {
      const qcData = qualityChecksData[i];
      const qc = new ProductionQualityCheck({
        ...qcData,
        organizationId: organization._id,
        createdBy,
        workOrderId: i === 0 || i === 2 ? workOrders[Math.floor(Math.random() * workOrders.length)]._id : null,
        batchOrderId: i === 1 ? batchOrders[Math.floor(Math.random() * batchOrders.length)]._id : null
      });
      await qc.save();
      qualityChecks.push(qc);
    }
    console.log(`Inserted ${qualityChecks.length} quality checks`);

    // Seed Inventory
    console.log('Seeding inventory...');
    const inventory = [];
    for (const invData of inventoryData) {
      const inv = new ProductionInventory({
        ...invData,
        organizationId: organization._id,
        createdBy
      });
      await inv.save();
      inventory.push(inv);
    }
    console.log(`Inserted ${inventory.length} inventory items`);

    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('PRODUCTION MODULE SEED SUMMARY');
    console.log('='.repeat(60));

    console.log('\nHM (Hand Made) Module:');
    console.log(`  Artisans:        ${artisans.length}`);
    console.log(`  Work Orders:     ${workOrders.length}`);
    console.log(`  Active:          ${workOrders.filter(w => w.status === 'Active').length}`);
    console.log(`  Completed:       ${workOrders.filter(w => w.status === 'Completed').length}`);
    console.log(`  Delayed:         ${workOrders.filter(w => w.status === 'Delayed').length}`);

    console.log('\nFM (Factory Made) Module:');
    console.log(`  Production Lines: ${productionLines.length}`);
    console.log(`  Machines:        ${machines.length}`);
    console.log(`  Batch Orders:    ${batchOrders.length}`);
    console.log(`  Running:         ${machines.filter(m => m.status === 'Running').length}`);
    console.log(`  Maintenance:     ${machines.filter(m => m.status === 'Maintenance').length}`);

    console.log('\nCommon:');
    console.log(`  Materials:       ${materials.length}`);
    console.log(`  Quality Checks:  ${qualityChecks.length}`);
    console.log(`  Inventory:       ${inventory.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('SEED COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding production data:', error);
    process.exit(1);
  }
}

seedProduction();