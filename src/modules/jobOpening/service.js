import JobOpening from '../../models/JobOpening.js';
import Candidate from '../../models/Candidate.js';
import { JOB_OPENING_STATUS } from '../../config/constants.js';
import mongoose from 'mongoose';

class JobOpeningService {
  /**
   * Get public job openings (active only)
   */
  async getPublicJobOpenings(organizationId, filters, options) {
    const query = {
      organizationId,
      status: JOB_OPENING_STATUS.ACTIVE,
      isActive: true
    };

    // Apply filters
    if (filters.department) {
      query.department = new RegExp(filters.department, 'i');
    }
    if (filters.location) {
      query.location = new RegExp(filters.location, 'i');
    }
    if (filters.type) {
      query.employmentType = filters.type;
    }
    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') },
        { skills: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    // Filter by deadline
    query.$and = [
      {
        $or: [
          { applicationDeadline: { $exists: false } },
          { applicationDeadline: null },
          { applicationDeadline: { $gt: new Date() } }
        ]
      }
    ];

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const jobOpenings = await JobOpening.find(query)
      .sort({ createdAt: -1, isUrgent: -1 })
      .skip(skip)
      .limit(limit)
      .populate('postedBy', 'profile.firstName profile.lastName');

    const total = await JobOpening.countDocuments(query);

    return {
      jobOpenings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get public job opening by ID
   */
  async getPublicJobOpeningById(id) {
    return JobOpening.findOne({
      _id: id,
      status: JOB_OPENING_STATUS.ACTIVE,
      isActive: true
    }).populate('postedBy', 'profile.firstName profile.lastName');
  }

  /**
   * Get all job openings (HR/Admin)
   */
  async getJobOpenings(organizationId, filters, options) {
    const query = { organizationId };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.department) {
      query.department = new RegExp(filters.department, 'i');
    }
    if (filters.location) {
      query.location = new RegExp(filters.location, 'i');
    }
    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') },
        { skills: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    const { page, limit, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const jobOpenings = await JobOpening.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('postedBy', 'profile.firstName profile.lastName');

    const total = await JobOpening.countDocuments(query);

    return {
      jobOpenings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get job opening by ID
   */
  async getJobOpeningById(id, organizationId) {
    return JobOpening.findOne({ _id: id, organizationId })
      .populate('postedBy', 'profile.firstName profile.lastName email');
  }

  /**
   * Get job opening statistics
   */
  async getJobOpeningStatistics(organizationId) {
    const stats = await JobOpening.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const departmentStats = await JobOpening.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), status: JOB_OPENING_STATUS.ACTIVE } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const totalApplications = await JobOpening.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: null, total: { $sum: '$applicationsCount' } } }
    ]);

    const statusStats = {
      draft: 0,
      active: 0,
      closed: 0,
      on_hold: 0
    };

    stats.forEach(stat => {
      if (statusStats.hasOwnProperty(stat._id)) {
        statusStats[stat._id] = stat.count;
      }
    });

    const byDepartment = {};
    departmentStats.forEach(stat => {
      byDepartment[stat._id] = stat.count;
    });

    return {
      byStatus: statusStats,
      byDepartment,
      totalOpenings: Object.values(statusStats).reduce((a, b) => a + b, 0),
      totalApplications: totalApplications[0]?.total || 0,
      activeOpenings: statusStats.active
    };
  }

  /**
   * Create new job opening
   */
  async createJobOpening(data) {
    const jobOpening = new JobOpening({
      organizationId: data.organizationId,
      title: data.title,
      description: data.description,
      department: data.department,
      location: data.location,
      employmentType: data.employmentType || 'full_time',
      experienceRequired: data.experienceRequired || { min: 0, max: 0 },
      salaryRange: data.salaryRange || {},
      skills: data.skills || [],
      qualifications: data.qualifications || [],
      responsibilities: data.responsibilities || [],
      status: data.status || JOB_OPENING_STATUS.DRAFT,
      postedBy: data.postedBy,
      applicationDeadline: data.applicationDeadline,
      vacancies: data.vacancies || 1,
      isRemote: data.isRemote || false,
      isUrgent: data.isUrgent || false,
      tags: data.tags || []
    });

    await jobOpening.save();
    return jobOpening;
  }

  /**
   * Update job opening
   */
  async updateJobOpening(id, organizationId, data) {
    const jobOpening = await JobOpening.findOne({ _id: id, organizationId });

    if (!jobOpening) {
      return null;
    }

    // Update fields
    const updateFields = [
      'title', 'description', 'department', 'location', 'employmentType',
      'experienceRequired', 'salaryRange', 'skills', 'qualifications',
      'responsibilities', 'applicationDeadline', 'vacancies', 'isRemote',
      'isUrgent', 'tags', 'status'
    ];

    updateFields.forEach(field => {
      if (data[field] !== undefined) {
        jobOpening[field] = data[field];
      }
    });

    await jobOpening.save();
    return jobOpening;
  }

  /**
   * Update job opening status
   */
  async updateStatus(id, organizationId, status) {
    const jobOpening = await JobOpening.findOne({ _id: id, organizationId });

    if (!jobOpening) {
      return null;
    }

    jobOpening.status = status;

    if (status === JOB_OPENING_STATUS.CLOSED) {
      jobOpening.isActive = false;
    } else if (status === JOB_OPENING_STATUS.ACTIVE) {
      jobOpening.isActive = true;
    }

    await jobOpening.save();
    return jobOpening;
  }

  /**
   * Delete job opening
   */
  async deleteJobOpening(id, organizationId) {
    const result = await JobOpening.findOneAndDelete({ _id: id, organizationId });
    return result;
  }

  /**
   * Get applications for a specific job opening
   */
  async getApplicationsForJob(jobOpeningId, organizationId, filters, options) {
    // First verify the job opening exists
    const jobOpening = await JobOpening.findOne({ _id: jobOpeningId, organizationId });

    if (!jobOpening) {
      return null;
    }

    const query = {
      organizationId,
      position: jobOpening.title
    };

    if (filters.status) {
      query.status = filters.status;
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const candidates = await Candidate.find(query)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Candidate.countDocuments(query);

    return {
      candidates,
      jobOpening,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export default new JobOpeningService();