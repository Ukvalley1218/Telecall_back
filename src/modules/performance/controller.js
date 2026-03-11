import mongoose from 'mongoose';
import Employee from '../../models/Employee.js';
import KPI from '../../models/KPI.js';
import Attendance from '../../models/Attendance.js';
import { successResponse, notFoundResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

// Helper functions (standalone to avoid `this` context issues)
function getKPIGroupForDepartment(department) {
  const mapping = {
    'Sales': 'Sales',
    'Interior Design': 'Design',
    'Production': 'Production',
    'Recruitment HR': 'Recruitment',
    'IT': 'IT',
    'Marketing': 'Marketing',
    'Finance': 'Finance'
  };
  return mapping[department] || 'Other';
}

function calculateScore(percentage) {
  if (percentage >= 100) return 5.0;
  if (percentage >= 90) return 4.5;
  if (percentage >= 80) return 4.0;
  if (percentage >= 70) return 3.5;
  if (percentage >= 60) return 3.0;
  if (percentage >= 50) return 2.5;
  if (percentage >= 40) return 2.0;
  return 1.5;
}

function calculateOverallScore(kpiPerformance) {
  if (kpiPerformance.length === 0) return 3.0;

  const totalWeightage = kpiPerformance.reduce((sum, kpi) => sum + (kpi.weightage || 1), 0);
  const weightedScore = kpiPerformance.reduce((sum, kpi) => {
    return sum + (kpi.score * (kpi.weightage || 1));
  }, 0);

  return weightedScore / totalWeightage;
}

async function getAttendanceScore(employeeId, organizationId) {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const today = new Date();

  const attendance = await Attendance.find({
    employeeId,
    organizationId,
    date: { $gte: startOfMonth, $lte: today }
  });

  if (attendance.length === 0) return 4.0;

  const presentDays = attendance.filter(a => a.status === 'present').length;
  const totalDays = attendance.length;
  const attendanceRate = (presentDays / totalDays) * 100;

  if (attendanceRate >= 95) return 5.0;
  if (attendanceRate >= 90) return 4.5;
  if (attendanceRate >= 85) return 4.0;
  if (attendanceRate >= 80) return 3.5;
  if (attendanceRate >= 75) return 3.0;
  return 2.5;
}

function calculateIncentive(basicSalary, score) {
  const percentage = (score - 2.5) * 2; // 0-5%
  return Math.floor(basicSalary * (percentage / 100));
}

function getRandomChallenges(department) {
  const challenges = {
    'Sales': ['Client negotiation delays', 'Lead quality issues', 'Market competition', 'Price objections'],
    'Interior Design': ['Material sourcing delays', 'Client revision requests', 'Timeline constraints', 'Budget limitations'],
    'Production': ['Machine breakdown', 'Raw material shortage', 'Labor shortage', 'Quality issues'],
    'Recruitment HR': ['Candidate availability', 'Salary negotiations', 'High drop-off rate', 'Notice period delays'],
    'IT': ['Legacy system issues', 'Resource constraints', 'Security concerns', 'Technical debt'],
    'Marketing': ['Budget constraints', 'Low engagement', 'Platform changes', 'Content creation delays'],
    'Finance': ['Payment delays', 'Compliance issues', 'Budget tracking', 'Documentation']
  };
  return (challenges[department] || ['General challenges']).slice(0, 2);
}

function getRandomGoodNews(department) {
  const goodNews = {
    'Sales': ['Closed major deal', 'Exceeded monthly target', 'New client acquired', 'Highest conversion rate'],
    'Interior Design': ['Design featured in magazine', 'Client approved first draft', 'Multiple project completion', 'Award nomination'],
    'Production': ['Zero safety incidents', 'Team efficiency improved', 'Quality target achieved', 'On-time delivery'],
    'Recruitment HR': ['Multiple hires completed', 'Low time-to-hire', 'High offer acceptance', 'Candidate pipeline full'],
    'IT': ['System uptime 100%', 'Zero critical bugs', 'Major feature launch', 'Performance improvement'],
    'Marketing': ['Campaign success', 'Viral content created', 'Lead generation record', 'Engagement increased'],
    'Finance': ['On-time closing', 'Audit cleared', 'Cost savings achieved', 'Process improvement']
  };
  return (goodNews[department] || ['Good progress']).slice(0, 2);
}

class PerformanceController {
  /**
   * Get performance data for all employees
   */
  async getPerformanceData(req, res, next) {
    try {
      const { organizationId } = req;
      const { department, month, year } = req.query;

      // Build query
      const query = { organizationId, status: 'active' };
      if (department && department !== 'all') {
        query['employment.department'] = new RegExp(department, 'i');
      }

      // Get employees with their assigned KPIs
      const employees = await Employee.find(query)
        .populate('assignedKPIs.kpiId')
        .populate('shiftId')
        .sort({ 'employment.department': 1, 'personalInfo.firstName': 1 });

      // Calculate performance for each employee
      const performanceData = [];
      for (const employee of employees) {
        // Get KPI group for this employee
        const kpiGroup = getKPIGroupForDepartment(employee.employment.department);

        // Get KPIs for this group
        const groupKPIs = await KPI.find({
          organizationId,
          group: kpiGroup,
          isActive: true
        });

        // Calculate KPI performance
        const kpiPerformance = groupKPIs.slice(0, 4).map((kpi) => {
          const assignedKPI = employee.assignedKPIs.find(
            a => a.kpiId && a.kpiId._id.toString() === kpi._id.toString()
          );

          // Simulate achievement (in real app, this would come from actual data)
          const targetValue = assignedKPI?.targetValue || kpi.targetValue;
          const achievedPercentage = 70 + Math.floor(Math.random() * 35); // 70-105%
          const achievedValue = Math.floor(targetValue * (achievedPercentage / 100));
          const score = calculateScore(achievedPercentage);

          return {
            kpiId: kpi.kpiId,
            name: kpi.name,
            unit: kpi.unit,
            target: targetValue,
            achieved: achievedValue,
            score: score,
            weightage: kpi.weightage
          };
        });

        // Calculate overall score
        const overallScore = calculateOverallScore(kpiPerformance);

        // Get attendance score
        const attendanceScore = await getAttendanceScore(employee._id, organizationId);

        // Calculate final rating
        const finalRating = ((overallScore * 0.6) + (attendanceScore * 0.4)).toFixed(1);

        // Calculate incentive earned
        const incentiveEarned = calculateIncentive(employee.salary?.basic || 30000, overallScore);

        performanceData.push({
          employeeId: employee.employeeId,
          _id: employee._id,
          name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          department: employee.employment.department,
          designation: employee.employment.designation,
          kpiGroup: kpiGroup.toLowerCase(),
          doj: employee.employment.joiningDate,
          basicSalary: employee.salary?.basic || 0,
          status: employee.status,
          kpis: kpiPerformance,
          overallScore: parseFloat(overallScore.toFixed(1)),
          attendanceScore: parseFloat(attendanceScore.toFixed(1)),
          finalRating: parseFloat(finalRating),
          incentiveEarned: incentiveEarned,
          dwrCompliance: 85 + Math.floor(Math.random() * 16), // 85-100
          challenges: getRandomChallenges(employee.employment.department),
          goodNews: getRandomGoodNews(employee.employment.department)
        });
      }

      return successResponse(res, performanceData, 'Performance data retrieved successfully');
    } catch (error) {
      logger.error('Get performance data error:', error);
      next(error);
    }
  }

  /**
   * Get performance data for a single employee
   */
  async getEmployeePerformance(req, res, next) {
    try {
      const { organizationId } = req;
      const { id } = req.params;

      const employee = await Employee.findOne({ _id: id, organizationId })
        .populate('assignedKPIs.kpiId')
        .populate('shiftId');

      if (!employee) {
        return notFoundResponse(res, 'Employee');
      }

      // Get KPI group for this employee
      const kpiGroup = getKPIGroupForDepartment(employee.employment.department);

      // Get KPIs for this group
      const groupKPIs = await KPI.find({
        organizationId,
        group: kpiGroup,
        isActive: true
      });

      // Calculate KPI performance
      const kpiPerformance = groupKPIs.map(kpi => {
        const assignedKPI = employee.assignedKPIs.find(
          a => a.kpiId && a.kpiId._id.toString() === kpi._id.toString()
        );

        const targetValue = assignedKPI?.targetValue || kpi.targetValue;
        const achievedPercentage = 70 + Math.floor(Math.random() * 35);
        const achievedValue = Math.floor(targetValue * (achievedPercentage / 100));
        const score = calculateScore(achievedPercentage);

        return {
          kpiId: kpi.kpiId,
          name: kpi.name,
          unit: kpi.unit,
          target: targetValue,
          achieved: achievedValue,
          score: score,
          weightage: kpi.weightage
        };
      });

      const overallScore = calculateOverallScore(kpiPerformance);
      const attendanceScore = await getAttendanceScore(employee._id, organizationId);
      const finalRating = ((overallScore * 0.6) + (attendanceScore * 0.4)).toFixed(1);
      const incentiveEarned = calculateIncentive(employee.salary?.basic || 30000, overallScore);

      const performanceData = {
        employeeId: employee.employeeId,
        _id: employee._id,
        name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
        department: employee.employment.department,
        designation: employee.employment.designation,
        kpiGroup: kpiGroup.toLowerCase(),
        kpis: kpiPerformance,
        overallScore: parseFloat(overallScore.toFixed(1)),
        attendanceScore: parseFloat(attendanceScore.toFixed(1)),
        finalRating: parseFloat(finalRating),
        incentiveEarned: incentiveEarned,
        dwrCompliance: 85 + Math.floor(Math.random() * 16),
        challenges: getRandomChallenges(employee.employment.department),
        goodNews: getRandomGoodNews(employee.employment.department)
      };

      return successResponse(res, performanceData, 'Employee performance retrieved successfully');
    } catch (error) {
      logger.error('Get employee performance error:', error);
      next(error);
    }
  }

  /**
   * Get KPI definitions by group
   */
  async getKPIDefinitions(req, res, next) {
    try {
      const { organizationId } = req;
      const { group } = req.query;

      const query = { organizationId, isActive: true };
      if (group && group !== 'all') {
        query.group = group;
      }

      const kpis = await KPI.find(query)
        .sort({ group: 1, name: 1 });

      // Group by department
      const groupedKPIs = {};
      kpis.forEach(kpi => {
        if (!groupedKPIs[kpi.group]) {
          groupedKPIs[kpi.group] = [];
        }
        groupedKPIs[kpi.group].push({
          id: kpi.kpiId,
          _id: kpi._id,
          name: kpi.name,
          unit: kpi.unit,
          target: kpi.targetValue,
          maxValue: kpi.maxValue,
          weightage: kpi.weightage,
          description: kpi.description
        });
      });

      return successResponse(res, groupedKPIs, 'KPI definitions retrieved successfully');
    } catch (error) {
      logger.error('Get KPI definitions error:', error);
      next(error);
    }
  }

  /**
   * Get KPI groups summary
   */
  async getKPIGroupsSummary(req, res, next) {
    try {
      const { organizationId } = req;

      const groups = await KPI.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), isActive: true } },
        {
          $group: {
            _id: '$group',
            count: { $sum: 1 },
            kpis: { $push: { id: '$kpiId', name: '$name', target: '$targetValue' } }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const result = groups.map(g => ({
        id: g._id.toLowerCase(),
        name: `${g._id} Team KPIs`,
        department: g._id.toLowerCase(),
        count: g.count,
        kpis: g.kpis
      }));

      return successResponse(res, result, 'KPI groups summary retrieved successfully');
    } catch (error) {
      logger.error('Get KPI groups summary error:', error);
      next(error);
    }
  }
}

export default new PerformanceController();