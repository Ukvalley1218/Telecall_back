import 'dotenv/config';
import mongoose from 'mongoose';
import Organization from './src/models/Organization.js';
import User from './src/models/User.js';
import Employee from './src/models/Employee.js';
import Campaign from './src/models/Campaign.js';
import MarketingLead from './src/models/MarketingLead.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const clearMarketingData = async () => {
  console.log('Clearing marketing data...');
  await Campaign.deleteMany({});
  await MarketingLead.deleteMany({});
  console.log('Marketing data cleared');
};

const seedMarketingData = async () => {
  console.log('\n=== Seeding Marketing Data ===\n');

  // Get organization
  const organization = await Organization.findOne({ domain: 'bestkitchen' });
  if (!organization) {
    console.error('Organization not found. Please run main seed first.');
    process.exit(1);
  }

  // Get admin user for createdBy
  const adminUser = await User.findOne({ email: 'admin@bestkitchen.com' });
  if (!adminUser) {
    console.error('Admin user not found. Please run main seed first.');
    process.exit(1);
  }

  // Get some employees for assignment
  const employees = await Employee.find({ organizationId: organization._id }).limit(5);

  // ==================== CAMPAIGNS ====================
  console.log('Creating campaigns...');
  const campaigns = [];

  const campaignData = [
    // Online Campaigns
    {
      name: 'Instagram Summer Sale',
      type: 'online',
      channel: 'Instagram',
      status: 'active',
      description: 'Instagram carousel and story ads for summer collection',
      startDate: new Date(2026, 0, 15),
      endDate: new Date(2026, 2, 15),
      budget: 80000,
      spent: 62000,
      location: 'Instagram Platform',
      vendor: 'In-House Team',
      trackingMethod: 'UTM Parameters',
      leads: { total: 234, qualified: 180, converted: 45 },
      roi: 185,
      conversionRate: 19.2,
      costPerLead: 265,
      targetAudience: '25-40 years, Urban',
      targetLocation: 'Mumbai, Delhi, Bangalore'
    },
    {
      name: 'Google Ads - Product Launch',
      type: 'online',
      channel: 'Search Ads',
      status: 'active',
      description: 'Google search and display network campaigns',
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 2, 31),
      budget: 100000,
      spent: 78000,
      location: 'Google Search Network',
      vendor: 'Digital Agency',
      trackingMethod: 'Google Analytics',
      leads: { total: 312, qualified: 245, converted: 78 },
      roi: 210,
      conversionRate: 25,
      costPerLead: 250,
      targetAudience: 'Home owners, 30-50 years',
      targetLocation: 'Pan India'
    },
    {
      name: 'Facebook Retargeting Q1',
      type: 'online',
      channel: 'Social Media Ads',
      status: 'active',
      description: 'Facebook retargeting for website visitors',
      startDate: new Date(2026, 1, 1),
      endDate: new Date(2026, 3, 30),
      budget: 45000,
      spent: 32000,
      location: 'Facebook & Instagram',
      vendor: 'In-House Team',
      trackingMethod: 'Facebook Pixel',
      leads: { total: 178, qualified: 142, converted: 36 },
      roi: 165,
      conversionRate: 20.2,
      costPerLead: 180,
      targetAudience: 'Previous website visitors',
      targetLocation: 'Metro cities'
    },
    {
      name: 'YouTube Pre-roll Campaign',
      type: 'online',
      channel: 'Video Ads',
      status: 'active',
      description: 'YouTube pre-roll video advertisements',
      startDate: new Date(2026, 1, 15),
      endDate: new Date(2026, 4, 15),
      budget: 60000,
      spent: 48000,
      location: 'YouTube',
      vendor: 'Video Marketing Co',
      trackingMethod: 'YouTube Analytics',
      leads: { total: 267, qualified: 198, converted: 52 },
      roi: 195,
      conversionRate: 19.5,
      costPerLead: 180,
      targetAudience: 'Home improvement enthusiasts',
      targetLocation: 'Tier 1 cities'
    },
    {
      name: 'LinkedIn B2B Outreach',
      type: 'online',
      channel: 'LinkedIn Ads',
      status: 'active',
      description: 'LinkedIn sponsored content for B2B leads',
      startDate: new Date(2026, 2, 1),
      endDate: new Date(2026, 4, 31),
      budget: 55000,
      spent: 22000,
      location: 'LinkedIn Platform',
      vendor: 'In-House Team',
      trackingMethod: 'LinkedIn Campaign Manager',
      leads: { total: 89, qualified: 72, converted: 18 },
      roi: 145,
      conversionRate: 20.2,
      costPerLead: 247,
      targetAudience: 'Interior designers, Contractors',
      targetLocation: 'Pan India'
    },

    // Offline Campaigns
    {
      name: 'Billboard - MG Road',
      type: 'offline',
      channel: 'Outdoor Advertising',
      status: 'active',
      description: 'High visibility billboard on MG Road',
      startDate: new Date(2026, 0, 15),
      endDate: new Date(2026, 2, 15),
      budget: 50000,
      spent: 45000,
      location: 'MG Road, Bangalore',
      vendor: 'Outdoor Media Ltd',
      trackingMethod: 'QR Code + Landing Page',
      leads: { total: 89, qualified: 67, converted: 12 },
      roi: 125,
      conversionRate: 13.5,
      costPerLead: 505,
      targetAudience: 'General public',
      targetLocation: 'Bangalore'
    },
    {
      name: 'Tech Conference Booth',
      type: 'offline',
      channel: 'Event Marketing',
      status: 'completed',
      description: 'Exhibition booth at annual tech conference',
      startDate: new Date(2026, 1, 10),
      endDate: new Date(2026, 1, 12),
      budget: 120000,
      spent: 118000,
      location: 'Convention Center, Bangalore',
      vendor: 'EventPro Services',
      trackingMethod: 'Badge Scanner',
      leads: { total: 145, qualified: 120, converted: 28 },
      roi: 95,
      conversionRate: 19.3,
      costPerLead: 814,
      targetAudience: 'Tech professionals',
      targetLocation: 'Bangalore'
    },
    {
      name: 'Bus Branding - Route 101',
      type: 'offline',
      channel: 'Transit Advertising',
      status: 'active',
      description: 'Bus exterior branding for city route',
      startDate: new Date(2026, 0, 20),
      endDate: new Date(2026, 3, 20),
      budget: 35000,
      spent: 35000,
      location: 'Route 101 - City Center',
      vendor: 'TransitAds Inc',
      trackingMethod: 'Dedicated Phone Number',
      leads: { total: 56, qualified: 42, converted: 8 },
      roi: 78,
      conversionRate: 14.3,
      costPerLead: 625,
      targetAudience: 'Daily commuters',
      targetLocation: 'Mumbai'
    },
    {
      name: 'Radio FM Campaign',
      type: 'offline',
      channel: 'Radio Advertising',
      status: 'completed',
      description: 'Radio jingle and spot advertisements',
      startDate: new Date(2025, 11, 1),
      endDate: new Date(2025, 11, 31),
      budget: 75000,
      spent: 72000,
      location: 'Radio Mirchi 98.3 FM',
      vendor: 'RadioMax Media',
      trackingMethod: 'Promo Code',
      leads: { total: 98, qualified: 75, converted: 15 },
      roi: 88,
      conversionRate: 15.3,
      costPerLead: 735,
      targetAudience: 'Car owners',
      targetLocation: 'Delhi NCR'
    },
    {
      name: 'Newspaper Ad - Times',
      type: 'offline',
      channel: 'Print Media',
      status: 'active',
      description: 'Full page advertisement in Times of India',
      startDate: new Date(2026, 2, 1),
      endDate: new Date(2026, 2, 31),
      budget: 40000,
      spent: 25000,
      location: 'Times of India',
      vendor: 'PrintMedia Corp',
      trackingMethod: 'Coupon Code',
      leads: { total: 42, qualified: 32, converted: 6 },
      roi: 110,
      conversionRate: 14.3,
      costPerLead: 595,
      targetAudience: 'Business owners',
      targetLocation: 'Mumbai'
    },
    {
      name: 'Home Expo Stall',
      type: 'offline',
      channel: 'Event Marketing',
      status: 'active',
      description: 'Stall at Home & Interior Expo',
      startDate: new Date(2026, 2, 10),
      endDate: new Date(2026, 2, 14),
      budget: 80000,
      spent: 65000,
      location: 'Expo Center, Delhi',
      vendor: 'ExpoIndia Pvt Ltd',
      trackingMethod: 'Lead Form + QR Code',
      leads: { total: 156, qualified: 128, converted: 35 },
      roi: 175,
      conversionRate: 22.4,
      costPerLead: 417,
      targetAudience: 'Home owners, Interior enthusiasts',
      targetLocation: 'Delhi NCR'
    }
  ];

  for (const data of campaignData) {
    const campaign = new Campaign({
      organizationId: organization._id,
      ...data,
      createdBy: adminUser._id,
      assignedTo: employees.length > 0 ? employees[Math.floor(Math.random() * employees.length)]._id : null
    });
    await campaign.save();
    campaigns.push(campaign);
  }
  console.log('✓ Campaigns created:', campaigns.length);

  // ==================== MARKETING LEADS ====================
  console.log('Creating marketing leads...');
  const leads = [];

  const leadSources = ['online', 'offline', 'referral', 'organic', 'paid', 'social', 'email'];
  const leadStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'];
  const priorities = ['low', 'medium', 'high', 'hot'];
  const indianFirstNames = ['Rahul', 'Priya', 'Amit', 'Neha', 'Rajesh', 'Sneha', 'Vikram', 'Anita', 'Suresh', 'Kavita', 'Mohan', 'Pooja', 'Anil', 'Meena', 'Ravi', 'Deepa', 'Sanjay', 'Ritu', 'Manoj', 'Sunita'];
  const indianLastNames = ['Sharma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Verma', 'Joshi', 'Agarwal', 'Mehta', 'Shah', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Rao', 'Desai', 'Kulkarni', 'Bhat', 'Chopra', 'Malhotra'];
  const indianCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];

  // Generate 150 leads with various sources
  for (let i = 0; i < 150; i++) {
    const source = leadSources[Math.floor(Math.random() * leadSources.length)];
    const status = leadStatuses[Math.floor(Math.random() * leadStatuses.length)];
    const isConverted = status === 'converted';

    const firstName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)];
    const lastName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)];

    const lead = new MarketingLead({
      organizationId: organization._id,
      campaignId: campaigns[Math.floor(Math.random() * campaigns.length)]._id,
      source: source,
      sourceDetail: source === 'online' ? 'Website Form' : source === 'offline' ? 'Event' : source === 'social' ? 'Instagram' : source === 'paid' ? 'Google Ads' : 'N/A',
      name: {
        first: firstName,
        last: lastName
      },
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@gmail.com`,
      phone: `+91-9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
      status: status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      score: Math.floor(Math.random() * 100),
      interest: {
        product: ['Modular Kitchen', 'Wardrobe', 'Living Room', 'Bedroom', 'Office'][Math.floor(Math.random() * 5)],
        budget: ['50K-1L', '1L-3L', '3L-5L', '5L-10L', '10L+'][Math.floor(Math.random() * 5)],
        timeline: ['Immediate', '1-3 months', '3-6 months', '6+ months'][Math.floor(Math.random() * 4)],
        notes: 'Interested in modern design'
      },
      utm: source === 'online' || source === 'paid' || source === 'social' ? {
        source: source,
        medium: 'cpc',
        campaign: campaigns[Math.floor(Math.random() * campaigns.length)].name.toLowerCase().replace(/\s+/g, '_'),
        content: 'banner_ad',
        term: 'kitchen_design'
      } : undefined,
      assignedTo: employees.length > 0 ? employees[Math.floor(Math.random() * employees.length)]._id : null,
      conversion: isConverted ? {
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 500000) + 100000,
        notes: 'Converted to customer'
      } : undefined,
      lastContactDate: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
      nextFollowUp: status !== 'converted' && status !== 'lost' ? new Date(Date.now() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000) : null,
      isConverted: isConverted,
      createdBy: adminUser._id,
      tags: [['hot-lead', 'follow-up', 'new', 'priority'][Math.floor(Math.random() * 4)]],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
    });

    await lead.save();
    leads.push(lead);
  }

  console.log('✓ Marketing leads created:', leads.length);

  // ==================== UPDATE CAMPAIGN LEAD COUNTS ====================
  console.log('Updating campaign lead counts...');

  for (const campaign of campaigns) {
    const campaignLeads = leads.filter(l => l.campaignId.toString() === campaign._id.toString());
    const total = campaignLeads.length;
    const qualified = campaignLeads.filter(l => ['qualified', 'proposal', 'negotiation', 'converted'].includes(l.status)).length;
    const converted = campaignLeads.filter(l => l.isConverted).length;

    campaign.leads = { total, qualified, converted };
    campaign.conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    await campaign.save();
  }

  console.log('✓ Campaign lead counts updated');

  // ==================== SUMMARY ====================
  console.log('\n=== Marketing Data Seeding Complete ===\n');
  console.log('Summary:');
  console.log('--------');
  console.log('Organization:', organization.name);
  console.log('Campaigns:', campaigns.length);
  console.log('  - Online:', campaigns.filter(c => c.type === 'online').length);
  console.log('  - Offline:', campaigns.filter(c => c.type === 'offline').length);
  console.log('  - Active:', campaigns.filter(c => c.status === 'active').length);
  console.log('  - Completed:', campaigns.filter(c => c.status === 'completed').length);
  console.log('Marketing Leads:', leads.length);
  console.log('  - By Source:');
  console.log('    - Online:', leads.filter(l => ['online', 'social', 'email', 'paid', 'organic'].includes(l.source)).length);
  console.log('    - Offline:', leads.filter(l => ['offline', 'referral'].includes(l.source)).length);
  console.log('  - Converted:', leads.filter(l => l.isConverted).length);
  console.log('  - New:', leads.filter(l => l.status === 'new').length);
  console.log('  - Qualified:', leads.filter(l => l.status === 'qualified').length);

  return { campaigns, leads };
};

const runSeed = async () => {
  try {
    await connectDB();
    await clearMarketingData();
    await seedMarketingData();

    console.log('\n✅ Marketing seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Marketing seed error:', error);
    process.exit(1);
  }
};

runSeed();