import Incentive from '../../models/Incentive.js';
import Employee from '../../models/Employee.js';
import Organization from '../../models/Organization.js';
import { INCENTIVE_STATUS } from '../../config/constants.js';
import { calculateIncentivePayableDate } from '../../utils/helpers.js';
import mongoose from 'mongoose';

class IncentiveService {
  /**
   * Get incentives with filtering and pagination
   */
  async getIncentives(organizationId, filters, options) {
    const query = { organizationId };

    // Apply filters
    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.startDate && filters.endDate) {
      query.salesDate = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    } else if (filters.startDate) {
      query.salesDate = { $gte: new Date(filters.startDate) };
    } else if (filters.endDate) {
      query.salesDate = { $lte: new Date(filters.endDate) };
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const incentives = await Incentive.find(query)
      .sort({ salesDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('createdBy', 'profile.firstName profile.lastName');

    const total = await Incentive.countDocuments(query);

    return {
      incentives,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get payable incentives
   */
  async getPayableIncentives(organizationId, startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start);
    end.setMonth(end.getMonth() + 1);

    return Incentive.find({
      organizationId,
      status: INCENTIVE_STATUS.PENDING,
      payableDate: { $gte: start, $lte: end }
    })
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .sort({ payableDate: 1 });
  }

  /**
   * Get incentive by ID
   */
  async getIncentiveById(id, organizationId) {
    return Incentive.findOne({ _id: id, organizationId })
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('approvedBy', 'profile.firstName profile.lastName');
  }

  /**
   * Create incentive
   */
  async createIncentive(data) {
    // Verify employee exists
    const employee = await Employee.findOne({
      _id: data.employeeId,
      organizationId: data.organizationId,
      status: 'active'
    });

    if (!employee) {
      throw new Error('Employee not found or inactive');
    }

    // Get organization settings
    const organization = await Organization.findById(data.organizationId);
    const payoutDays = organization?.settings?.incentivePayoutDays || 45;

    const incentive = new Incentive({
      organizationId: data.organizationId,
      employeeId: data.employeeId,
      salesAmount: data.salesAmount,
      incentiveAmount: data.incentiveAmount,
      reason: data.reason,
      description: data.description,
      salesDate: new Date(data.salesDate),
      payableDate: calculateIncentivePayableDate(new Date(data.salesDate), payoutDays),
      notes: data.notes,
      createdBy: data.createdBy
    });

    await incentive.save();
    return await this.getIncentiveById(incentive._id, data.organizationId);
  }

  /**
   * Update incentive
   */
  async updateIncentive(id, organizationId, data) {
    // Check if incentive can be updated
    const incentive = await Incentive.findOne({ _id: id, organizationId });

    if (!incentive) {
      return null;
    }

    if (incentive.status === INCENTIVE_STATUS.PAID) {
      throw new Error('Cannot update a paid incentive');
    }

    const update = {};
    if (data.salesAmount !== undefined) update.salesAmount = data.salesAmount;
    if (data.incentiveAmount !== undefined) update.incentiveAmount = data.incentiveAmount;
    if (data.description !== undefined) update.description = data.description;
    if (data.notes !== undefined) update.notes = data.notes;

    const updatedIncentive = await Incentive.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: update },
      { new: true, runValidators: true }
    ).populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId');

    return updatedIncentive;
  }

  /**
   * Mark incentive as paid
   */
  async markAsPaid(id, organizationId, paymentReference) {
    const incentive = await Incentive.findOne({ _id: id, organizationId });

    if (!incentive) {
      return null;
    }

    if (incentive.status === INCENTIVE_STATUS.PAID) {
      throw new Error('Incentive is already paid');
    }

    if (incentive.status === INCENTIVE_STATUS.CANCELLED) {
      throw new Error('Cannot pay a cancelled incentive');
    }

    await incentive.markAsPaid(paymentReference);
    return await this.getIncentiveById(id, organizationId);
  }

  /**
   * Cancel incentive
   */
  async cancelIncentive(id, organizationId, reason) {
    const incentive = await Incentive.findOne({ _id: id, organizationId });

    if (!incentive) {
      return null;
    }

    if (incentive.status === INCENTIVE_STATUS.PAID) {
      throw new Error('Cannot cancel a paid incentive');
    }

    await incentive.cancel(reason);
    return await this.getIncentiveById(id, organizationId);
  }

  /**
   * Get employee incentive summary
   */
  async getEmployeeIncentiveSummary(employeeId, organizationId) {
    const incentives = await Incentive.find({
      employeeId,
      organizationId
    }).sort({ salesDate: -1 });

    const summary = {
      totalIncentives: incentives.length,
      totalAmount: incentives.reduce((sum, i) => sum + i.incentiveAmount, 0),
      pendingAmount: incentives
        .filter(i => i.status === INCENTIVE_STATUS.PENDING)
        .reduce((sum, i) => sum + i.incentiveAmount, 0),
      paidAmount: incentives
        .filter(i => i.status === INCENTIVE_STATUS.PAID)
        .reduce((sum, i) => sum + i.incentiveAmount, 0),
      pendingCount: incentives.filter(i => i.status === INCENTIVE_STATUS.PENDING).length,
      paidCount: incentives.filter(i => i.status === INCENTIVE_STATUS.PAID).length,
      cancelledCount: incentives.filter(i => i.status === INCENTIVE_STATUS.CANCELLED).length,
      byReason: {
        early_payment: incentives.filter(i => i.reason === 'early_payment').length,
        partial_payment: incentives.filter(i => i.reason === 'partial_payment').length,
        sales_completion: incentives.filter(i => i.reason === 'sales_completion').length,
        other: incentives.filter(i => i.reason === 'other').length
      }
    };

    return summary;
  }
}

export default new IncentiveService();