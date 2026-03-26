import mongoose from 'mongoose';
import Training from '../../models/Training.js';
import TrainingEnrollment from '../../models/TrainingEnrollment.js';

class TrainingService {
  /**
   * Get trainings with filters
   */
  async getTrainings(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = new RegExp(filters.category, 'i');
    if (filters.isMandatory !== undefined) query.isMandatory = filters.isMandatory === 'true';
    if (filters.instructor) query.instructor = filters.instructor;

    // Date range filter
    if (filters.startDate && filters.endDate) {
      query.$or = [
        { startDate: { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) } },
        { endDate: { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) } }
      ];
    }

    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const trainings = await Training.find(query)
      .populate('instructor', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('prerequisites.trainingId', 'title type')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Training.countDocuments(query);

    return {
      trainings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get training by ID
   */
  async getTrainingById(id, organizationId) {
    return Training.findOne({ _id: id, organizationId })
      .populate('instructor', 'personalInfo.firstName personalInfo.lastName employeeId employment.department')
      .populate('prerequisites.trainingId', 'title type')
      .populate('targetAudience.employeeIds', 'personalInfo.firstName personalInfo.lastName employeeId');
  }

  /**
   * Create training
   */
  async createTraining(data) {
    const training = new Training(data);
    await training.save();
    return this.getTrainingById(training._id, data.organizationId);
  }

  /**
   * Update training
   */
  async updateTraining(id, organizationId, data) {
    const training = await Training.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    );
    return training;
  }

  /**
   * Delete training
   */
  async deleteTraining(id, organizationId) {
    // Check if there are enrollments
    const enrollmentCount = await TrainingEnrollment.countDocuments({ trainingId: id });
    if (enrollmentCount > 0) {
      throw new Error('Cannot delete training with existing enrollments');
    }

    return Training.findOneAndDelete({ _id: id, organizationId });
  }

  /**
   * Get upcoming trainings
   */
  async getUpcomingTrainings(organizationId, limit = 10) {
    return Training.getUpcoming(organizationId, limit);
  }

  /**
   * Get mandatory trainings
   */
  async getMandatoryTrainings(organizationId) {
    return Training.getMandatory(organizationId);
  }

  /**
   * Get trainings by department
   */
  async getTrainingsByDepartment(organizationId, department) {
    return Training.getByDepartment(organizationId, department);
  }

  /**
   * Start training
   */
  async startTraining(id, organizationId) {
    const training = await Training.findOne({ _id: id, organizationId });
    if (!training) {
      throw new Error('Training not found');
    }
    await training.start();
    return this.getTrainingById(id, organizationId);
  }

  /**
   * Complete training
   */
  async completeTraining(id, organizationId) {
    const training = await Training.findOne({ _id: id, organizationId });
    if (!training) {
      throw new Error('Training not found');
    }
    await training.complete();
    return this.getTrainingById(id, organizationId);
  }

  /**
   * Cancel training
   */
  async cancelTraining(id, organizationId, reason) {
    const training = await Training.findOne({ _id: id, organizationId });
    if (!training) {
      throw new Error('Training not found');
    }
    await training.cancel(reason);
    return this.getTrainingById(id, organizationId);
  }

  // ==================== Enrollment Methods ====================

  /**
   * Enroll employee in training
   */
  async enrollEmployee(trainingId, employeeId, userId, enrollmentType = 'self') {
    const training = await Training.findById(trainingId);
    if (!training) {
      throw new Error('Training not found');
    }

    // Check if already enrolled
    const existing = await TrainingEnrollment.findOne({ trainingId, employeeId });
    if (existing) {
      throw new Error('Employee already enrolled in this training');
    }

    // Check enrollment eligibility
    const eligibility = training.canEnroll();
    if (!eligibility.canEnroll) {
      throw new Error(eligibility.reason);
    }

    const enrollment = new TrainingEnrollment({
      organizationId: training.organizationId,
      trainingId,
      employeeId,
      enrolledBy: userId,
      enrollmentType,
      sessionsTotal: training.sessions?.length || 0
    });

    await enrollment.save();

    // Update training stats
    await training.updateStats();

    return enrollment;
  }

  /**
   * Cancel enrollment
   */
  async cancelEnrollment(trainingId, employeeId, reason) {
    const enrollment = await TrainingEnrollment.findOne({ trainingId, employeeId });
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    await enrollment.cancel(reason);

    // Update training stats
    const training = await Training.findById(trainingId);
    if (training) {
      await training.updateStats();
    }

    return enrollment;
  }

  /**
   * Get employee enrollments
   */
  async getEmployeeEnrollments(employeeId, status = null) {
    return TrainingEnrollment.getEmployeeEnrollments(employeeId, status);
  }

  /**
   * Get training enrollments
   */
  async getTrainingEnrollments(trainingId, status = null) {
    return TrainingEnrollment.getTrainingEnrollments(trainingId, status);
  }

  /**
   * Start training for employee
   */
  async startTrainingForEmployee(enrollmentId) {
    const enrollment = await TrainingEnrollment.findById(enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }
    await enrollment.start();
    return enrollment;
  }

  /**
   * Update training progress
   */
  async updateProgress(enrollmentId, progress, sessionsAttended = null) {
    const enrollment = await TrainingEnrollment.findById(enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }
    await enrollment.updateProgress(progress, sessionsAttended);
    return enrollment;
  }

  /**
   * Complete training for employee
   */
  async completeTrainingForEmployee(enrollmentId, score = null) {
    const enrollment = await TrainingEnrollment.findById(enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const training = await Training.findById(enrollment.trainingId);

    if (training.hasAssessment && score !== null) {
      const passed = score >= training.passingScore;
      await enrollment.submitAssessment(score, passed);
    } else {
      await enrollment.complete();
    }

    // Update training stats
    await training.updateStats();

    return enrollment;
  }

  /**
   * Submit feedback
   */
  async submitFeedback(enrollmentId, feedbackData) {
    const enrollment = await TrainingEnrollment.findById(enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    await enrollment.submitFeedback(feedbackData);

    // Update training average rating
    const training = await Training.findById(enrollment.trainingId);
    if (training) {
      await training.updateStats();
    }

    return enrollment;
  }

  /**
   * Issue certificate
   */
  async issueCertificate(enrollmentId, certificateId, validityMonths = 0) {
    const enrollment = await TrainingEnrollment.findById(enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.status !== 'completed') {
      throw new Error('Training must be completed before issuing certificate');
    }

    await enrollment.issueCertificate(certificateId, validityMonths);
    return enrollment;
  }

  /**
   * Get training dashboard stats
   */
  async getTrainingStats(organizationId) {
    const [totalTrainings, upcomingTrainings, ongoingTrainings, mandatoryTrainings] = await Promise.all([
      Training.countDocuments({ organizationId }),
      Training.countDocuments({ organizationId, status: 'scheduled', startDate: { $gte: new Date() } }),
      Training.countDocuments({ organizationId, status: 'in_progress' }),
      Training.countDocuments({ organizationId, isMandatory: true, status: { $ne: 'cancelled' } })
    ]);

    const [totalEnrollments, completedEnrollments, pendingEnrollments] = await Promise.all([
      TrainingEnrollment.countDocuments({ organizationId }),
      TrainingEnrollment.countDocuments({ organizationId, status: 'completed' }),
      TrainingEnrollment.countDocuments({ organizationId, status: { $in: ['enrolled', 'in_progress'] } })
    ]);

    // Average rating
    const avgRating = await Training.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), totalFeedbacks: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$averageRating' } } }
    ]);

    return {
      totalTrainings,
      upcomingTrainings,
      ongoingTrainings,
      mandatoryTrainings,
      totalEnrollments,
      completedEnrollments,
      pendingEnrollments,
      averageRating: avgRating[0]?.avgRating || 0
    };
  }
}

export default new TrainingService();