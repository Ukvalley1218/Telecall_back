import mongoose from 'mongoose';
import ComplianceItem from '../../models/ComplianceItem.js';

class ComplianceService {
  /**
   * Get compliance items with filters
   */
  async getComplianceItems(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assignedTo) query.assignedTo = filters.assignedTo;

    // Due date range filter
    if (filters.dueBefore) {
      query.dueDate = { $lte: new Date(filters.dueBefore) };
    }
    if (filters.dueAfter) {
      query.dueDate = { ...query.dueDate, $gte: new Date(filters.dueAfter) };
    }

    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const items = await ComplianceItem.find(query)
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName employeeId')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await ComplianceItem.countDocuments(query);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get compliance item by ID
   */
  async getComplianceItemById(id, organizationId) {
    return ComplianceItem.findOne({ _id: id, organizationId })
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
      .populate('completedBy', 'profile.firstName profile.lastName email');
  }

  /**
   * Create compliance item
   */
  async createComplianceItem(data) {
    const item = new ComplianceItem(data);
    await item.save();
    return this.getComplianceItemById(item._id, data.organizationId);
  }

  /**
   * Update compliance item
   */
  async updateComplianceItem(id, organizationId, data) {
    const item = await ComplianceItem.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    );
    return item;
  }

  /**
   * Delete compliance item
   */
  async deleteComplianceItem(id, organizationId) {
    const item = await ComplianceItem.findOneAndDelete({ _id: id, organizationId });
    return item;
  }

  /**
   * Get upcoming compliance items
   */
  async getUpcomingItems(organizationId, days = 30) {
    return ComplianceItem.getUpcoming(organizationId, days);
  }

  /**
   * Get overdue compliance items
   */
  async getOverdueItems(organizationId) {
    return ComplianceItem.getOverdue(organizationId);
  }

  /**
   * Get compliance items by category
   */
  async getItemsByCategory(organizationId, category) {
    return ComplianceItem.getByCategory(organizationId, category);
  }

  /**
   * Complete compliance item
   */
  async completeItem(id, organizationId, userId, notes) {
    const item = await ComplianceItem.findOne({ _id: id, organizationId });
    if (!item) {
      throw new Error('Compliance item not found');
    }
    await item.complete(userId, notes);
    return this.getComplianceItemById(id, organizationId);
  }

  /**
   * Reopen compliance item
   */
  async reopenItem(id, organizationId, userId, reason) {
    const item = await ComplianceItem.findOne({ _id: id, organizationId });
    if (!item) {
      throw new Error('Compliance item not found');
    }
    await item.reopen(userId, reason);
    return this.getComplianceItemById(id, organizationId);
  }

  /**
   * Add document to compliance item
   */
  async addDocument(id, organizationId, document) {
    const item = await ComplianceItem.findOne({ _id: id, organizationId });
    if (!item) {
      throw new Error('Compliance item not found');
    }
    await item.addDocument(document);
    return this.getComplianceItemById(id, organizationId);
  }

  /**
   * Remove document from compliance item
   */
  async removeDocument(id, organizationId, documentName) {
    const item = await ComplianceItem.findOne({ _id: id, organizationId });
    if (!item) {
      throw new Error('Compliance item not found');
    }
    await item.removeDocument(documentName);
    return this.getComplianceItemById(id, organizationId);
  }

  /**
   * Complete requirement
   */
  async completeRequirement(id, organizationId, requirementIndex) {
    const item = await ComplianceItem.findOne({ _id: id, organizationId });
    if (!item) {
      throw new Error('Compliance item not found');
    }
    await item.completeRequirement(requirementIndex);
    return this.getComplianceItemById(id, organizationId);
  }

  /**
   * Get compliance summary
   */
  async getComplianceSummary(organizationId) {
    return ComplianceItem.getSummary(organizationId);
  }

  /**
   * Get compliance calendar
   */
  async getComplianceCalendar(organizationId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const items = await ComplianceItem.find({
      organizationId,
      dueDate: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    }).sort({ dueDate: 1 });

    // Group by due date
    const calendar = {};
    items.forEach(item => {
      const dateKey = new Date(item.dueDate).toISOString().split('T')[0];
      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }
      calendar[dateKey].push(item);
    });

    return {
      month,
      year,
      items,
      calendar,
      total: items.length,
      completed: items.filter(i => i.status === 'completed').length,
      pending: items.filter(i => i.status === 'pending').length,
      overdue: items.filter(i => i.status === 'overdue').length
    };
  }

  /**
   * Get items by assignee
   */
  async getItemsByAssignee(assigneeId) {
    return ComplianceItem.find({ assignedTo: assigneeId, status: { $ne: 'cancelled' } })
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .sort({ dueDate: 1 });
  }

  /**
   * Send reminder for due items
   */
  async sendReminders(organizationId) {
    const today = new Date();
    const reminderThreshold = new Date();
    reminderThreshold.setDate(reminderThreshold.getDate() + 7); // 7 days ahead

    const itemsToRemind = await ComplianceItem.find({
      organizationId,
      reminderDate: { $lte: reminderThreshold },
      status: { $nin: ['completed', 'cancelled'] }
    }).populate('assignedTo', 'personalInfo.firstName personalInfo.lastName email');

    // In a real application, this would send email notifications
    // For now, we'll just return the items
    return itemsToRemind.map(item => ({
      itemId: item.itemId,
      title: item.title,
      dueDate: item.dueDate,
      assignedTo: item.assignedTo
    }));
  }
}

export default new ComplianceService();