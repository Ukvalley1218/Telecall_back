import DesignProject from '../../models/DesignProject.js';
import Employee from '../../models/Employee.js';
import mongoose from 'mongoose';

class InteriorDesignerService {
  /**
   * Get available designers (employees with design-related designations)
   */
  async getDesigners(organizationId) {
    // Find employees with design-related designations
    const designDesignations = [
      'interior designer',
      'interior designer lead',
      'senior interior designer',
      'designer',
      'design lead',
      'design head',
      'architect',
      'interior architect',
      '3d designer',
      '3d visualizer',
      'cad designer'
    ];

    const designers = await Employee.find({
      organizationId,
      status: 'active'
    })
      .select('_id personalInfo.firstName personalInfo.lastName employment.designation personalInfo.email personalInfo.phone')
      .lean();

    // Filter by design-related designations (case-insensitive)
    const filteredDesigners = designers.filter(emp => {
      const designation = emp.employment?.designation?.toLowerCase() || '';
      return designDesignations.some(d => designation.includes(d)) ||
             designation.includes('design') ||
             designation.includes('architect');
    });

    // Format response
    return filteredDesigners.map(designer => ({
      id: designer._id,
      name: `${designer.personalInfo?.firstName || ''} ${designer.personalInfo?.lastName || ''}`.trim(),
      designation: designer.employment?.designation || '',
      email: designer.personalInfo?.email || '',
      phone: designer.personalInfo?.phone || ''
    }));
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(organizationId) {
    // Get project counts by stage
    const totalProjects = await DesignProject.countDocuments({
      organizationId,
      status: { $ne: 'cancelled' }
    });

    const ongoingProjects = await DesignProject.countDocuments({
      organizationId,
      status: 'active',
      stage: { $in: ['Assigned', 'Design In Progress', 'Revision'] }
    });

    const pendingReviews = await DesignProject.countDocuments({
      organizationId,
      status: 'active',
      stage: { $in: ['Pending Review', 'Client Review'] }
    });

    const completedDesigns = await DesignProject.countDocuments({
      organizationId,
      stage: 'Completed'
    });

    // Get recent activities
    const recentActivities = await DesignProject.find({ organizationId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .select('title clientName stage status updatedAt createdAt assignedToName');

    // Get stage distribution
    const stageDistribution = await DesignProject.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get priority distribution
    const priorityDistribution = await DesignProject.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), status: 'active' } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get projects due this week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const dueThisWeek = await DesignProject.countDocuments({
      organizationId,
      status: 'active',
      expectedCompletionDate: { $gte: today, $lte: nextWeek }
    });

    // Get overdue projects
    const overdueProjects = await DesignProject.countDocuments({
      organizationId,
      status: 'active',
      expectedCompletionDate: { $lt: today },
      stage: { $nin: ['Completed', 'Approved'] }
    });

    return {
      kpiStats: {
        totalProjects,
        ongoingProjects,
        pendingReviews,
        completedDesigns
      },
      dueThisWeek,
      overdueProjects,
      stageDistribution: stageDistribution.map(s => ({
        stage: s._id,
        count: s.count
      })),
      priorityDistribution: priorityDistribution.map(p => ({
        priority: p._id,
        count: p.count
      })),
      recentActivities: recentActivities.map(p => this.formatProjectActivity(p))
    };
  }

  /**
   * Get recent project activities
   */
  async getRecentActivities(organizationId, limit = 10) {
    const projects = await DesignProject.find({ organizationId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .select('title clientName stage status updatedAt createdAt assignedToName');

    return projects.map(p => this.formatProjectActivity(p));
  }

  /**
   * Get all projects with filtering
   */
  async getProjects(organizationId, filters = {}, options = {}) {
    const query = { organizationId };

    // Apply stage filter
    if (filters.stage && filters.stage !== 'all') {
      query.stage = filters.stage;
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      query.priority = filters.priority;
    }

    // Apply assignedTo filter
    if (filters.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }

    // Apply search filter
    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, 'i') },
        { clientName: new RegExp(filters.search, 'i') },
        { projectType: new RegExp(filters.search, 'i') }
      ];
    }

    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const projects = await DesignProject.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    const total = await DesignProject.countDocuments(query);

    return {
      projects: projects.map(p => this.formatProject(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get project by ID
   */
  async getProjectById(id, organizationId) {
    const project = await DesignProject.findOne({ _id: id, organizationId })
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return project ? this.formatProject(project) : null;
  }

  /**
   * Create project
   */
  async createProject(data, createdBy) {
    const project = new DesignProject({
      ...data,
      createdBy
    });

    await project.save();
    return this.getProjectById(project._id, data.organizationId);
  }

  /**
   * Update project
   */
  async updateProject(id, organizationId, data, updatedBy) {
    const project = await DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      {
        $set: {
          ...data,
          updatedBy
        }
      },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return project ? this.formatProject(project) : null;
  }

  /**
   * Update project stage
   */
  async updateProjectStage(id, organizationId, stage, updatedBy) {
    const updateData = { stage, updatedBy };

    if (stage === 'Completed') {
      updateData.status = 'completed';
      updateData.actualCompletionDate = new Date();
    }

    const project = await DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    )
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return project ? this.formatProject(project) : null;
  }

  /**
   * Assign project to designer
   */
  async assignProject(id, organizationId, designerId, designerName, updatedBy) {
    const project = await DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      {
        $set: {
          assignedTo: designerId,
          assignedToName: designerName,
          assignedAt: new Date(),
          stage: 'Assigned',
          updatedBy
        }
      },
      { new: true }
    )
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return project ? this.formatProject(project) : null;
  }

  /**
   * Delete project (soft delete - mark as cancelled)
   */
  async deleteProject(id, organizationId) {
    return DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
  }

  /**
   * Hard delete project
   */
  async hardDeleteProject(id, organizationId) {
    return DesignProject.findOneAndDelete({ _id: id, organizationId });
  }

  /**
   * Get projects by designer
   */
  async getProjectsByDesigner(organizationId, designerId) {
    const projects = await DesignProject.find({
      organizationId,
      assignedTo: designerId,
      status: 'active'
    })
      .sort({ priority: 1, createdAt: -1 })
      .populate('salesLeadId', 'title client company value');

    return projects.map(p => this.formatProject(p));
  }

  /**
   * Get project statistics for reports
   */
  async getProjectStats(organizationId) {
    const stats = await DesignProject.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$projectValue' }
        }
      }
    ]);

    const stageStats = await DesignProject.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$projectValue' }
        }
      }
    ]);

    const totalProjects = await DesignProject.countDocuments({ organizationId });
    const activeProjects = await DesignProject.countDocuments({ organizationId, status: 'active' });
    const completedProjects = await DesignProject.countDocuments({ organizationId, status: 'completed' });

    return {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
      byStatus: stats.reduce((acc, s) => {
        acc[s._id] = { count: s.count, value: s.totalValue };
        return acc;
      }, {}),
      byStage: stageStats.reduce((acc, s) => {
        acc[s._id] = { count: s.count, value: s.totalValue };
        return acc;
      }, {})
    };
  }

  /**
   * Get new project requests from Sales (won deals that need design)
   */
  async getNewProjectRequests(organizationId) {
    const projects = await DesignProject.find({
      organizationId,
      stage: 'New Request',
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .populate('salesLeadId', 'title client company value');

    return projects.map(p => this.formatProject(p));
  }

  /**
   * Get design review projects (projects in Pending Review or Client Review stage)
   */
  async getDesignReviewProjects(organizationId, filters = {}) {
    const query = {
      organizationId,
      status: 'active',
      stage: { $in: ['Pending Review', 'Client Review'] }
    };

    // Filter by review status
    if (filters.status) {
      const statusMap = {
        'Under Review': 'Pending Review',
        'Ongoing': 'Client Review',
        'Completed': 'Approved'
      };
      const mappedStage = statusMap[filters.status];
      if (mappedStage) {
        if (mappedStage === 'Approved') {
          // For completed status, also include Completed stage
          query.stage = { $in: ['Approved', 'Completed'] };
        } else {
          query.stage = mappedStage;
        }
      }
    }

    const projects = await DesignProject.find(query)
      .sort({ updatedAt: -1 })
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return projects.map(p => this.formatDesignReviewProject(p));
  }

  /**
   * Approve design (move to Approved stage)
   */
  async approveDesign(id, organizationId, approvedBy, notes) {
    const updateData = {
      stage: 'Approved',
      status: 'active',
      updatedBy: approvedBy,
      'clientFeedback.comments': notes,
      'clientFeedback.feedbackDate': new Date()
    };

    const project = await DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    )
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return project ? this.formatDesignReviewProject(project) : null;
  }

  /**
   * Request redesign (move to Revision stage with feedback)
   */
  async requestRedesign(id, organizationId, updatedBy, feedback, attachmentUrl) {
    const updateData = {
      stage: 'Revision',
      status: 'active',
      updatedBy,
      'clientFeedback.comments': feedback,
      'clientFeedback.feedbackDate': new Date()
    };

    // If there's an attachment, add it to the attachments array
    if (attachmentUrl) {
      const project = await DesignProject.findOne({ _id: id, organizationId });
      if (project) {
        project.attachments.push({
          name: attachmentUrl.split('/').pop(),
          url: attachmentUrl,
          type: 'feedback',
          uploadedAt: new Date(),
          uploadedBy: updatedBy
        });
        await project.save();
      }
    }

    const project = await DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    )
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return project ? this.formatDesignReviewProject(project) : null;
  }

  /**
   * Format project for design review response
   */
  formatDesignReviewProject(project) {
    // Map backend stages to frontend status
    const stageStatusMap = {
      'Pending Review': 'Under Review',
      'Client Review': 'Ongoing',
      'Revision': 'Ongoing',
      'Approved': 'Completed',
      'Completed': 'Completed'
    };

    // Generate version based on revision count or attachments
    const revisionCount = project.attachments?.filter(a => a.type === 'revision').length || 0;
    const version = `v${Math.max(1, revisionCount + 1)}`;

    return {
      id: project._id,
      projectName: project.title,
      clientName: project.clientName,
      employeeName: project.assignedToName || 'Unassigned',
      employeeId: project.assignedTo?._id,
      version: version,
      spaceType: project.projectType || 'Kitchen',
      status: stageStatusMap[project.stage] || 'Under Review',
      stage: project.stage,
      submittedDate: project.updatedAt ? this.formatDate(project.updatedAt) : '',
      image: project.attachments?.[0]?.url || null,
      projectValue: project.projectValue,
      description: project.description,
      notes: project.notes,
      clientFeedback: project.clientFeedback,
      attachments: project.attachments,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }

  /**
   * Get projects for client approval (Pending Review stage - ready to send to client)
   */
  async getClientApprovalProjects(organizationId) {
    const projects = await DesignProject.find({
      organizationId,
      stage: 'Pending Review',
      status: 'active'
    })
      .sort({ updatedAt: -1 })
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return projects.map(p => this.formatClientApprovalProject(p));
  }

  /**
   * Send design to client (move from Pending Review to Client Review)
   */
  async sendToClient(id, organizationId, sentBy, message) {
    const updateData = {
      stage: 'Client Review',
      status: 'active',
      updatedBy: sentBy,
      'clientFeedback.comments': message || 'Design sent for client approval',
      'clientFeedback.feedbackDate': new Date()
    };

    const project = await DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    )
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return project ? this.formatClientApprovalProject(project) : null;
  }

  /**
   * Format project for client approval response
   */
  formatClientApprovalProject(project) {
    // Generate version based on revision count
    const revisionCount = project.attachments?.filter(a => a.type === 'revision').length || 0;
    const version = `v${Math.max(1, revisionCount + 1)}`;

    // Sent date is when the project was moved to Client Review stage
    // For projects in Pending Review, we show when it was last updated
    const sentDate = project.clientFeedback?.feedbackDate
      ? this.formatDate(project.clientFeedback.feedbackDate)
      : (project.updatedAt ? this.formatDate(project.updatedAt) : '');

    return {
      id: project._id,
      projectName: project.title,
      clientName: project.clientName,
      clientEmail: project.clientEmail,
      clientPhone: project.clientPhone,
      employeeName: project.assignedToName || 'Unassigned',
      version: version,
      sentDate: sentDate,
      designPdf: project.designPdf,
      finalPdf: project.finalPdf,
      clientApprovalStatus: project.clientApprovalStatus || 'pending',
      clientApprovedAt: project.clientApprovedAt ? this.formatDate(project.clientApprovedAt) : null,
      projectType: project.projectType || 'Kitchen',
      projectValue: project.projectValue,
      description: project.description,
      stage: project.stage,
      notes: project.notes,
      clientFeedback: project.clientFeedback,
      attachments: project.attachments,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }

  /**
   * Upload design PDF for client approval
   */
  async uploadDesignPdf(id, organizationId, fileData, uploadedBy) {
    const updateData = {
      'designPdf.name': fileData.name || 'design.pdf',
      'designPdf.url': fileData.url,
      'designPdf.uploadedAt': new Date(),
      'designPdf.uploadedBy': uploadedBy,
      stage: 'Pending Review',
      clientApprovalStatus: 'pending',
      updatedBy: uploadedBy
    };

    const project = await DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    )
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return project ? this.formatClientApprovalProject(project) : null;
  }

  /**
   * Upload final PDF (with measurements) after client approval
   */
  async uploadFinalPdf(id, organizationId, fileData, uploadedBy) {
    const project = await DesignProject.findOne({ _id: id, organizationId });

    if (!project) {
      return null;
    }

    // Can only upload final PDF if client has approved
    if (project.clientApprovalStatus !== 'approved') {
      throw new Error('Cannot upload final PDF until client approves the design');
    }

    const updateData = {
      'finalPdf.name': fileData.name || 'final.pdf',
      'finalPdf.url': fileData.url,
      'finalPdf.uploadedAt': new Date(),
      'finalPdf.uploadedBy': uploadedBy,
      stage: 'Completed',
      status: 'completed',
      actualCompletionDate: new Date(),
      updatedBy: uploadedBy
    };

    const updatedProject = await DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    )
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return updatedProject ? this.formatProject(updatedProject) : null;
  }

  /**
   * Client approve design (HOD approves on behalf of client)
   */
  async clientApprove(id, organizationId, approvedBy, notes) {
    const updateData = {
      clientApprovalStatus: 'approved',
      clientApprovedAt: new Date(),
      clientApprovedBy: approvedBy,
      stage: 'Approved',
      status: 'active',
      'clientFeedback.comments': notes,
      'clientFeedback.feedbackDate': new Date(),
      updatedBy: approvedBy
    };

    const project = await DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    )
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return project ? this.formatClientApprovalProject(project) : null;
  }

  /**
   * Client reject design
   */
  async clientReject(id, organizationId, rejectedBy, reason) {
    const updateData = {
      clientApprovalStatus: 'rejected',
      stage: 'Revision',
      status: 'active',
      'clientFeedback.comments': reason,
      'clientFeedback.feedbackDate': new Date(),
      updatedBy: rejectedBy
    };

    const project = await DesignProject.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    )
      .populate('assignedTo', 'personalInfo.firstName personalInfo.lastName')
      .populate('salesLeadId', 'title client company value');

    return project ? this.formatClientApprovalProject(project) : null;
  }

  /**
   * Format project for response
   */
  formatProject(project) {
    return {
      id: project._id,
      salesLeadId: project.salesLeadId?._id,
      salesLead: project.salesLeadId,
      title: project.title,
      clientName: project.clientName,
      clientPhone: project.clientPhone,
      clientEmail: project.clientEmail,
      clientAddress: project.clientAddress,
      projectType: project.projectType,
      description: project.description,
      projectValue: project.projectValue,
      formattedValue: `₹${project.projectValue?.toLocaleString('en-IN') || '0'}`,
      stage: project.stage,
      status: project.status,
      priority: project.priority,
      assignedTo: project.assignedTo,
      assignedToName: project.assignedToName,
      assignedAt: project.assignedAt ? this.formatDate(project.assignedAt) : null,
      startDate: project.startDate ? this.formatDate(project.startDate) : null,
      expectedCompletionDate: project.expectedCompletionDate ? this.formatDate(project.expectedCompletionDate) : null,
      actualCompletionDate: project.actualCompletionDate ? this.formatDate(project.actualCompletionDate) : null,
      designDetails: project.designDetails,
      attachments: project.attachments,
      clientFeedback: project.clientFeedback,
      notes: project.notes,
      internalNotes: project.internalNotes,
      createdBy: project.createdBy,
      createdAt: this.formatDate(project.createdAt),
      updatedAt: this.formatDate(project.updatedAt)
    };
  }

  /**
   * Format project activity for response
   */
  formatProjectActivity(project) {
    const activityMap = {
      'New Request': 'created new project',
      'Assigned': 'assigned project',
      'Design In Progress': 'started working on',
      'Pending Review': 'submitted for review',
      'Client Review': 'sent to client',
      'Revision': 'received revision request',
      'Approved': 'got approval on',
      'Completed': 'completed'
    };

    return {
      id: project._id,
      projectId: project._id,
      projectName: project.title,
      employeeName: project.assignedToName || 'Unassigned',
      activity: activityMap[project.stage] || 'updated',
      time: this.getRelativeTime(project.updatedAt),
      dotColor: this.getDotColor(project.stage),
      stage: project.stage
    };
  }

  /**
   * Get dot color based on stage
   */
  getDotColor(stage) {
    const colorMap = {
      'New Request': 'blue',
      'Assigned': 'green',
      'Design In Progress': 'purple',
      'Pending Review': 'yellow',
      'Client Review': 'orange',
      'Revision': 'red',
      'Approved': 'green',
      'Completed': 'green'
    };
    return colorMap[stage] || 'gray';
  }

  /**
   * Format date
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get relative time
   */
  getRelativeTime(date) {
    if (!date) return '';
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} mins ago`;
    if (hours < 24) return `${hours} hrs ago`;
    if (days < 7) return `${days} days ago`;
    return this.formatDate(date);
  }
}

export default new InteriorDesignerService();