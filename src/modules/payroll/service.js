import mongoose from 'mongoose';
import SalaryStructure from '../../models/SalaryStructure.js';
import PayrollRun from '../../models/PayrollRun.js';
import Payslip from '../../models/Payslip.js';
import Employee from '../../models/Employee.js';
import Attendance from '../../models/Attendance.js';
import Incentive from '../../models/Incentive.js';
import LeaveRequest from '../../models/LeaveRequest.js';

class PayrollService {
  // ==================== Salary Structure Methods ====================

  /**
   * Get all salary structures for organization
   */
  async getSalaryStructures(organizationId, filters = {}, options = {}) {
    const query = { organizationId, isActive: true };

    if (filters.department) {
      // Need to join with employees to filter by department
    }

    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const structures = await SalaryStructure.find(query)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SalaryStructure.countDocuments(query);

    return {
      structures,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get salary structure for employee
   */
  async getSalaryStructureForEmployee(employeeId) {
    return SalaryStructure.getActiveForEmployee(employeeId)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department');
  }

  /**
   * Create or update salary structure
   */
  async createOrUpdateSalaryStructure(data) {
    const { employeeId, organizationId } = data;

    // Deactivate existing structures
    await SalaryStructure.updateMany(
      { employeeId, isActive: true },
      { isActive: false, effectiveTo: new Date() }
    );

    // Create new structure
    const structure = new SalaryStructure({
      ...data,
      effectiveFrom: new Date()
    });

    await structure.save();
    return structure;
  }

  /**
   * Update salary structure
   */
  async updateSalaryStructure(id, data) {
    const structure = await SalaryStructure.findByIdAndUpdate(
      id,
      { $set: { ...data, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );
    return structure;
  }

  // ==================== Payroll Run Methods ====================

  /**
   * Get payroll runs
   */
  async getPayrollRuns(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.year) {
      query.year = filters.year;
    }
    if (filters.month) {
      query.month = filters.month;
    }

    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const runs = await PayrollRun.find(query)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('processedBy', 'profile.firstName profile.lastName email')
      .populate('approvedBy', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PayrollRun.countDocuments(query);

    return {
      runs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get payroll run by ID
   */
  async getPayrollRunById(id) {
    return PayrollRun.findById(id)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('departmentSummary');
  }

  /**
   * Create payroll run
   */
  async createPayrollRun(data) {
    // Check if payroll already exists for this month
    const exists = await PayrollRun.existsForMonth(
      data.organizationId,
      data.month,
      data.year
    );

    if (exists) {
      throw new Error('Payroll already processed for this month');
    }

    const run = new PayrollRun(data);
    await run.save();
    return run;
  }

  /**
   * Process payroll run
   */
  async processPayrollRun(runId, processedBy) {
    const run = await PayrollRun.findById(runId);
    if (!run) {
      throw new Error('Payroll run not found');
    }

    if (run.status !== 'draft') {
      throw new Error('Only draft payroll runs can be processed');
    }

    // Start processing
    await run.startProcessing(processedBy);

    // Get all active employees
    const employees = await Employee.find({
      organizationId: run.organizationId,
      status: 'active'
    });

    const payslips = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalIncentives = 0;
    const departmentSummary = {};

    for (const employee of employees) {
      // Get salary structure
      const salaryStructure = await SalaryStructure.getActiveForEmployee(employee._id);

      if (!salaryStructure) {
        console.log(`No salary structure for employee ${employee.employeeId}`);
        continue;
      }

      // Get attendance for the month
      const startDate = new Date(run.year, run.month - 1, 1);
      const endDate = new Date(run.year, run.month, 0);

      const attendance = await Attendance.find({
        employeeId: employee._id,
        date: { $gte: startDate, $lte: endDate }
      });

      // Calculate working days
      const workingDays = this.getWorkingDays(startDate, endDate);
      const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'half_day').length;
      const halfDays = attendance.filter(a => a.status === 'half_day').length;
      const absentDays = attendance.filter(a => a.status === 'absent').length;

      // Get unpaid leaves
      const unpaidLeaves = await LeaveRequest.countDocuments({
        employeeId: employee._id,
        status: 'approved',
        leaveTypeId: { $in: await this.getUnpaidLeaveTypeIds(run.organizationId) },
        startDate: { $gte: startDate, $lte: endDate }
      });

      // Calculate late mark deductions
      const lateMarks = attendance.filter(a => a.lateMinutes > 0).length;
      const lateMarkDeduction = this.calculateLateMarkDeduction(lateMarks, salaryStructure.grossSalary, workingDays);

      // Get incentives for the month
      const incentives = await Incentive.find({
        employeeId: employee._id,
        status: 'paid',
        paidDate: { $gte: startDate, $lte: endDate }
      });

      const totalIncentiveAmount = incentives.reduce((sum, inc) => sum + inc.incentiveAmount, 0);

      // Calculate salary
      const salaryCalculation = salaryStructure.calculateMonthlySalary(
        workingDays,
        presentDays + (halfDays * 0.5),
        unpaidLeaves + absentDays,
        lateMarkDeduction
      );

      // Calculate YTD totals
      const ytd = await Payslip.calculateYTD(employee._id, run.month, run.year);

      // Create payslip
      const payslip = new Payslip({
        organizationId: run.organizationId,
        payrollRunId: run._id,
        employeeId: employee._id,
        salaryStructureId: salaryStructure._id,
        month: run.month,
        year: run.year,
        employeeDetails: {
          employeeCode: employee.employeeId,
          firstName: employee.personalInfo.firstName,
          lastName: employee.personalInfo.lastName,
          department: employee.employment.department,
          designation: employee.employment.designation,
          bankAccount: employee.bankDetails?.accountNumber,
          bankName: employee.bankDetails?.bankName,
          ifscCode: employee.bankDetails?.ifscCode
        },
        attendance: {
          workingDays,
          presentDays,
          absentDays,
          paidLeaves: 0,
          unpaidLeaves: unpaidLeaves + absentDays,
          halfDays,
          lateMarks
        },
        earnings: [
          { name: 'Basic Salary', amount: salaryCalculation.earnings.basic },
          { name: 'House Rent Allowance', amount: salaryCalculation.earnings.hra },
          { name: 'Conveyance', amount: salaryCalculation.earnings.conveyance },
          { name: 'Medical Allowance', amount: salaryCalculation.earnings.medicalAllowance },
          { name: 'Special Allowance', amount: salaryCalculation.earnings.specialAllowance },
          { name: 'Leave Travel Allowance', amount: salaryCalculation.earnings.lta },
          { name: 'Other Allowances', amount: salaryCalculation.earnings.otherAllowances }
        ].filter(e => e.amount > 0),
        grossEarnings: salaryCalculation.payableGross,
        deductions: [
          { name: 'Provident Fund', amount: salaryCalculation.deductions.pf, type: 'statutory' },
          { name: 'ESI', amount: salaryCalculation.deductions.esi, type: 'statutory' },
          { name: 'Professional Tax', amount: salaryCalculation.deductions.professionalTax, type: 'statutory' },
          { name: 'TDS', amount: salaryCalculation.deductions.tds, type: 'statutory' },
          { name: 'Unpaid Leave Deduction', amount: salaryCalculation.deductions.unpaidLeave, type: 'other' },
          { name: 'Late Mark Deduction', amount: salaryCalculation.deductions.lateMark, type: 'other' }
        ].filter(d => d.amount > 0),
        grossDeductions: salaryCalculation.deductions.pf + salaryCalculation.deductions.esi +
          salaryCalculation.deductions.professionalTax + salaryCalculation.deductions.tds +
          salaryCalculation.deductions.unpaidLeave + salaryCalculation.deductions.lateMark,
        lateMarkDeduction: salaryCalculation.deductions.lateMark,
        incentiveAmount: totalIncentiveAmount,
        incentiveDetails: incentives.map(i => ({
          incentiveId: i._id,
          amount: i.incentiveAmount,
          reason: i.reason
        })),
        netSalary: salaryCalculation.netSalary + totalIncentiveAmount,
        perDaySalary: salaryCalculation.perDaySalary,
        ytd,
        createdBy: processedBy
      });

      await payslip.save();
      payslips.push(payslip);

      // Update totals
      totalGross += salaryCalculation.payableGross;
      totalDeductions += salaryCalculation.grossDeductions;
      totalNet += salaryCalculation.netSalary + totalIncentiveAmount;
      totalIncentives += totalIncentiveAmount;

      // Update department summary
      const dept = employee.employment.department;
      if (!departmentSummary[dept]) {
        departmentSummary[dept] = {
          department: dept,
          employeeCount: 0,
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0
        };
      }
      departmentSummary[dept].employeeCount++;
      departmentSummary[dept].totalGross += salaryCalculation.payableGross;
      departmentSummary[dept].totalDeductions += salaryCalculation.grossDeductions;
      departmentSummary[dept].totalNet += salaryCalculation.netSalary;
    }

    // Mark as processed
    await run.markProcessed(processedBy, {
      totalEmployees: employees.length,
      processedEmployees: payslips.length,
      totalGross,
      totalDeductions,
      totalNet,
      totalIncentives,
      departmentSummary: Object.values(departmentSummary)
    });

    return {
      run,
      payslips
    };
  }

  /**
   * Approve payroll run
   */
  async approvePayrollRun(runId, approverId, comments) {
    const run = await PayrollRun.findById(runId);
    if (!run) {
      throw new Error('Payroll run not found');
    }
    await run.approve(approverId, comments);
    return run;
  }

  /**
   * Mark payroll as paid
   */
  async markPayrollPaid(runId, userId, paymentDate) {
    const run = await PayrollRun.findById(runId);
    if (!run) {
      throw new Error('Payroll run not found');
    }

    // Update all payslips as paid
    await Payslip.updateMany(
      { payrollRunId: runId },
      { paymentStatus: 'paid', paymentDate: paymentDate || new Date() }
    );

    await run.markPaid(userId, paymentDate);
    return run;
  }

  // ==================== Payslip Methods ====================

  /**
   * Get payslips for payroll run
   */
  async getPayslipsForRun(payrollRunId) {
    return Payslip.getForPayrollRun(payrollRunId);
  }

  /**
   * Get payslips for employee
   */
  async getEmployeePayslips(employeeId, year) {
    return Payslip.getForEmployee(employeeId, year);
  }

  /**
   * Get payslip by ID
   */
  async getPayslipById(id) {
    return Payslip.findById(id)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('payrollRunId', 'name month year');
  }

  // ==================== Helper Methods ====================

  /**
   * Get working days in a month
   */
  getWorkingDays(startDate, endDate) {
    let workingDays = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Exclude Sundays and Saturdays
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Calculate late mark deduction
   */
  calculateLateMarkDeduction(lateMarks, grossSalary, workingDays) {
    // 3 late marks = 0.5 day deduction
    // 5 late marks = 1 day deduction
    if (lateMarks < 3) return 0;

    const perDaySalary = grossSalary / workingDays;
    let deduction = 0;

    if (lateMarks >= 3) deduction += perDaySalary * 0.5;
    if (lateMarks >= 5) deduction += perDaySalary * 0.5;

    return Math.round(deduction);
  }

  /**
   * Get unpaid leave type IDs
   */
  async getUnpaidLeaveTypeIds(organizationId) {
    const LeaveType = mongoose.model('LeaveType');
    const unpaidTypes = await LeaveType.find({
      organizationId,
      isPaid: false
    });
    return unpaidTypes.map(t => t._id);
  }

  // ==================== Dashboard Methods ====================

  /**
   * Get payroll dashboard stats
   */
  async getDashboardStats(organizationId) {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Get current month's payroll run
    const currentRun = await PayrollRun.findOne({
      organizationId,
      month: currentMonth,
      year: currentYear
    });

    // Get all employees
    const totalEmployees = await Employee.countDocuments({
      organizationId,
      status: 'active'
    });

    // Get current month payslips
    let paidEmployees = 0;
    let totalPayroll = 0;
    let totalDeductions = 0;
    let totalIncentives = 0;

    if (currentRun) {
      const stats = await Payslip.aggregate([
        { $match: { payrollRunId: currentRun._id } },
        {
          $group: {
            _id: null,
            paidEmployees: { $sum: 1 },
            totalGross: { $sum: '$grossEarnings' },
            totalDeductions: { $sum: '$grossDeductions' },
            totalNet: { $sum: '$netSalary' },
            totalIncentives: { $sum: '$incentiveAmount' }
          }
        }
      ]);

      if (stats.length > 0) {
        paidEmployees = stats[0].paidEmployees;
        totalPayroll = stats[0].totalNet;
        totalDeductions = stats[0].totalDeductions;
        totalIncentives = stats[0].totalIncentives;
      }
    }

    // Get pending incentives
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
          total: { $sum: '$incentiveAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Department breakdown
    const departmentBreakdown = await Payslip.aggregate([
      {
        $match: currentRun ? { payrollRunId: currentRun._id } : {}
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $group: {
          _id: '$employee.employment.department',
          employees: { $sum: 1 },
          totalGross: { $sum: '$grossEarnings' },
          totalDeductions: { $sum: '$grossDeductions' },
          totalNet: { $sum: '$netSalary' }
        }
      },
      { $sort: { totalNet: -1 } }
    ]);

    return {
      currentMonth: {
        month: currentMonth,
        year: currentYear,
        run: currentRun,
        stats: {
          totalEmployees,
          paidEmployees,
          totalPayroll,
          totalDeductions,
          totalIncentives,
          pendingIncentives: pendingIncentives[0]?.total || 0,
          pendingIncentivesCount: pendingIncentives[0]?.count || 0
        }
      },
      departmentBreakdown: departmentBreakdown.map(d => ({
        department: d._id,
        employees: d.employees,
        totalGross: d.totalGross,
        totalDeductions: d.totalDeductions,
        totalNet: d.totalNet
      }))
    };
  }
}

export default new PayrollService();