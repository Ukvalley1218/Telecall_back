import Organization from '../../models/Organization.js';
import User from '../../models/User.js';
import { successResponse, notFoundResponse } from '../../utils/response.js';
import { ROLES, SUBSCRIPTION_PLANS } from '../../config/constants.js';
import mongoose from 'mongoose';

class OrganizationService {
  /**
   * Get organization by ID
   */
  async getOrganization(id) {
    return Organization.findById(id);
  }

  /**
   * Get organization with users
   */
  async getOrganizationWithUsers(id) {
    const organization = await Organization.findById(id);
    if (!organization) return null;

    const users = await User.find({ organizationId: id })
      .select('-password')
      .sort({ role: 1, createdAt: 1 });

    return {
      organization,
      users
    };
  }

  /**
   * Update organization settings
   */
  async updateSettings(id, settings) {
    const organization = await Organization.findByIdAndUpdate(
      id,
      { $set: { settings } },
      { new: true, runValidators: true }
    );
    return organization;
  }

  /**
   * Check subscription limits
   */
  async checkLimits(id) {
    const organization = await Organization.findById(id);
    if (!organization) return null;

    const Employee = mongoose.model('Employee');
    const activeEmployees = await Employee.countDocuments({
      organizationId: id,
      status: 'active'
    });

    const limits = {
      plan: organization.subscriptionPlan,
      maxEmployees: organization.maxEmployees,
      currentEmployees: activeEmployees,
      canAddEmployee: activeEmployees < organization.maxEmployees,
      remaining: organization.maxEmployees - activeEmployees
    };

    return limits;
  }

  /**
   * Get organization statistics
   */
  async getStatistics(id) {
    const Employee = mongoose.model('Employee');
    const Candidate = mongoose.model('Candidate');
    const Attendance = mongoose.model('Attendance');
    const Incentive = mongoose.model('Incentive');

    const [employees, candidates, attendance, incentives] = await Promise.all([
      Employee.countDocuments({ organizationId: id, status: 'active' }),
      Candidate.countDocuments({ organizationId: id }),
      Attendance.countDocuments({ organizationId: id }),
      Incentive.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(id), status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$incentiveAmount' } } }
      ])
    ]);

    return {
      employees,
      candidates,
      totalAttendance: attendance,
      pendingIncentives: incentives[0]?.total || 0
    };
  }
}

export default new OrganizationService();