import incentiveService from './service.js';
import { successResponse, createdResponse, notFoundResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';
import { ROLES } from '../../config/constants.js';
import Employee from '../../models/Employee.js';
import Incentive from '../../models/Incentive.js';
import mongoose from 'mongoose';

class IncentiveController {
  /**
   * Get incentives
   */
  async getIncentives(req, res, next) {
    try {
      const { organizationId, user } = req;
      const filters = {
        employeeId: req.query.employeeId,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      // If employee role, only show their incentives
      if (user.role === ROLES.EMPLOYEE) {
        filters.employeeId = user.employeeId;
      }

      const result = await incentiveService.getIncentives(organizationId, filters, options);

      return paginatedResponse(
        res,
        result.incentives,
        options.page,
        options.limit,
        result.pagination.total,
        'Incentives retrieved'
      );
    } catch (error) {
      logger.error('Get incentives error:', error);
      next(error);
    }
  }

  /**
   * Get payable incentives
   */
  async getPayableIncentives(req, res, next) {
    try {
      const { organizationId } = req;
      const { startDate, endDate } = req.query;

      const incentives = await incentiveService.getPayableIncentives(
        organizationId,
        startDate,
        endDate
      );

      return successResponse(res, incentives, 'Payable incentives retrieved');
    } catch (error) {
      logger.error('Get payable incentives error:', error);
      next(error);
    }
  }

  /**
   * Get incentive by ID
   */
  async getIncentive(req, res, next) {
    try {
      const { organizationId, user } = req;
      const incentive = await incentiveService.getIncentiveById(
        req.params.id,
        organizationId
      );

      if (!incentive) {
        return notFoundResponse(res, 'Incentive');
      }

      // Check access rights
      if (user.role === ROLES.EMPLOYEE &&
          incentive.employeeId.toString() !== user.employeeId?.toString()) {
        return errorResponse(res, 'Access denied', 403);
      }

      return successResponse(res, incentive, 'Incentive retrieved');
    } catch (error) {
      logger.error('Get incentive error:', error);
      next(error);
    }
  }

  /**
   * Create incentive
   */
  async createIncentive(req, res, next) {
    try {
      const { organizationId, user } = req;
      const incentive = await incentiveService.createIncentive({
        ...req.body,
        organizationId,
        createdBy: user._id
      });

      logger.info(`Incentive created: ${incentive._id} for employee ${req.body.employeeId}`);

      return createdResponse(res, incentive, 'Incentive created successfully');
    } catch (error) {
      logger.error('Create incentive error:', error);
      next(error);
    }
  }

  /**
   * Update incentive
   */
  async updateIncentive(req, res, next) {
    try {
      const { organizationId } = req;
      const incentive = await incentiveService.updateIncentive(
        req.params.id,
        organizationId,
        req.body
      );

      if (!incentive) {
        return notFoundResponse(res, 'Incentive');
      }

      return successResponse(res, incentive, 'Incentive updated');
    } catch (error) {
      logger.error('Update incentive error:', error);
      next(error);
    }
  }

  /**
   * Mark incentive as paid
   */
  async markAsPaid(req, res, next) {
    try {
      const { organizationId, user } = req;
      const incentive = await incentiveService.markAsPaid(
        req.params.id,
        organizationId,
        req.body.paymentReference
      );

      if (!incentive) {
        return notFoundResponse(res, 'Incentive');
      }

      logger.info(`Incentive paid: ${incentive._id} by user ${user._id}`);

      return successResponse(res, incentive, 'Incentive marked as paid');
    } catch (error) {
      logger.error('Mark incentive as paid error:', error);
      next(error);
    }
  }

  /**
   * Cancel incentive
   */
  async cancelIncentive(req, res, next) {
    try {
      const { organizationId, user } = req;
      const incentive = await incentiveService.cancelIncentive(
        req.params.id,
        organizationId,
        req.body.reason
      );

      if (!incentive) {
        return notFoundResponse(res, 'Incentive');
      }

      logger.info(`Incentive cancelled: ${incentive._id} by user ${user._id}`);

      return successResponse(res, incentive, 'Incentive cancelled');
    } catch (error) {
      logger.error('Cancel incentive error:', error);
      next(error);
    }
  }

  /**
   * Get employee incentive summary
   */
  async getEmployeeIncentiveSummary(req, res, next) {
    try {
      const { organizationId } = req;
      const { employeeId } = req.params;

      const summary = await incentiveService.getEmployeeIncentiveSummary(
        employeeId,
        organizationId
      );

      return successResponse(res, summary, 'Employee incentive summary retrieved');
    } catch (error) {
      logger.error('Get employee incentive summary error:', error);
      next(error);
    }
  }

  /**
   * Get incentive management dashboard stats
   */
  async getDashboardStats(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year, department } = req.query;

      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);

      // Build employee filter
      const employeeFilter = { organizationId: new mongoose.Types.ObjectId(organizationId), status: 'active' };
      if (department && department !== 'all') {
        employeeFilter['employment.department'] = new RegExp(department, 'i');
      }

      // Get all employees with their targets
      const employees = await Employee.find(employeeFilter)
        .select('personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation salary.monthlyTarget');

      // Get incentives for the month
      const incentives = await Incentive.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            salesDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$employeeId',
            totalSalesAmount: { $sum: '$salesAmount' },
            totalIncentive: { $sum: '$incentiveAmount' },
            salesCount: { $sum: 1 },
            pendingIncentive: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$incentiveAmount', 0]
              }
            },
            approvedIncentive: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, '$incentiveAmount', 0]
              }
            },
            paidIncentive: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$incentiveAmount', 0]
              }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            approvedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            paidCount: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
            }
          }
        }
      ]);

      // Create incentive map
      const incentiveMap = new Map();
      incentives.forEach(inc => {
        incentiveMap.set(inc._id.toString(), inc);
      });

      // Build employee incentive data
      const employeeIncentiveData = employees.map(emp => {
        const empIncentive = incentiveMap.get(emp._id.toString()) || {};
        const monthlyTarget = emp.salary?.monthlyTarget || 500000;
        const totalSales = empIncentive.totalSalesAmount || 0;
        const achievementPct = monthlyTarget > 0 ? ((totalSales / monthlyTarget) * 100).toFixed(1) : 0;

        // Determine incentive percentage based on sales
        let incentivePercent = 2;
        if (totalSales >= 2150000) incentivePercent = 5;
        else if (totalSales >= 1510000) incentivePercent = 4.5;
        else if (totalSales >= 1210000) incentivePercent = 4;
        else if (totalSales >= 910000) incentivePercent = 3.5;
        else if (totalSales >= 610000) incentivePercent = 3;
        else if (totalSales >= 310000) incentivePercent = 2.5;

        const grossIncentive = Math.round((totalSales * incentivePercent) / 100);
        const deduction3D = Math.round(grossIncentive * 0.001);
        const netIncentive = grossIncentive - deduction3D;

        return {
          employeeId: emp._id,
          employeeCode: emp.employeeId,
          name: `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim(),
          department: emp.employment?.department || 'N/A',
          designation: emp.employment?.designation || 'N/A',
          monthlyTarget,
          totalSales,
          totalReceipt: totalSales,
          achievementPct: parseFloat(achievementPct),
          incentivePercent,
          grossIncentive,
          deduction3D,
          netIncentive,
          status: empIncentive.pendingCount > 0 ? 'pending' : (empIncentive.approvedCount > 0 ? 'approved' : 'paid'),
          pendingCount: empIncentive.pendingCount || 0,
          approvedCount: empIncentive.approvedCount || 0,
          paidCount: empIncentive.paidCount || 0
        };
      });

      // Calculate totals
      const totalStats = {
        totalIncentive: employeeIncentiveData.reduce((sum, e) => sum + e.netIncentive, 0),
        totalSales: employeeIncentiveData.reduce((sum, e) => sum + e.totalSales, 0),
        pendingCount: employeeIncentiveData.filter(e => e.status === 'pending').length,
        approvedCount: employeeIncentiveData.filter(e => e.status === 'approved').length,
        overAchievers: employeeIncentiveData.filter(e => e.achievementPct >= 100).length,
        totalDeduction: employeeIncentiveData.reduce((sum, e) => sum + e.deduction3D, 0)
      };

      // Get top earners
      const topEarners = [...employeeIncentiveData]
        .sort((a, b) => b.netIncentive - a.netIncentive)
        .slice(0, 5)
        .map((emp, index) => ({
          ...emp,
          rank: index + 1
        }));

      // Department breakdown
      const departmentBreakdown = await Employee.aggregate([
        {
          $match: employeeFilter
        },
        {
          $group: {
            _id: '$employment.department',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const stats = {
        kpis: {
          totalIncentive: {
            value: totalStats.totalIncentive,
            label: 'Total Incentives',
            sublabel: 'This Month'
          },
          totalSales: {
            value: totalStats.totalSales,
            label: 'Total Sales',
            sublabel: 'Receipts Collected'
          },
          pendingCount: {
            value: totalStats.pendingCount,
            label: 'Pending Approval',
            sublabel: 'Awaiting Review'
          },
          approvedCount: {
            value: totalStats.approvedCount,
            label: 'Approved',
            sublabel: 'Ready for Payment'
          }
        },
        employeeData: employeeIncentiveData,
        topEarners,
        departmentBreakdown: departmentBreakdown.map(d => ({
          id: d._id?.toLowerCase().replace(/\s+/g, '-'),
          name: d._id || 'Unknown',
          count: d.count
        })),
        month: targetMonth,
        year: targetYear
      };

      return successResponse(res, stats, 'Incentive dashboard stats retrieved successfully');
    } catch (error) {
      logger.error('Get incentive dashboard stats error:', error);
      next(error);
    }
  }

  /**
   * Get incentive slabs
   */
  async getIncentiveSlabs(req, res, next) {
    try {
      const slabs = [
        { min: 10000, max: 300000, percentage: 2, label: '₹10K - ₹3L' },
        { min: 310000, max: 600000, percentage: 2.5, label: '₹3.1L - ₹6L' },
        { min: 610000, max: 900000, percentage: 3, label: '₹6.1L - ₹9L' },
        { min: 910000, max: 1200000, percentage: 3.5, label: '₹9.1L - ₹12L' },
        { min: 1210000, max: 1500000, percentage: 4, label: '₹12.1L - ₹15L' },
        { min: 1510000, max: 2000000, percentage: 4.5, label: '₹15.1L - ₹20L' },
        { min: 2150000, max: Infinity, percentage: 5, label: 'Above ₹21.5L' }
      ];

      return successResponse(res, slabs, 'Incentive slabs retrieved successfully');
    } catch (error) {
      logger.error('Get incentive slabs error:', error);
      next(error);
    }
  }

  /**
   * Get pending approval incentives
   */
  async getPendingApprovals(req, res, next) {
    try {
      const { organizationId } = req;
      const { department, page = 1, limit = 20 } = req.query;

      // Build filter
      const matchFilter = {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: 'pending'
      };

      // Get pending incentives with employee data
      const pipeline = [
        { $match: matchFilter },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' }
      ];

      // Add department filter if specified
      if (department && department !== 'all') {
        pipeline.push({
          $match: { 'employee.employment.department': new RegExp(department, 'i') }
        });
      }

      pipeline.push(
        {
          $group: {
            _id: '$employeeId',
            employee: { $first: '$employee' },
            totalSales: { $sum: '$salesAmount' },
            totalIncentive: { $sum: '$incentiveAmount' },
            salesCount: { $sum: 1 },
            incentives: { $push: '$$ROOT' }
          }
        },
        { $sort: { totalIncentive: -1 } }
      );

      const pendingIncentives = await Incentive.aggregate(pipeline);

      // Transform data
      const transformedData = pendingIncentives.map(item => ({
        employeeId: item._id,
        employeeCode: item.employee?.employeeId,
        name: `${item.employee?.personalInfo?.firstName || ''} ${item.employee?.personalInfo?.lastName || ''}`.trim(),
        department: item.employee?.employment?.department || 'N/A',
        designation: item.employee?.employment?.designation || 'N/A',
        totalSales: item.totalSales,
        totalIncentive: item.totalIncentive,
        salesCount: item.salesCount,
        status: 'pending'
      }));

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedData = transformedData.slice(skip, skip + parseInt(limit));

      return successResponse(res, {
        data: paginatedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transformedData.length,
          totalPages: Math.ceil(transformedData.length / parseInt(limit))
        }
      }, 'Pending approvals retrieved successfully');
    } catch (error) {
      logger.error('Get pending approvals error:', error);
      next(error);
    }
  }

  /**
   * Approve incentive
   */
  async approveIncentive(req, res, next) {
    try {
      const { organizationId, user } = req;
      const { employeeId } = req.params;

      // Update all pending incentives for the employee to approved
      const result = await Incentive.updateMany(
        {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          employeeId: new mongoose.Types.ObjectId(employeeId),
          status: 'pending'
        },
        {
          $set: {
            status: 'approved',
            approvedBy: user._id,
            approvedAt: new Date()
          }
        }
      );

      if (result.modifiedCount === 0) {
        return notFoundResponse(res, 'Pending incentive');
      }

      logger.info(`Incentives approved for employee ${employeeId} by user ${user._id}`);

      return successResponse(res, { modifiedCount: result.modifiedCount }, 'Incentive approved successfully');
    } catch (error) {
      logger.error('Approve incentive error:', error);
      next(error);
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year, department, page = 1, limit = 20 } = req.query;

      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);

      // Build pipeline
      const pipeline = [
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: { $in: ['approved', 'paid'] },
            $or: [
              { paidDate: { $gte: startDate, $lte: endDate } },
              { createdAt: { $gte: startDate, $lte: endDate } }
            ]
          }
        },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' }
      ];

      if (department && department !== 'all') {
        pipeline.push({
          $match: { 'employee.employment.department': new RegExp(department, 'i') }
        });
      }

      pipeline.push(
        {
          $group: {
            _id: '$employeeId',
            employee: { $first: '$employee' },
            totalSales: { $sum: '$salesAmount' },
            totalIncentive: { $sum: '$incentiveAmount' },
            incentivePercent: { $first: '$incentivePercentage' },
            paymentDate: { $max: '$paidDate' },
            status: { $last: '$status' }
          }
        },
        { $sort: { paymentDate: -1 } }
      );

      const paymentHistory = await Incentive.aggregate(pipeline);

      // Transform data
      const transformedData = paymentHistory.map(item => ({
        employeeId: item._id,
        employeeCode: item.employee?.employeeId,
        name: `${item.employee?.personalInfo?.firstName || ''} ${item.employee?.personalInfo?.lastName || ''}`.trim(),
        department: item.employee?.employment?.department || 'N/A',
        designation: item.employee?.employment?.designation || 'N/A',
        totalSales: item.totalSales,
        totalIncentive: item.totalIncentive,
        incentivePercent: item.incentivePercent || 2.5,
        paymentDate: item.paymentDate || new Date(),
        paymentCycle: new Date(targetYear, targetMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        status: item.status
      }));

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedData = transformedData.slice(skip, skip + parseInt(limit));

      return successResponse(res, {
        data: paginatedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transformedData.length,
          totalPages: Math.ceil(transformedData.length / parseInt(limit))
        }
      }, 'Payment history retrieved successfully');
    } catch (error) {
      logger.error('Get payment history error:', error);
      next(error);
    }
  }
}

export default new IncentiveController();