import mongoose from 'mongoose';
import Employee from '../../models/Employee.js';
import Incentive from '../../models/Incentive.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

class PayrollController {
  /**
   * Get payroll dashboard data
   */
  async getDashboardStats(req, res, next) {
    try {
      const { organizationId } = req;

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      // Get all active employees with salary data
      const employees = await Employee.find({
        organizationId,
        status: 'active'
      }).select('personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation salary');

      // Calculate total payroll
      const totalEmployeesPaid = employees.length;
      const totalPayrollAmount = employees.reduce((sum, emp) => {
        const salary = emp.salary?.basic || 0;
        const allowances = emp.salary?.allowances || 0;
        return sum + salary + allowances;
      }, 0);
      const averageSalary = totalEmployeesPaid > 0 ? Math.round(totalPayrollAmount / totalEmployeesPaid) : 0;

      // Get incentive data
      const currentMonthIncentives = await Incentive.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'paid',
            paidDate: { $gte: startOfMonth, $lte: today }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$incentiveAmount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const pendingIncentives = await Incentive.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'pending'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$incentiveAmount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const lastMonthIncentives = await Incentive.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'paid',
            paidDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$incentiveAmount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const totalIncentivePaid = currentMonthIncentives[0]?.totalAmount || 0;
      const pendingPayroll = pendingIncentives[0]?.totalAmount || 0;

      // Calculate incentive trend
      const incentiveTrend = lastMonthIncentives[0]?.totalAmount || 0;
      const incentiveTrendPercent = incentiveTrend > 0
        ? Math.round(((totalIncentivePaid - incentiveTrend) / incentiveTrend) * 100)
        : 0;

      // Department breakdown
      const departmentBreakdown = await Employee.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'active'
          }
        },
        {
          $group: {
            _id: '$employment.department',
            count: { $sum: 1 },
            totalSalary: {
              $sum: { $add: ['$salary.basic', { $ifNull: ['$salary.allowances', 0] }] }
            },
            totalIncentives: { $sum: { $ifNull: ['$salary.incentives', 0] } }
          }
        },
        { $sort: { totalSalary: -1 } }
      ]);

      // Payroll trend (last 7 months)
      const payrollTrend = [];
      for (let i = 6; i >= 0; i--) {
        const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
        const monthName = monthStart.toLocaleString('default', { month: 'short' });

        // Get paid incentives for the month
        const monthIncentives = await Incentive.aggregate([
          {
            $match: {
              organizationId: new mongoose.Types.ObjectId(organizationId),
              status: 'paid',
              paidDate: { $gte: monthStart, $lte: monthEnd }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$incentiveAmount' }
            }
          }
        ]);

        payrollTrend.push({
          month: monthName,
          amount: totalPayrollAmount, // Use current payroll as estimate
          incentive: monthIncentives[0]?.total || 0
        });
      }

      // Department cost distribution
      const totalCost = departmentBreakdown.reduce((sum, d) => sum + d.totalSalary, 0);
      const departmentCostDistribution = departmentBreakdown.map((d, index) => ({
        department: d._id,
        amount: d.totalSalary,
        percentage: totalCost > 0 ? Math.round((d.totalSalary / totalCost) * 100) : 0,
        color: PayrollController.getDepartmentColor(index)
      }));

      // Top incentive earners
      const topEarners = await Incentive.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'paid',
            paidDate: { $gte: startOfMonth, $lte: today }
          }
        },
        {
          $group: {
            _id: '$employeeId',
            totalIncentive: { $sum: '$incentiveAmount' },
            incentiveCount: { $sum: 1 }
          }
        },
        { $sort: { totalIncentive: -1 } },
        { $limit: 5 }
      ]);

      // Populate employee details
      const populatedTopEarners = await Promise.all(
        topEarners.map(async (earner) => {
          const employee = await Employee.findById(earner._id)
            .select('personalInfo.firstName personalInfo.lastName employeeId employment.department');
          return {
            employeeId: earner._id,
            name: employee ? `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim() : 'Unknown',
            department: employee?.employment?.department || 'N/A',
            incentive: earner.totalIncentive,
            count: earner.incentiveCount
          };
        })
      );

      // Processing status (simulated - in real app would come from payroll run)
      const processingStatus = {
        status: 'completed',
        progress: 100,
        lastProcessed: new Date()
      };

      const stats = {
        kpis: {
          totalEmployeesPaid: {
            value: totalEmployeesPaid,
            label: 'Employees Paid',
            sublabel: 'This month',
            trend: '+2'
          },
          totalPayrollAmount: {
            value: totalPayrollAmount,
            label: 'Total Payroll',
            sublabel: 'This month',
            trend: '+5%'
          },
          totalIncentivePaid: {
            value: totalIncentivePaid,
            label: 'Incentives Paid',
            sublabel: 'This month',
            trend: incentiveTrendPercent >= 0 ? `+${incentiveTrendPercent}%` : `${incentiveTrendPercent}%`
          },
          pendingPayroll: {
            value: pendingPayroll,
            label: 'Pending Incentives',
            sublabel: 'Awaiting approval',
            trend: pendingIncentives[0]?.count || 0
          },
          averageSalary: {
            value: averageSalary,
            label: 'Avg. Salary',
            sublabel: 'Per employee',
            trend: '+3%'
          },
          processingStatus: {
            value: processingStatus.status === 'completed' ? 'Completed' : 'Processing',
            label: processingStatus.status === 'completed' ? 'All processed' : 'In progress',
            progress: processingStatus.progress
          }
        },
        payrollTrend,
        departmentCostDistribution,
        topIncentiveEarners: populatedTopEarners,
        processingStatus
      };

      return successResponse(res, stats, 'Payroll dashboard stats retrieved successfully');
    } catch (error) {
      logger.error('Get payroll dashboard stats error:', error);
      next(error);
    }
  }

  /**
   * Get department-wise salary breakdown
   */
  async getDepartmentBreakdown(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year } = req.query;

      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      // Get employees grouped by department
      const departmentData = await Employee.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'active'
          }
        },
        {
          $group: {
            _id: '$employment.department',
            employees: { $sum: 1 },
            totalBasic: { $sum: '$salary.basic' },
            totalAllowances: { $sum: { $ifNull: ['$salary.allowances', 0] } },
            totalIncentives: { $sum: { $ifNull: ['$salary.incentives', 0] } }
          }
        },
        { $sort: { totalBasic: -1 } }
      ]);

      // Get overtime data (simulated - in real app would come from attendance/timesheet)
      // For now, we'll use a placeholder calculation
      const departmentPayroll = await Promise.all(
        departmentData.map(async (dept) => {
          // Get department incentives from Incentive model
          const deptIncentives = await Incentive.aggregate([
            {
              $match: {
                organizationId: new mongoose.Types.ObjectId(organizationId),
                status: 'paid'
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
            {
              $unwind: '$employee'
            },
            {
              $match: {
                'employee.employment.department': dept._id
              }
            },
            {
              $group: {
                _id: null,
                totalIncentive: { $sum: '$incentiveAmount' }
              }
            }
          ]);

          const totalSalary = dept.totalBasic + dept.totalAllowances;
          const overtime = Math.round(dept.employees * 2000); // Placeholder
          const deductions = Math.round(totalSalary * 0.05); // 5% deductions placeholder
          const netAmount = totalSalary + overtime - deductions;

          return {
            department: dept._id,
            employees: dept.employees,
            totalSalary,
            avgSalary: Math.round(totalSalary / dept.employees),
            overtime,
            deductions,
            netAmount
          };
        })
      );

      return successResponse(res, departmentPayroll, 'Department payroll breakdown retrieved successfully');
    } catch (error) {
      logger.error('Get department payroll breakdown error:', error);
      next(error);
    }
  }

  /**
   * Get employee salary data
   */
  async getEmployeeSalaries(req, res, next) {
    try {
      const { organizationId } = req;
      const { department, page = 1, limit = 20 } = req.query;

      const query = { organizationId, status: 'active' };
      if (department && department !== 'all') {
        query['employment.department'] = new RegExp(department, 'i');
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const employees = await Employee.find(query)
        .select('employeeId personalInfo.firstName personalInfo.lastName employment.department employment.designation employment.joiningDate salary')
        .sort({ 'employment.department': 1, 'personalInfo.firstName': 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Employee.countDocuments(query);

      const salaryData = employees.map(emp => ({
        employeeId: emp._id,
        employeeCode: emp.employeeId,
        name: `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim(),
        department: emp.employment?.department || 'N/A',
        designation: emp.employment?.designation || 'N/A',
        joiningDate: emp.employment?.joiningDate,
        basic: emp.salary?.basic || 0,
        allowances: emp.salary?.allowances || 0,
        incentives: emp.salary?.incentives || 0,
        totalSalary: (emp.salary?.basic || 0) + (emp.salary?.allowances || 0)
      }));

      return successResponse(res, {
        data: salaryData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }, 'Employee salary data retrieved successfully');
    } catch (error) {
      logger.error('Get employee salaries error:', error);
      next(error);
    }
  }

  /**
   * Get payroll processing steps status
   */
  async getProcessingStatus(req, res, next) {
    try {
      const { organizationId } = req;
      const { month, year } = req.query;

      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      // In a real application, this would check actual payroll run status
      // For now, we simulate based on date
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const isCurrentMonth = targetMonth === currentMonth && targetYear === currentYear;

      let steps = [];
      if (isCurrentMonth) {
        // Current month processing
        const dayOfMonth = today.getDate();
        steps = [
          { step: 1, title: 'Data Collection', subtitle: 'Attendance & leaves', status: 'completed' },
          { step: 2, title: 'Verification', subtitle: 'Manager approval', status: dayOfMonth > 5 ? 'completed' : 'in_progress' },
          { step: 3, title: 'Processing', subtitle: 'Calculating deductions', status: dayOfMonth > 10 ? 'completed' : dayOfMonth > 5 ? 'in_progress' : 'pending' },
          { step: 4, title: 'Approval', subtitle: 'Finance review', status: dayOfMonth > 20 ? 'completed' : dayOfMonth > 15 ? 'in_progress' : 'pending' },
          { step: 5, title: 'Disbursement', subtitle: 'Salary transfer', status: dayOfMonth > 25 ? 'completed' : 'pending' }
        ];
      } else if (targetMonth < currentMonth || targetYear < currentYear) {
        // Past month - all completed
        steps = [
          { step: 1, title: 'Data Collection', subtitle: 'Attendance & leaves', status: 'completed' },
          { step: 2, title: 'Verification', subtitle: 'Manager approval', status: 'completed' },
          { step: 3, title: 'Processing', subtitle: 'Calculating deductions', status: 'completed' },
          { step: 4, title: 'Approval', subtitle: 'Finance review', status: 'completed' },
          { step: 5, title: 'Disbursement', subtitle: 'Salary transfer', status: 'completed' }
        ];
      } else {
        // Future month - all pending
        steps = [
          { step: 1, title: 'Data Collection', subtitle: 'Attendance & leaves', status: 'pending' },
          { step: 2, title: 'Verification', subtitle: 'Manager approval', status: 'pending' },
          { step: 3, title: 'Processing', subtitle: 'Calculating deductions', status: 'pending' },
          { step: 4, title: 'Approval', subtitle: 'Finance review', status: 'pending' },
          { step: 5, title: 'Disbursement', subtitle: 'Salary transfer', status: 'pending' }
        ];
      }

      return successResponse(res, steps, 'Processing status retrieved successfully');
    } catch (error) {
      logger.error('Get processing status error:', error);
      next(error);
    }
  }

  /**
   * Get single employee salary details
   */
  async getEmployeeSalaryDetails(req, res, next) {
    try {
      const { organizationId } = req;
      const { employeeId } = req.params;

      const employee = await Employee.findOne({
        _id: employeeId,
        organizationId,
        status: 'active'
      }).select('employeeId personalInfo firstName lastName employment department designation joiningDate salary bankDetails');

      if (!employee) {
        return errorResponse(res, 'Employee not found', 404);
      }

      // Calculate salary components
      const basic = employee.salary?.basic || 0;
      const hra = Math.round(basic * 0.25); // 25% of basic
      const conveyance = employee.salary?.allowances ? Math.round(employee.salary.allowances * 0.3) : 2000;
      const attendancePay = 0; // Would come from attendance
      const otherAllowances = employee.salary?.allowances ? Math.round(employee.salary.allowances * 0.7) : 0;

      // Calculate deductions
      const providentFund = Math.round(basic * 0.12); // 12% PF
      const esic = basic <= 21000 ? Math.round((basic + hra) * 0.0075) : 0; // 0.75% ESIC if salary <= 21k
      const professionalTax = 200; // Fixed PT
      const loan = 0; // Would come from loans module
      const other = 0;

      const workingDays = 26; // Standard working days
      const presentDays = workingDays; // Would come from attendance

      const salaryDetails = {
        employeeId: employee._id,
        employeeCode: employee.employeeId,
        name: `${employee.personalInfo?.firstName || ''} ${employee.personalInfo?.lastName || ''}`.trim(),
        designation: employee.employment?.designation || 'N/A',
        department: employee.employment?.department || 'N/A',
        dateOfJoining: employee.employment?.joiningDate,
        modeOfPayment: employee.bankDetails?.accountNumber ? 'Bank Transfer' : 'Cash',
        accountNumber: employee.bankDetails?.accountNumber ? `XXXX${employee.bankDetails.accountNumber.slice(-4)}` : 'N/A',
        workingDays,
        presentDays,
        absentDays: workingDays - presentDays,
        perDaySalary: Math.round(basic / workingDays),
        earnings: {
          basic,
          hra,
          conveyance,
          attendancePay,
          otherAllowances
        },
        deductions: {
          providentFund,
          esic,
          professionalTax,
          loan,
          other
        },
        status: 'processed'
      };

      return successResponse(res, salaryDetails, 'Employee salary details retrieved successfully');
    } catch (error) {
      logger.error('Get employee salary details error:', error);
      next(error);
    }
  }

  /**
   * Get incentive slabs configuration
   */
  async getIncentiveSlabs(req, res, next) {
    try {
      // Default incentive slabs configuration
      const incentiveSlabs = [
        { min: 10000, max: 300000, percentage: 2 },
        { min: 310000, max: 600000, percentage: 2.5 },
        { min: 610000, max: 900000, percentage: 3 },
        { min: 910000, max: 1200000, percentage: 3.5 },
        { min: 1210000, max: 1500000, percentage: 4 },
        { min: 1510000, max: 2000000, percentage: 4.5 },
        { min: 2150000, max: Infinity, percentage: 5 }
      ];

      return successResponse(res, incentiveSlabs, 'Incentive slabs retrieved successfully');
    } catch (error) {
      logger.error('Get incentive slabs error:', error);
      next(error);
    }
  }

  /**
   * Get sales incentive data for incentive calculator
   */
  async getSalesIncentiveData(req, res, next) {
    try {
      const { organizationId } = req;
      const { employeeId, month, year } = req.query;

      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);

      // Build query
      const matchQuery = {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        salesDate: { $gte: startDate, $lte: endDate }
      };

      if (employeeId) {
        matchQuery.employeeId = new mongoose.Types.ObjectId(employeeId);
      }

      // Get sales incentive records
      const incentives = await Incentive.find(matchQuery)
        .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
        .sort({ salesDate: 1 });

      // Format sales data
      const salesData = incentives.map((inc, index) => ({
        id: index + 1,
        employeeId: inc.employeeId?._id,
        employeeName: inc.employeeId ? `${inc.employeeId.personalInfo?.firstName || ''} ${inc.employeeId.personalInfo?.lastName || ''}`.trim() : 'Unknown',
        clientName: inc.description || 'Client',
        date: inc.salesDate.toISOString().split('T')[0],
        estimate: inc.salesAmount,
        dealAmount: inc.salesAmount,
        receipt: inc.salesAmount, // For now, assume full receipt
        remarks: inc.notes || '',
        incentivePercentage: inc.incentivePercentage,
        incentiveAmount: inc.incentiveAmount,
        status: inc.status
      }));

      // Calculate totals
      const totalSales = salesData.reduce((sum, sale) => sum + sale.receipt, 0);
      const totalDealAmount = salesData.reduce((sum, sale) => sum + sale.dealAmount, 0);
      const totalIncentive = salesData.reduce((sum, sale) => sum + sale.incentiveAmount, 0);

      return successResponse(res, {
        salesData,
        summary: {
          totalSales,
          totalDealAmount,
          totalIncentive,
          recordCount: salesData.length
        },
        month: targetMonth,
        year: targetYear
      }, 'Sales incentive data retrieved successfully');
    } catch (error) {
      logger.error('Get sales incentive data error:', error);
      next(error);
    }
  }

  // Helper method (static)
  static getDepartmentColor(index) {
    const colors = ['#A60000', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'];
    return colors[index % colors.length];
  }
}

export default new PayrollController();