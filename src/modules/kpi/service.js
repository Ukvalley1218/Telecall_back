import KPI from '../../models/KPI.js';
import mongoose from 'mongoose';

class KPIService {
  /**
   * Get KPIs with filtering and pagination
   */
  async getKPIs(organizationId, filters, options) {
    const query = { organizationId };

    // Apply filters
    if (filters.group) {
      query.group = filters.group;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true';
    } else {
      query.isActive = true; // Default to active only
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const kpis = await KPI.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'profile.firstName profile.lastName email');

    const total = await KPI.countDocuments(query);

    return {
      kpis,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get KPI by ID
   */
  async getKPIById(id, organizationId) {
    return KPI.findOne({ _id: id, organizationId })
      .populate('createdBy', 'profile.firstName profile.lastName email');
  }

  /**
   * Create KPI
   */
  async createKPI(data) {
    const kpi = new KPI({
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      unit: data.unit,
      group: data.group,
      targetValue: data.targetValue,
      maxValue: data.maxValue,
      weightage: data.weightage || 1,
      frequency: data.frequency || 'monthly',
      createdBy: data.createdBy
    });

    await kpi.save();
    return await this.getKPIById(kpi._id, data.organizationId);
  }

  /**
   * Update KPI
   */
  async updateKPI(id, organizationId, data) {
    const update = {};

    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.targetValue !== undefined) update.targetValue = data.targetValue;
    if (data.maxValue !== undefined) update.maxValue = data.maxValue;
    if (data.weightage !== undefined) update.weightage = data.weightage;
    if (data.frequency !== undefined) update.frequency = data.frequency;
    update.updatedBy = data.updatedBy;

    const kpi = await KPI.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: update },
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'profile.firstName profile.lastName email');

    return kpi;
  }

  /**
   * Deactivate KPI
   */
  async deactivateKPI(id, organizationId) {
    const kpi = await KPI.findOneAndUpdate(
      { _id: id, organizationId },
      { isActive: false },
      { new: true }
    );

    return kpi;
  }

  /**
   * Get KPI groups with counts
   */
  async getKPIGroups(organizationId) {
    const groups = await KPI.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), isActive: true } },
      { $group: { _id: '$group', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return groups.map(g => ({
      group: g._id,
      count: g.count
    }));
  }

  /**
   * Get KPIs by group
   */
  async getKPIsByGroup(organizationId, group) {
    return KPI.find({ organizationId, group, isActive: true })
      .sort({ name: 1 });
  }
}

export default new KPIService();