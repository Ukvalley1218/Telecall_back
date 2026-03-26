import mongoose from 'mongoose';

const marketingToolSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  // Tool identification
  toolId: {
    type: String,
    required: [true, 'Tool ID is required'],
    enum: ['instagram', 'facebook', 'google_ads', 'youtube', 'linkedin', 'hubspot', 'zapier', 'mailchimp', 'whatsapp', 'twitter']
  },
  name: {
    type: String,
    required: [true, 'Tool name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Tool type is required'],
    enum: ['Social Media', 'Advertising', 'Video Platform', 'CRM', 'Automation', 'Email Marketing', 'Messaging']
  },
  icon: {
    type: String,
    default: '🔗'
  },
  color: {
    type: String,
    default: '#FF1E1E'
  },
  // Connection status
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'pending', 'error'],
    default: 'disconnected'
  },
  // Connection details
  connectionDetails: {
    accessToken: {
      type: String,
      select: false // Don't include by default for security
    },
    refreshToken: {
      type: String,
      select: false
    },
    accountId: String,
    accountName: String,
    expiresAt: Date,
    scopes: [String],
    lastSync: Date,
    syncFrequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily', 'manual'],
      default: 'daily'
    }
  },
  // Credentials (encrypted)
  credentials: {
    apiKey: {
      type: String,
      select: false
    },
    apiSecret: {
      type: String,
      select: false
    },
    webhookUrl: String,
    webhookSecret: {
      type: String,
      select: false
    }
  },
  // Lead tracking
  leadsCount: {
    total: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    today: { type: Number, default: 0 }
  },
  // Features available for this tool
  features: [{
    name: String,
    enabled: { type: Boolean, default: true }
  }],
  // Configuration
  config: {
    autoImport: { type: Boolean, default: true },
    autoTag: { type: Boolean, default: false },
    defaultTags: [String],
    defaultSource: String,
    notifyOnNewLead: { type: Boolean, default: true }
  },
  // Statistics
  stats: {
    totalLeadsImported: { type: Number, default: 0 },
    lastImportAt: Date,
    errorCount: { type: Number, default: 0 },
    lastError: String,
    lastErrorAt: Date
  },
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastChecked: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
marketingToolSchema.index({ organizationId: 1, toolId: 1 }, { unique: true });
marketingToolSchema.index({ organizationId: 1, status: 1 });

// Virtual for connection status display
marketingToolSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    connected: 'Connected',
    disconnected: 'Not Connected',
    pending: 'Pending',
    error: 'Error'
  };
  return statusMap[this.status] || this.status;
});

// Static method to get default tools
marketingToolSchema.statics.getDefaultTools = function() {
  return [
    { toolId: 'instagram', name: 'Instagram Business', type: 'Social Media', icon: '📷', color: '#E1306C', features: ['Stories', 'Feed Posts', 'Reels', 'DM Automation'] },
    { toolId: 'facebook', name: 'Facebook Ads Manager', type: 'Advertising', icon: '📘', color: '#1877F2', features: ['Lead Forms', 'Retargeting', 'Custom Audiences'] },
    { toolId: 'google_ads', name: 'Google Ads', type: 'Advertising', icon: '🔍', color: '#4285F4', features: ['Search Ads', 'Display Ads', 'YouTube Ads'] },
    { toolId: 'youtube', name: 'YouTube Studio', type: 'Video Platform', icon: '▶️', color: '#FF0000', features: ['Pre-roll Ads', 'Video Analytics', 'Channel Insights'] },
    { toolId: 'linkedin', name: 'LinkedIn Campaigns', type: 'Social Media', icon: '💼', color: '#0A66C2', features: ['Lead Gen Forms', 'InMail Campaigns', 'Company Page'] },
    { toolId: 'hubspot', name: 'HubSpot CRM', type: 'CRM', icon: '🧡', color: '#FF7A59', features: ['Contact Management', 'Lead Scoring', 'Email Tracking'] },
    { toolId: 'zapier', name: 'Zapier', type: 'Automation', icon: '⚡', color: '#FF4A00', features: ['Workflow Automation', 'App Integrations', 'Lead Routing'] },
    { toolId: 'mailchimp', name: 'Mailchimp', type: 'Email Marketing', icon: '📧', color: '#FFE01B', features: ['Email Campaigns', 'Automation', 'Audience Management'] },
    { toolId: 'whatsapp', name: 'WhatsApp Business', type: 'Messaging', icon: '💬', color: '#25D366', features: ['Broadcast Messages', 'Quick Replies', 'Labels'] },
    { toolId: 'twitter', name: 'Twitter/X Ads', type: 'Social Media', icon: '🐦', color: '#1DA1F2', features: ['Promoted Tweets', 'Lead Generation Cards', 'Analytics'] }
  ];
};

// Static method to get connected tools with lead stats
marketingToolSchema.statics.getConnectedToolsWithStats = async function(organizationId) {
  const tools = await this.find({
    organizationId: new mongoose.Types.ObjectId(organizationId),
    status: 'connected',
    isActive: true
  }).sort({ name: 1 });

  return tools.map(tool => ({
    _id: tool._id,
    toolId: tool.toolId,
    name: tool.name,
    type: tool.type,
    icon: tool.icon,
    color: tool.color,
    status: tool.status,
    leads: tool.leadsCount.total,
    thisMonth: tool.leadsCount.thisMonth,
    lastSync: tool.connectionDetails.lastSync,
    features: tool.features.filter(f => f.enabled).map(f => f.name)
  }));
};

const MarketingTool = mongoose.model('MarketingTool', marketingToolSchema);

export default MarketingTool;