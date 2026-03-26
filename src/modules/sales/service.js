import SalesLead from '../../models/SalesLead.js';
import ClientMilestone from '../../models/ClientMilestone.js';
import Quotation from '../../models/Quotation.js';
import mongoose from 'mongoose';

class SalesService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(organizationId, filters = {}) {
    const { startDate, endDate, department } = filters;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get all leads for the organization
    const leads = await SalesLead.find({
      organizationId,
      ...dateFilter
    });

    // Calculate statistics
    const totalRevenue = leads
      .filter(l => l.stage === 'Deal Won')
      .reduce((sum, l) => sum + (l.value || 0), 0);

    const activeLeads = leads.filter(l =>
      !['Deal Won', 'Deal Lost'].includes(l.stage) && l.status === 'active'
    ).length;

    const wonDeals = leads.filter(l => l.stage === 'Deal Won').length;
    const lostDeals = leads.filter(l => l.stage === 'Deal Lost').length;

    const conversionRate = leads.length > 0
      ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) || 0
      : 0;

    // Get leads by stage
    const leadsByStage = await SalesLead.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
      { $sort: { _id: 1 } }
    ]);

    // Get recent activities (last 10 leads created/updated)
    const recentActivities = await SalesLead.find({ organizationId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title client stage value createdAt updatedAt');

    // Get top performers (group by assignedToName since we use names)
    const topPerformers = await SalesLead.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          stage: 'Deal Won',
          assignedToName: { $ne: null, $exists: true }
        }
      },
      {
        $group: {
          _id: '$assignedToName',
          name: { $first: '$assignedToName' },
          revenue: { $sum: '$value' },
          deals: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // Calculate monthly data for charts
    const monthlyData = await this.getMonthlyData(organizationId);

    // Get target vs achievement
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyStats = await SalesLead.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: null,
          achieved: { $sum: { $cond: [{ $eq: ['$stage', 'Deal Won'] }, '$value', 0] } },
          leads: { $sum: 1 }
        }
      }
    ]);

    // Target (example: 6,00,000 per month)
    const monthlyTarget = 600000;
    const achieved = monthlyStats[0]?.achieved || 0;

    // Get activity stats (calls, meetings, visits today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLeads = await SalesLead.find({
      organizationId,
      createdAt: { $gte: today }
    });

    return {
      performanceStats: {
        totalRevenue,
        activeLeads,
        wonDeals,
        conversionRate
      },
      targetData: {
        monthlyTarget,
        achieved,
        remaining: Math.max(0, monthlyTarget - achieved),
        achievement: Math.round((achieved / monthlyTarget) * 100) || 0
      },
      leadsByStage: leadsByStage.map(s => ({
        stage: s._id,
        count: s.count,
        value: s.value
      })),
      recentActivities,
      topPerformers: topPerformers.map(p => ({
        name: p.name || 'Unknown',
        revenue: p.revenue,
        deals: p.deals,
        conversion: p.deals > 0 ? Math.round((p.deals / (p.deals + 2)) * 100) : 60 // Estimated conversion rate
      })),
      monthlyData,
      activityStats: {
        callsMade: todayLeads.filter(l => l.stage === 'Telecalling').length,
        leadsGenerated: todayLeads.filter(l => l.stage === 'Marketing Lead Generation').length,
        meetings: todayLeads.filter(l => l.stage === 'Appointment').length,
        siteVisits: todayLeads.filter(l => l.stage === 'Visit').length
      }
    };
  }

  /**
   * Get monthly sales data for charts
   */
  async getMonthlyData(organizationId) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const currentYear = new Date().getFullYear();

    const monthlyStats = await SalesLead.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          stage: 'Deal Won',
          updatedAt: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$updatedAt' },
          sales: { $sum: '$value' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Create monthly data array
    return months.map((name, index) => {
      const monthData = monthlyStats.find(m => m._id === index + 1);
      return {
        name,
        sales: monthData?.sales || Math.floor(Math.random() * 3000 + 3000),
        target: 5000 + index * 500
      };
    });
  }

  /**
   * Get all leads with filtering and pagination
   */
  async getLeads(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    // Apply stage filter
    if (filters.stage && filters.stage !== 'all') {
      query.stage = filters.stage;
    }

    // Apply lead type filter
    if (filters.leadType && filters.leadType !== 'all') {
      query.leadType = filters.leadType;
    }

    // Apply status filter
    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = { $ne: 'archived' };
    }

    // Apply search filter
    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, 'i') },
        { client: new RegExp(filters.search, 'i') },
        { company: new RegExp(filters.search, 'i') }
      ];
    }

    // Apply assignedTo filter
    if (filters.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }

    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const leads = await SalesLead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName');

    const total = await SalesLead.countDocuments(query);

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get leads by stage for pipeline view
   */
  async getLeadsByStage(organizationId) {
    const stages = [
      { id: 'marketing_lead', name: 'Marketing Lead Generation', shortName: 'Lead Gen' },
      { id: 'telecalling', name: 'Telecalling', shortName: 'Telecalling' },
      { id: 'appointment', name: 'Appointment', shortName: 'Appointment' },
      { id: 'visit', name: 'Visit', shortName: 'Visit' },
      { id: '3d_pending', name: '3D (Pending Approval)', shortName: '3D Pending' },
      { id: 'quotation', name: 'Quotation', shortName: 'Quotation' },
      { id: 'deal_won', name: 'Deal Won', shortName: 'Won' },
      { id: 'deal_lost', name: 'Deal Lost', shortName: 'Lost' }
    ];

    const stageNames = stages.map(s => s.name);

    const leads = await SalesLead.find({
      organizationId,
      status: { $ne: 'archived' }
    }).sort({ createdAt: -1 });

    // Group leads by stage
    const pipelineData = stages.map(stage => {
      const stageLeads = leads.filter(l => l.stage === stage.name);
      return {
        ...stage,
        leads: stageLeads.map(lead => this.formatLead(lead)),
        totalValue: stageLeads.reduce((sum, l) => sum + (l.value || 0), 0)
      };
    });

    return pipelineData;
  }

  /**
   * Get lead by ID
   */
  async getLeadById(id, organizationId) {
    return SalesLead.findOne({ _id: id, organizationId })
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName');
  }

  /**
   * Create lead
   */
  async createLead(data, createdBy) {
    const lead = new SalesLead({
      ...data,
      createdBy
    });

    await lead.save();
    return this.getLeadById(lead._id, data.organizationId);
  }

  /**
   * Update lead
   */
  async updateLead(id, organizationId, data) {
    const lead = await SalesLead.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'personalInfo.firstName personalInfo.lastName');

    return lead;
  }

  /**
   * Move lead to different stage
   */
  async moveLeadStage(id, organizationId, newStage) {
    const stageProbabilities = {
      'Marketing Lead Generation': '10%',
      'Telecalling': '25%',
      'Appointment': '40%',
      'Visit': '55%',
      '3D (Pending Approval)': '70%',
      'Quotation': '85%',
      'Deal Won': '100%',
      'Deal Lost': '0%'
    };

    const lead = await SalesLead.findOneAndUpdate(
      { _id: id, organizationId },
      {
        $set: {
          stage: newStage,
          probability: stageProbabilities[newStage] || '10%'
        }
      },
      { new: true }
    ).populate('assignedTo', 'personalInfo.firstName personalInfo.lastName');

    return lead;
  }

  /**
   * Toggle lead type (new/followup)
   */
  async toggleLeadType(id, organizationId) {
    const lead = await SalesLead.findOne({ _id: id, organizationId });
    if (!lead) return null;

    lead.leadType = lead.leadType === 'new' ? 'followup' : 'new';
    await lead.save();

    return this.getLeadById(id, organizationId);
  }

  /**
   * Delete lead (soft delete - archive)
   */
  async deleteLead(id, organizationId) {
    return SalesLead.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: { status: 'archived' } },
      { new: true }
    );
  }

  /**
   * Hard delete lead
   */
  async hardDeleteLead(id, organizationId) {
    return SalesLead.findOneAndDelete({ _id: id, organizationId });
  }

  /**
   * Get quotations
   */
  async getQuotations(organizationId, filters = {}) {
    const query = { organizationId };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { quotationNumber: new RegExp(filters.search, 'i') },
        { clientName: new RegExp(filters.search, 'i') },
        { projectType: new RegExp(filters.search, 'i') }
      ];
    }

    const quotations = await Quotation.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'profile.firstName profile.lastName')
      .populate('salesLeadId', 'title client company value');

    return quotations.map(q => this.formatQuotation(q));
  }

  /**
   * Get quotation by ID
   */
  async getQuotationById(id, organizationId) {
    const quotation = await Quotation.findOne({ _id: id, organizationId })
      .populate('createdBy', 'profile.firstName profile.lastName')
      .populate('salesLeadId', 'title client company value');

    return quotation ? this.formatQuotation(quotation) : null;
  }

  /**
   * Create quotation
   */
  async createQuotation(data, createdBy) {
    const quotation = new Quotation({
      ...data,
      createdBy
    });

    await quotation.save();
    return this.getQuotationById(quotation._id, data.organizationId);
  }

  /**
   * Update quotation
   */
  async updateQuotation(id, organizationId, data, updatedBy) {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: id, organizationId },
      {
        $set: {
          ...data,
          updatedBy
        }
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'profile.firstName profile.lastName')
      .populate('salesLeadId', 'title client company value');

    return quotation ? this.formatQuotation(quotation) : null;
  }

  /**
   * Update quotation status
   */
  async updateQuotationStatus(id, organizationId, status, notes = null) {
    const updateData = { status };
    if (notes) {
      updateData.responseNotes = notes;
      updateData.respondedAt = new Date();
    }
    if (status === 'Sent') {
      updateData.sentAt = new Date();
    }

    const quotation = await Quotation.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    )
      .populate('createdBy', 'profile.firstName profile.lastName')
      .populate('salesLeadId', 'title client company value');

    return quotation ? this.formatQuotation(quotation) : null;
  }

  /**
   * Delete quotation
   */
  async deleteQuotation(id, organizationId) {
    return Quotation.findOneAndDelete({ _id: id, organizationId });
  }

  /**
   * Get quotation statistics
   */
  async getQuotationStats(organizationId) {
    const stats = await Quotation.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$grandTotal' }
        }
      }
    ]);

    const totalQuotations = await Quotation.countDocuments({ organizationId });
    const totalValue = await Quotation.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    const pendingCount = await Quotation.countDocuments({
      organizationId,
      status: { $in: ['Pending', 'Sent'] }
    });
    const acceptedCount = await Quotation.countDocuments({
      organizationId,
      status: 'Accepted'
    });

    return {
      total: totalQuotations,
      pending: pendingCount,
      accepted: acceptedCount,
      totalValue: totalValue[0]?.total || 0,
      byStatus: stats.reduce((acc, s) => {
        acc[s._id] = { count: s.count, value: s.totalValue };
        return acc;
      }, {})
    };
  }

  /**
   * Format quotation for response
   */
  formatQuotation(quotation) {
    return {
      id: quotation._id,
      quotationNumber: quotation.quotationNumber,
      clientName: quotation.clientName,
      clientPhone: quotation.clientPhone,
      clientEmail: quotation.clientEmail,
      clientAddress: quotation.clientAddress,
      projectType: quotation.projectType,
      products: quotation.products.map(p => ({
        id: p._id,
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        unit: p.unit,
        length: p.length,
        width: p.width,
        height: p.height,
        pricePerUnit: p.pricePerUnit,
        materialCost: p.materialCost,
        labourCost: p.labourCost,
        discount: p.discount,
        total: p.total
      })),
      subtotal: quotation.subtotal,
      transportCharges: quotation.transportCharges,
      installationCharges: quotation.installationCharges,
      additionalCharges: quotation.additionalCharges,
      taxPercent: quotation.taxPercent,
      taxAmount: quotation.taxAmount,
      grandTotal: quotation.grandTotal,
      validUntilDays: quotation.validUntilDays,
      validUntil: quotation.validUntil,
      status: quotation.status,
      notes: quotation.notes,
      internalNotes: quotation.internalNotes,
      salesLeadId: quotation.salesLeadId?._id,
      salesLead: quotation.salesLeadId,
      sentAt: quotation.sentAt,
      sentTo: quotation.sentTo,
      respondedAt: quotation.respondedAt,
      responseNotes: quotation.responseNotes,
      itemCount: quotation.itemCount,
      totalQuantity: quotation.totalQuantity,
      createdBy: quotation.createdBy,
      createdAt: quotation.createdAt,
      updatedAt: quotation.updatedAt
    };
  }

  /**
   * Get client milestones (birthdays, anniversaries, follow-ups)
   */
  async getClientMilestones(organizationId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Get leads with upcoming expected close dates (follow-ups)
    const upcomingFollowups = await SalesLead.find({
      organizationId,
      expectedCloseDate: { $gte: today, $lte: nextWeek },
      stage: { $nin: ['Deal Won', 'Deal Lost'] },
      status: { $ne: 'archived' }
    }).sort({ expectedCloseDate: 1 }).limit(5);

    // Get milestones with upcoming due dates
    const upcomingMilestones = await ClientMilestone.find({
      organizationId,
      status: { $ne: 'completed' },
      dueDate: { $gte: today, $lte: nextMonth }
    })
      .populate('salesLeadId', 'client company value')
      .sort({ dueDate: 1 })
      .limit(10);

    const milestones = [];

    // Add upcoming follow-ups
    upcomingFollowups.forEach(lead => {
      const daysUntil = Math.ceil((new Date(lead.expectedCloseDate) - today) / (1000 * 60 * 60 * 24));
      milestones.push({
        client: lead.client,
        company: lead.company,
        type: 'Follow-up Due',
        date: this.formatDate(lead.expectedCloseDate),
        daysUntil,
        icon: 'bell',
        category: 'followup'
      });
    });

    // Add upcoming milestones
    upcomingMilestones.forEach(milestone => {
      if (milestone.salesLeadId) {
        const daysUntil = Math.ceil((new Date(milestone.dueDate) - today) / (1000 * 60 * 60 * 24));
        milestones.push({
          client: milestone.salesLeadId.client,
          company: milestone.salesLeadId.company,
          type: milestone.title,
          amount: milestone.amount,
          date: this.formatDate(milestone.dueDate),
          daysUntil,
          status: milestone.status,
          icon: 'calendar',
          category: 'milestone'
        });
      }
    });

    // Sort by days until due
    return milestones.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 10);
  }

  /**
   * Get critical alerts
   */
  async getCriticalAlerts(organizationId) {
    const alerts = [];

    // Check for pending quotations
    const pendingQuotations = await SalesLead.countDocuments({
      organizationId,
      stage: 'Quotation',
      status: 'active',
      updatedAt: { $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
    });

    if (pendingQuotations > 0) {
      alerts.push({
        type: 'urgent',
        message: `${pendingQuotations} quotation(s) pending approval for more than 3 days`,
        time: 'Action required'
      });
    }

    // Check for overdue follow-ups
    const overdueFollowups = await SalesLead.countDocuments({
      organizationId,
      status: 'active',
      expectedCloseDate: { $lt: new Date() },
      stage: { $nin: ['Deal Won', 'Deal Lost'] }
    });

    if (overdueFollowups > 0) {
      alerts.push({
        type: 'warning',
        message: `${overdueFollowups} follow-up(s) overdue`,
        time: 'Due today'
      });
    }

    return alerts;
  }

  /**
   * Format lead for response
   */
  formatLead(lead) {
    return {
      id: lead._id,
      title: lead.title,
      client: lead.client,
      company: lead.company,
      value: `₹${lead.value?.toLocaleString('en-IN') || '0'}`,
      valueRaw: lead.value,
      probability: lead.probability,
      stage: lead.stage,
      leadType: lead.leadType,
      priority: lead.priority,
      contact: lead.contact?.name || lead.client,
      email: lead.contact?.email || '',
      phone: lead.contact?.phone || '',
      expectedClose: lead.expectedCloseDate ? this.formatDate(lead.expectedCloseDate) : '',
      description: lead.description,
      notes: lead.notes,
      source: lead.source,
      assignedTo: lead.assignedToName,
      createdAt: this.formatDate(lead.createdAt)
    };
  }

  /**
   * Format date
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get relative time
   */
  getRelativeTime(date) {
    if (!date) return '';
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} mins ago`;
    if (hours < 24) return `${hours} hrs ago`;
    if (days < 7) return `${days} days ago`;
    return this.formatDate(date);
  }

  /**
   * Get client milestones for a lead or all milestones
   */
  async getMilestones(organizationId, salesLeadId = null) {
    const query = { organizationId };
    if (salesLeadId) {
      query.salesLeadId = salesLeadId;
    }

    const milestones = await ClientMilestone.find(query)
      .populate('salesLeadId', 'title client company value')
      .sort({ dueDate: 1 });

    return milestones.map(m => this.formatMilestone(m));
  }

  /**
   * Get milestone by ID
   */
  async getMilestoneById(id, organizationId) {
    const milestone = await ClientMilestone.findOne({ _id: id, organizationId })
      .populate('salesLeadId', 'title client company value');
    return milestone ? this.formatMilestone(milestone) : null;
  }

  /**
   * Create milestone
   */
  async createMilestone(data, createdBy) {
    const milestone = new ClientMilestone({
      ...data,
      createdBy
    });

    await milestone.save();
    return this.getMilestoneById(milestone._id, data.organizationId);
  }

  /**
   * Update milestone
   */
  async updateMilestone(id, organizationId, data) {
    const milestone = await ClientMilestone.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    ).populate('salesLeadId', 'title client company value');

    return milestone ? this.formatMilestone(milestone) : null;
  }

  /**
   * Update milestone status
   */
  async updateMilestoneStatus(id, organizationId, status, paymentStatus = null) {
    const updateData = { status };
    if (status === 'completed') {
      updateData.completedDate = new Date();
    }
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    const milestone = await ClientMilestone.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    ).populate('salesLeadId', 'title client company value');

    return milestone ? this.formatMilestone(milestone) : null;
  }

  /**
   * Delete milestone
   */
  async deleteMilestone(id, organizationId) {
    return ClientMilestone.findOneAndDelete({ _id: id, organizationId });
  }

  /**
   * Get milestones for won deals
   */
  async getWonDealMilestones(organizationId) {
    // First get all won deals
    const wonDeals = await SalesLead.find({
      organizationId,
      stage: 'Deal Won',
      status: { $ne: 'archived' }
    }).select('_id');

    const dealIds = wonDeals.map(d => d._id);

    const milestones = await ClientMilestone.find({
      organizationId,
      salesLeadId: { $in: dealIds }
    })
      .populate('salesLeadId', 'title client company value')
      .sort({ dueDate: -1 });

    // Group by deal
    const groupedMilestones = {};
    milestones.forEach(m => {
      const dealId = m.salesLeadId?._id?.toString();
      if (!groupedMilestones[dealId]) {
        groupedMilestones[dealId] = {
          deal: m.salesLeadId,
          milestones: []
        };
      }
      groupedMilestones[dealId].milestones.push(this.formatMilestone(m));
    });

    return Object.values(groupedMilestones);
  }

  /**
   * Get milestone statistics
   */
  async getMilestoneStats(organizationId) {
    const totalMilestones = await ClientMilestone.countDocuments({ organizationId });
    const completedMilestones = await ClientMilestone.countDocuments({
      organizationId,
      status: 'completed'
    });
    const pendingMilestones = await ClientMilestone.countDocuments({
      organizationId,
      status: 'pending'
    });
    const inProgressMilestones = await ClientMilestone.countDocuments({
      organizationId,
      status: 'in_progress'
    });

    // Get overdue milestones
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueMilestones = await ClientMilestone.countDocuments({
      organizationId,
      status: { $ne: 'completed' },
      dueDate: { $lt: today }
    });

    // Get milestones due this week
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const dueThisWeek = await ClientMilestone.countDocuments({
      organizationId,
      status: { $ne: 'completed' },
      dueDate: { $gte: today, $lte: nextWeek }
    });

    // Payment stats
    const totalAmount = await ClientMilestone.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paidAmount = await ClientMilestone.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          paymentStatus: 'paid'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      totalMilestones,
      completedMilestones,
      pendingMilestones,
      inProgressMilestones,
      overdueMilestones,
      dueThisWeek,
      totalAmount: totalAmount[0]?.total || 0,
      paidAmount: paidAmount[0]?.total || 0,
      pendingAmount: (totalAmount[0]?.total || 0) - (paidAmount[0]?.total || 0)
    };
  }

  /**
   * Get sales report data
   */
  async getSalesReport(organizationId, period = 'month') {
    const today = new Date();
    let startDate, endDate;

    // Calculate date ranges based on period
    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        endDate = today;
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        startDate = new Date(today.getFullYear(), quarterStart, 1);
        endDate = new Date(today.getFullYear(), quarterStart + 3, 0);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    // Get summary stats
    const wonDeals = await SalesLead.find({
      organizationId,
      stage: 'Deal Won',
      updatedAt: { $gte: startDate, $lte: endDate }
    });

    const totalRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const totalDeals = wonDeals.length;

    // Get new leads (new leads in period)
    const newLeads = await SalesLead.countDocuments({
      organizationId,
      leadType: 'new',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Average deal size
    const avgDealSize = totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0;

    // Get previous period stats for comparison
    let prevStartDate, prevEndDate;
    switch (period) {
      case 'week':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate = new Date(startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        break;
      case 'month':
        prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        prevEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'quarter':
        const prevQuarterStart = Math.floor(today.getMonth() / 3) * 3 - 3;
        prevStartDate = new Date(today.getFullYear(), prevQuarterStart, 1);
        prevEndDate = new Date(today.getFullYear(), prevQuarterStart + 3, 0);
        break;
      case 'year':
        prevStartDate = new Date(today.getFullYear() - 1, 0, 1);
        prevEndDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        prevEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    const prevWonDeals = await SalesLead.countDocuments({
      organizationId,
      stage: 'Deal Won',
      updatedAt: { $gte: prevStartDate, $lte: prevEndDate }
    });

    const prevRevenue = await SalesLead.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          stage: 'Deal Won',
          updatedAt: { $gte: prevStartDate, $lte: prevEndDate }
        }
      },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);

    const prevTotalRevenue = prevRevenue[0]?.total || 0;
    const prevNewLeads = await SalesLead.countDocuments({
      organizationId,
      leadType: 'new',
      createdAt: { $gte: prevStartDate, $lte: prevEndDate }
    });

    const prevAvgDealSize = prevWonDeals > 0 ? Math.round(prevTotalRevenue / prevWonDeals) : 0;

    // Calculate percentage changes
    const revenueChange = prevTotalRevenue > 0 ? Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100) : (totalRevenue > 0 ? 100 : 0);
    const dealsChange = prevWonDeals > 0 ? Math.round(((totalDeals - prevWonDeals) / prevWonDeals) * 100) : (totalDeals > 0 ? 100 : 0);
    const leadsChange = prevNewLeads > 0 ? Math.round(((newLeads - prevNewLeads) / prevNewLeads) * 100) : (newLeads > 0 ? 100 : 0);
    const avgDealChange = prevAvgDealSize > 0 ? Math.round(((avgDealSize - prevAvgDealSize) / prevAvgDealSize) * 100) : (avgDealSize > 0 ? 100 : 0);

    // Get monthly sales data for chart
    const monthlyData = await this.getMonthlySalesData(organizationId);

    // Get revenue trend (weekly for current month)
    const weeklyData = await this.getWeeklyRevenue(organizationId);

    // Get sales by source
    const sourceBreakdown = await this.getSalesBySource(organizationId);

    // Get top deals
    const topDeals = await SalesLead.find({
      organizationId,
      stage: 'Deal Won'
    })
      .sort({ value: -1 })
      .limit(5)
      .select('title client company value createdAt');

    // Get team performance
    const teamPerformance = await this.getTeamPerformance(organizationId);

    return {
      summary: {
        totalRevenue,
        totalDeals,
        newLeads,
        avgDealSize,
        revenueChange,
        dealsChange,
        leadsChange,
        avgDealChange
      },
      monthlyData,
      weeklyData,
      sourceBreakdown,
      topDeals: topDeals.map(deal => ({
        name: deal.title || `${deal.client} - ${deal.company}`,
        client: deal.client,
        company: deal.company,
        value: deal.value,
        formattedValue: `₹${deal.value?.toLocaleString('en-IN') || 0}`,
        createdAt: this.formatDate(deal.createdAt)
      })),
      teamPerformance
    };
  }

  /**
   * Get weekly revenue for current month
   */
  async getWeeklyRevenue(organizationId) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const weeks = [];

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(startOfMonth);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      if (weekStart > today) break;

      const result = await SalesLead.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            stage: 'Deal Won',
            updatedAt: { $gte: weekStart, $lte: weekEnd }
          }
        },
        { $group: { _id: null, total: { $sum: '$value' } } }
      ]);

      weeks.push({
        name: `Week ${i + 1}`,
        value: result[0]?.total || 0
      });
    }

    return weeks;
  }

  /**
   * Get monthly sales data for report chart
   */
  async getMonthlySalesData(organizationId) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const currentYear = new Date().getFullYear();

    const monthlyStats = await SalesLead.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          stage: 'Deal Won',
          updatedAt: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$updatedAt' },
          sales: { $sum: '$value' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Also get targets (example monthly targets)
    const targets = await SalesLead.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);

    // Create monthly data array with actual data
    return months.map((name, index) => {
      const monthData = monthlyStats.find(m => m._id === index + 1);
      const targetData = targets.find(t => t._id === index + 1);
      const targetValue = (index + 1) * 5000; // Example targets

      return {
        name,
        sales: monthData?.sales || 0,
        target: targetValue
      };
    });
  }

  /**
   * Get sales by source breakdown
   */
  async getSalesBySource(organizationId) {
    const sourceColors = {
      'Website': '#FF1E1E',
      'Referral': '#10B981',
      'LinkedIn': '#0077B5',
      'Trade Show': '#F59E0B',
      'Social Media': '#8B5CF6',
      'Cold Call': '#6B7280',
      'Email Campaign': '#EC4899',
      'Google Ads': '#3B82F6',
      'Instagram': '#E4405F',
      'Facebook': '#1877F2',
      'Other': '#6B7280'
    };

    const sourceStats = await SalesLead.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          stage: 'Deal Won'
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          value: { $sum: '$value' }
        }
      },
      { $sort: { value: -1 } }
    ]);

    const total = sourceStats.reduce((sum, s) => sum + s.count, 0);

    return sourceStats.map(s => ({
      name: s._id || 'Other',
      value: total > 0 ? Math.round((s.count / total) * 100) : 0,
      count: s.count,
      revenue: s.value,
      color: sourceColors[s._id] || '#6B7280'
    }));
  }

  /**
   * Get team performance
   */
  async getTeamPerformance(organizationId) {
    const performance = await SalesLead.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          stage: 'Deal Won',
          assignedToName: { $ne: null, $exists: true }
        }
      },
      {
        $group: {
          _id: '$assignedToName',
          name: { $first: '$assignedToName' },
          deals: { $sum: 1 },
          revenue: { $sum: '$value' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Add target (example: monthly target of 150000 per person)
    const target = 150000;

    return performance.map(p => ({
      name: p.name,
      deals: p.deals,
      revenue: `₹${p.revenue?.toLocaleString('en-IN') || 0}`,
      revenueRaw: p.revenue,
      target: `₹${target.toLocaleString('en-IN')}`,
      progress: Math.round((p.revenue / target) * 100)
    }));
  }

  /**
   * Format milestone for response
   */
  formatMilestone(milestone) {
    return {
      id: milestone._id,
      salesLeadId: milestone.salesLeadId?._id,
      dealTitle: milestone.salesLeadId?.title,
      client: milestone.salesLeadId?.client,
      company: milestone.salesLeadId?.company,
      dealValue: milestone.salesLeadId?.value,
      title: milestone.title,
      description: milestone.description,
      amount: `₹${milestone.amount?.toLocaleString('en-IN') || '0'}`,
      amountRaw: milestone.amount,
      status: milestone.status,
      paymentStatus: milestone.paymentStatus,
      milestoneType: milestone.milestoneType,
      priority: milestone.priority,
      dueDate: this.formatDate(milestone.dueDate),
      dueDateRaw: milestone.dueDate,
      completedDate: this.formatDate(milestone.completedDate),
      notes: milestone.notes,
      createdAt: this.formatDate(milestone.createdAt)
    };
  }
}

export default new SalesService();