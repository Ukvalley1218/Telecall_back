import Candidate from '../../models/Candidate.js';
import OfferLetter from '../../models/OfferLetter.js';
import { CANDIDATE_STATUS, OFFER_STATUS } from '../../config/constants.js';
import mongoose from 'mongoose';

class RecruitmentService {
  /**
   * Apply for position
   */
  async applyForPosition(data) {
    const candidate = new Candidate({
      organizationId: data.organizationId,
      jobOpeningId: data.jobOpeningId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      resumeUrl: data.resumeUrl,
      experience: data.experience || 0,
      expectedSalary: data.expectedSalary,
      currentSalary: data.currentSalary,
      source: data.source || 'website',
      status: CANDIDATE_STATUS.APPLIED
    });

    await candidate.save();
    return candidate;
  }

  /**
   * Get candidates with filtering and pagination
   */
  async getCandidates(organizationId, filters, options) {
    const query = { organizationId };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.department) {
      query.department = new RegExp(filters.department, 'i');
    }
    if (filters.position) {
      query.position = new RegExp(filters.position, 'i');
    }
    if (filters.search) {
      query.$or = [
        { name: new RegExp(filters.search, 'i') },
        { email: new RegExp(filters.search, 'i') },
        { phone: new RegExp(filters.search, 'i') }
      ];
    }

    const { page, limit, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const candidates = await Candidate.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('offerLetterId');

    const total = await Candidate.countDocuments(query);

    return {
      candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get candidate by ID
   */
  async getCandidateById(id, organizationId) {
    return Candidate.findOne({ _id: id, organizationId })
      .populate('offerLetterId')
      .populate('screeningNotes.createdBy', 'profile.firstName profile.lastName');
  }

  /**
   * Update candidate details
   */
  async updateCandidate(id, organizationId, updates, updatedBy) {
    const candidate = await Candidate.findOne({ _id: id, organizationId });

    if (!candidate) {
      return null;
    }

    // Remove organizationId from updates if present (shouldn't be changed)
    const { organizationId: _, ...allowedUpdates } = updates;

    // Apply updates
    Object.assign(candidate, allowedUpdates, { updatedAt: new Date() });

    await candidate.save();
    return this.getCandidateById(id, organizationId);
  }

  /**
   * Get pipeline statistics
   */
  async getPipelineStatistics(organizationId) {
    const stats = await Candidate.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const pipelineStats = {
      applied: 0,
      shortlisted: 0,
      screening: 0,
      interview_scheduled: 0,
      selected: 0,
      training: 0,
      offer_sent: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      if (pipelineStats.hasOwnProperty(stat._id)) {
        pipelineStats[stat._id] = stat.count;
      }
    });

    // Calculate totals
    pipelineStats.total = Object.values(pipelineStats).reduce((a, b) => a + b, 0) - pipelineStats.rejected;

    return pipelineStats;
  }

  /**
   * Update candidate status
   */
  async updateStatus(id, organizationId, status, userId, notes = null) {
    const candidate = await Candidate.findOne({ _id: id, organizationId });

    if (!candidate) {
      return null;
    }

    // Validate status transition
    if (!candidate.canTransitionTo(status)) {
      throw new Error(`Cannot transition from ${candidate.status} to ${status}`);
    }

    candidate.status = status;

    if (notes) {
      candidate.notes = notes;
    }

    await candidate.save();
    return candidate;
  }

  /**
   * Add screening note
   */
  async addScreeningNote(id, organizationId, note, userId) {
    const candidate = await Candidate.findOne({ _id: id, organizationId });

    if (!candidate) {
      return null;
    }

    candidate.screeningNotes.push({
      note,
      createdBy: userId,
      date: new Date()
    });

    // Update status to screening if not already
    if (candidate.status === CANDIDATE_STATUS.SHORTLISTED) {
      candidate.status = CANDIDATE_STATUS.SCREENING;
    }

    await candidate.save();
    return candidate;
  }

  /**
   * Schedule interview
   */
  async scheduleInterview(id, organizationId, interviewData, userId) {
    const candidate = await Candidate.findOne({ _id: id, organizationId });

    if (!candidate) {
      return null;
    }

    candidate.interviewDetails = {
      scheduledAt: interviewData.scheduledAt,
      interviewer: interviewData.interviewer,
      location: interviewData.location,
      notes: interviewData.notes,
      completed: false
    };

    candidate.status = CANDIDATE_STATUS.INTERVIEW_SCHEDULED;

    await candidate.save();
    return candidate;
  }

  /**
   * Start training
   */
  async startTraining(id, organizationId, trainingData, userId) {
    const candidate = await Candidate.findOne({ _id: id, organizationId });

    if (!candidate) {
      return null;
    }

    const startDate = new Date(trainingData.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + trainingData.days);

    candidate.training = {
      startDate,
      endDate,
      days: trainingData.days,
      status: 'in_progress',
      notes: trainingData.notes
    };

    candidate.status = CANDIDATE_STATUS.TRAINING;

    await candidate.save();
    return candidate;
  }

  /**
   * Complete training
   */
  async completeTraining(id, organizationId, notes, userId) {
    const candidate = await Candidate.findOne({ _id: id, organizationId });

    if (!candidate) {
      return null;
    }

    candidate.training.status = 'completed';
    candidate.training.completedBy = userId;

    if (notes) {
      candidate.training.notes = notes;
    }

    // Update status to offer_sent (ready for offer)
    candidate.status = CANDIDATE_STATUS.OFFER_SENT;

    await candidate.save();
    return candidate;
  }

  /**
   * Send offer letter
   */
  async sendOfferLetter(candidateId, organizationId, offerData, userId) {
    const candidate = await Candidate.findOne({ _id: candidateId, organizationId });

    if (!candidate) {
      return null;
    }

    // Calculate total salary
    const total = (offerData.salary.basic || 0) + (offerData.salary.allowances || 0);

    // Create offer letter
    const offerLetter = new OfferLetter({
      organizationId,
      candidateId,
      position: offerData.position,
      department: offerData.department,
      salary: {
        basic: offerData.salary.basic,
        allowances: offerData.salary.allowances || 0,
        total
      },
      joiningDate: offerData.joiningDate,
      probationPeriod: offerData.probationPeriod || 6,
      status: OFFER_STATUS.SENT,
      sentAt: new Date(),
      createdBy: userId
    });

    await offerLetter.save();

    // Update candidate
    candidate.offerLetterId = offerLetter._id;
    candidate.status = CANDIDATE_STATUS.OFFER_SENT;

    await candidate.save();

    return { candidate, offerLetter };
  }

  /**
   * Reject candidate
   */
  async rejectCandidate(id, organizationId, reason, userId) {
    const candidate = await Candidate.findOne({ _id: id, organizationId });

    if (!candidate) {
      return null;
    }

    candidate.status = CANDIDATE_STATUS.REJECTED;
    candidate.notes = reason;

    await candidate.save();
    return candidate;
  }

  /**
   * Get offer letter by candidate
   */
  async getOfferLetterByCandidate(candidateId, organizationId) {
    return OfferLetter.findOne({ candidateId, organizationId })
      .populate('candidateId', 'name email phone position department');
  }
}

export default new RecruitmentService();