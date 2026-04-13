import mongoose from 'mongoose';
import TelecallerCampaign from '../../models/TelecallerCampaign.js';
import TelecallerLead from '../../models/TelecallerLead.js';
import CallLog from '../../models/CallLog.js';
import TelecallerTask from '../../models/TelecallerTask.js';
import FollowUp from '../../models/FollowUp.js';
import User from '../../models/User.js';
import TelecallerSession from '../../models/TelecallerSession.js';
import logger from '../../utils/logger.js';

class TelecallingService {
  // ==================== CAMPAIGN METHODS ====================

  /**
   * Get all campaigns for organization
   */
  async getCampaigns(organizationId, options = {}) {
    try {
      const { page = 1, limit = 20, status, priority, assignedTo } = options;
      const skip = (page - 1) * limit;

      const query = { organizationId, isActive: true };
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (assignedTo) query.assignedTo = assignedTo;

      const [campaigns, total] = await Promise.all([
        TelecallerCampaign.find(query)
          .populate('assignedTo', 'profile.firstName profile.lastName email role')
          .populate('createdBy', 'profile.firstName profile.lastName email')
          .sort({ priority: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit),
        TelecallerCampaign.countDocuments(query)
      ]);

      return {
        success: true,
        campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get campaigns error:', error);
      return { success: false, message: 'Failed to get campaigns' };
    }
  }

  /**
   * Get campaigns assigned to user
   */
  async getMyCampaigns(userId, organizationId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const query = {
        organizationId,
        assignedTo: userId,
        isActive: true,
        status: 'active'
      };

      const [campaigns, total] = await Promise.all([
        TelecallerCampaign.find(query)
          .populate('assignedTo', 'profile.firstName profile.lastName email')
          .populate('createdBy', 'profile.firstName profile.lastName email')
          .sort({ priority: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit),
        TelecallerCampaign.countDocuments(query)
      ]);

      return {
        success: true,
        campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get my campaigns error:', error);
      return { success: false, message: 'Failed to get campaigns' };
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId, organizationId) {
    try {
      const campaign = await TelecallerCampaign.findOne({
        _id: campaignId,
        organizationId,
        isActive: true
      })
        .populate('assignedTo', 'profile.firstName profile.lastName email role')
        .populate('createdBy', 'profile.firstName profile.lastName email');

      if (!campaign) {
        return { success: false, message: 'Campaign not found' };
      }

      return { success: true, campaign };
    } catch (error) {
      logger.error('Get campaign error:', error);
      return { success: false, message: 'Failed to get campaign' };
    }
  }

  /**
   * Create campaign
   */
  async createCampaign(organizationId, userId, campaignData) {
    try {
      const campaign = new TelecallerCampaign({
        organizationId,
        createdBy: userId,
        ...campaignData
      });

      await campaign.save();

      logger.info(`Campaign created: ${campaign._id} by user ${userId}`);

      return { success: true, campaign };
    } catch (error) {
      logger.error('Create campaign error:', error);
      return { success: false, message: 'Failed to create campaign' };
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId, organizationId, updateData) {
    try {
      const campaign = await TelecallerCampaign.findOneAndUpdate(
        { _id: campaignId, organizationId, isActive: true },
        { $set: updateData },
        { new: true }
      ).populate('assignedTo', 'profile.firstName profile.lastName email');

      if (!campaign) {
        return { success: false, message: 'Campaign not found' };
      }

      return { success: true, campaign };
    } catch (error) {
      logger.error('Update campaign error:', error);
      return { success: false, message: 'Failed to update campaign' };
    }
  }

  // ==================== LEAD METHODS ====================

  /**
   * Get leads by category
   */
  async getLeadsByCategory(organizationId, userId, category, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const query = { organizationId, isActive: true };

      // Map frontend categories to statuses
      const categoryMap = {
        'new': { status: 'new' },
        'follow_up': { status: 'follow_up' },
        'cold': { status: 'cold' },
        'warm': { status: 'warm' },
        'hot': { status: 'hot' },
        'not_connected': { status: 'not_connected' },
        'open': { status: 'open' },
        'in_progress': { status: 'in_progress' },
        'converted': { status: 'converted' },
        'closed': { status: 'closed' }
      };

      if (category && categoryMap[category]) {
        Object.assign(query, categoryMap[category]);
      }

      // If userId provided and not admin, filter by assignment
      if (userId) {
        query.assignedTo = userId;
      }

      const [leads, total] = await Promise.all([
        TelecallerLead.find(query)
          .populate('assignedTo', 'profile.firstName profile.lastName email')
          .populate('campaignId', 'name priority')
          .sort({ priority: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit),
        TelecallerLead.countDocuments(query)
      ]);

      return {
        success: true,
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get leads by category error:', error);
      return { success: false, message: 'Failed to get leads' };
    }
  }

  /**
   * Get my leads (assigned to user)
   */
  async getMyLeads(userId, organizationId, options = {}) {
    try {
      const { page = 1, limit = 20, status, stage, campaignId, search } = options;
      const skip = (page - 1) * limit;

      const query = { organizationId, assignedTo: userId, isActive: true };

      if (status) query.status = status;
      if (stage) query.stage = stage;
      if (campaignId) query.campaignId = campaignId;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const [leads, total] = await Promise.all([
        TelecallerLead.find(query)
          .populate('assignedTo', 'profile.firstName profile.lastName email')
          .populate('campaignId', 'name priority status')
          .sort({ priority: 1, nextFollowUp: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit),
        TelecallerLead.countDocuments(query)
      ]);

      return {
        success: true,
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get my leads error:', error);
      return { success: false, message: 'Failed to get leads' };
    }
  }

  /**
   * Get lead by ID
   */
  async getLeadById(leadId, organizationId) {
    try {
      const lead = await TelecallerLead.findOne({
        _id: leadId,
        organizationId,
        isActive: true
      })
        .populate('assignedTo', 'profile.firstName profile.lastName email phone')
        .populate('campaignId', 'name description priority')
        .populate('notes.createdBy', 'profile.firstName profile.lastName');

      if (!lead) {
        return { success: false, message: 'Lead not found' };
      }

      return { success: true, lead };
    } catch (error) {
      logger.error('Get lead error:', error);
      return { success: false, message: 'Failed to get lead' };
    }
  }

  /**
   * Create lead
   */
  async createLead(organizationId, userId, leadData) {
    try {
      const lead = new TelecallerLead({
        organizationId,
        createdBy: userId,
        ...leadData
      });

      await lead.save();

      logger.info(`Lead created: ${lead._id} by user ${userId}`);

      return { success: true, lead };
    } catch (error) {
      logger.error('Create lead error:', error);
      return { success: false, message: 'Failed to create lead' };
    }
  }

  /**
   * Update lead
   */
  async updateLead(leadId, organizationId, updateData, userId) {
    try {
      const lead = await TelecallerLead.findOne({
        _id: leadId,
        organizationId,
        isActive: true
      });

      if (!lead) {
        return { success: false, message: 'Lead not found' };
      }

      // Update fields
      const allowedUpdates = [
        'name', 'phone', 'alternatePhone', 'email', 'address',
        'source', 'status', 'stage', 'priority', 'company',
        'designation', 'industry', 'notes', 'tags', 'customFields'
      ];

      for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
          lead[key] = updateData[key];
        }
      }

      lead.lastContactedAt = new Date();
      lead.lastContactedBy = userId;

      await lead.save();

      return { success: true, lead };
    } catch (error) {
      logger.error('Update lead error:', error);
      return { success: false, message: 'Failed to update lead' };
    }
  }

  /**
   * Dispose lead with follow-up
   */
  async disposeLead(leadId, organizationId, userId, dispositionData) {
    try {
      const lead = await TelecallerLead.findOne({
        _id: leadId,
        organizationId,
        isActive: true
      });

      if (!lead) {
        return { success: false, message: 'Lead not found' };
      }

      // Update disposition
      lead.disposition = {
        status: dispositionData.status,
        reason: dispositionData.reason,
        remarks: dispositionData.remarks,
        disposedAt: new Date(),
        disposedBy: userId
      };

      // Update status based on disposition
      if (dispositionData.status === 'connected') {
        lead.status = dispositionData.newStatus || 'in_progress';
      } else if (dispositionData.status === 'not_connected') {
        lead.status = 'not_connected';
      } else if (dispositionData.status === 'not_interested') {
        lead.status = 'lost';
      }

      // Update stage
      if (dispositionData.stage) {
        lead.stage = dispositionData.stage;
      }

      lead.lastContactedAt = new Date();
      lead.lastContactedBy = userId;

      await lead.save();

      // Create follow-up if scheduled
      if (dispositionData.followUp) {
        await this.createFollowUp(organizationId, userId, {
          leadId: lead._id,
          campaignId: lead.campaignId,
          assignedTo: dispositionData.followUp.assignedTo || userId,
          scheduledDate: dispositionData.followUp.date,
          scheduledTime: dispositionData.followUp.time,
          purpose: dispositionData.followUp.notes || 'Follow-up from call',
          notes: dispositionData.remarks
        });
      }

      return { success: true, lead };
    } catch (error) {
      logger.error('Dispose lead error:', error);
      return { success: false, message: 'Failed to dispose lead' };
    }
  }

  /**
   * Get lead category counts
   */
  async getLeadCategoryCounts(organizationId, userId) {
    try {
      const matchStage = {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        isActive: true
      };

      if (userId) {
        matchStage.assignedTo = new mongoose.Types.ObjectId(userId);
      }

      const counts = await TelecallerLead.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        new: 0,
        follow_up: 0,
        cold: 0,
        warm: 0,
        hot: 0,
        not_connected: 0,
        in_progress: 0,
        converted: 0,
        lost: 0,
        total: 0
      };

      counts.forEach(item => {
        if (result.hasOwnProperty(item._id)) {
          result[item._id] = item.count;
        }
        result.total += item.count;
      });

      return { success: true, counts: result };
    } catch (error) {
      logger.error('Get lead counts error:', error);
      return { success: false, message: 'Failed to get counts: ' + error.message };
    }
  }

  // ==================== CALL LOG METHODS ====================

  /**
   * Create call log
   */
  async createCallLog(organizationId, userId, callData) {
    try {
      const callLog = new CallLog({
        organizationId,
        userId,
        ...callData
      });

      await callLog.save();

      // Update lead call history if leadId provided
      if (callData.leadId) {
        await TelecallerLead.findByIdAndUpdate(callData.leadId, {
          $push: {
            callHistory: {
              callId: callLog._id,
              phoneNumber: callData.phoneNumber,
              duration: callData.duration,
              status: callData.status,
              notes: callData.notes,
              disposition: callData.disposition,
              createdAt: new Date()
            }
          },
          lastContactedAt: new Date(),
          lastContactedBy: userId
        });
      }

      logger.info(`Call log created: ${callLog._id} by user ${userId}`);

      return { success: true, callLog };
    } catch (error) {
      logger.error('Create call log error:', error);
      return { success: false, message: 'Failed to create call log' };
    }
  }

  /**
   * Get call logs for user
   */
  async getCallLogs(userId, organizationId, options = {}) {
    try {
      const { page = 1, limit = 20, callType, status, startDate, endDate } = options;

      const [callLogs, total] = await Promise.all([
        CallLog.findByUser(userId, organizationId, {
          callType,
          status,
          startDate,
          endDate,
          page,
          limit
        }),
        CallLog.countDocuments({
          userId,
          organizationId,
          ...(callType && { callType }),
          ...(status && { status }),
          ...(startDate && { createdAt: { $gte: new Date(startDate) } }),
          ...(endDate && { createdAt: { $lte: new Date(endDate) } })
        })
      ]);

      return {
        success: true,
        callLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get call logs error:', error);
      return { success: false, message: 'Failed to get call logs' };
    }
  }

  /**
   * Get call statistics
   */
  async getCallStatistics(organizationId, userId, startDate, endDate) {
    try {
      const stats = await CallLog.getStatistics(organizationId, userId, startDate, endDate);
      return { success: true, stats };
    } catch (error) {
      logger.error('Get call stats error:', error);
      return { success: false, message: 'Failed to get statistics' };
    }
  }

  /**
   * Get call timeline (daily activity)
   */
  async getCallTimeline(organizationId, userId, date) {
    try {
      const timeline = await CallLog.getCallTimeline(organizationId, userId, date);
      return { success: true, timeline };
    } catch (error) {
      logger.error('Get call timeline error:', error);
      return { success: false, message: 'Failed to get timeline' };
    }
  }

  // ==================== TASK METHODS ====================

  /**
   * Get my tasks
   */
  async getMyTasks(userId, organizationId, options = {}) {
    try {
      const { page = 1, limit = 20, status, type, dueToday } = options;

      const [tasks, total] = await Promise.all([
        TelecallerTask.findByUser(userId, organizationId, { status, type, dueToday, page, limit }),
        TelecallerTask.countDocuments({
          assignedTo: userId,
          organizationId,
          isActive: true,
          ...(status && { status }),
          ...(type && { type })
        })
      ]);

      return {
        success: true,
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get tasks error:', error);
      return { success: false, message: 'Failed to get tasks' };
    }
  }

  /**
   * Get today's tasks
   */
  async getTodayTasks(userId, organizationId) {
    try {
      const tasks = await TelecallerTask.getTodayTasks(userId, organizationId);
      return { success: true, tasks };
    } catch (error) {
      logger.error('Get today tasks error:', error);
      return { success: false, message: 'Failed to get tasks' };
    }
  }

  /**
   * Create task
   */
  async createTask(organizationId, userId, taskData) {
    try {
      const task = new TelecallerTask({
        organizationId,
        createdBy: userId,
        ...taskData
      });

      await task.save();

      logger.info(`Task created: ${task._id} by user ${userId}`);

      return { success: true, task };
    } catch (error) {
      logger.error('Create task error:', error);
      return { success: false, message: 'Failed to create task' };
    }
  }

  /**
   * Complete task
   */
  async completeTask(taskId, userId, notes) {
    try {
      const task = await TelecallerTask.findById(taskId);

      if (!task) {
        return { success: false, message: 'Task not found' };
      }

      await task.markComplete(userId, notes);

      return { success: true, task };
    } catch (error) {
      logger.error('Complete task error:', error);
      return { success: false, message: 'Failed to complete task' };
    }
  }

  // ==================== FOLLOW-UP METHODS ====================

  /**
   * Create follow-up
   */
  async createFollowUp(organizationId, userId, followUpData) {
    try {
      const followUp = new FollowUp({
        organizationId,
        createdBy: userId,
        ...followUpData
      });

      await followUp.save();

      // Update lead's next follow-up
      if (followUpData.leadId) {
        await TelecallerLead.findByIdAndUpdate(followUpData.leadId, {
          nextFollowUp: {
            date: followUpData.scheduledDate,
            time: followUpData.scheduledTime,
            notes: followUpData.notes,
            assignedTo: followUpData.assignedTo
          },
          status: 'follow_up'
        });
      }

      logger.info(`Follow-up created: ${followUp._id} by user ${userId}`);

      return { success: true, followUp };
    } catch (error) {
      logger.error('Create follow-up error:', error);
      return { success: false, message: 'Failed to create follow-up' };
    }
  }

  /**
   * Get follow-ups
   */
  async getFollowUps(userId, organizationId, options = {}) {
    try {
      const { page = 1, limit = 20, status, startDate, endDate } = options;

      const [followUps, total] = await Promise.all([
        FollowUp.findByUser(userId, organizationId, { status, startDate, endDate, page, limit }),
        FollowUp.countDocuments({
          assignedTo: userId,
          organizationId,
          isActive: true,
          ...(status && { status })
        })
      ]);

      return {
        success: true,
        followUps,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get follow-ups error:', error);
      return { success: false, message: 'Failed to get follow-ups' };
    }
  }

  /**
   * Get today's follow-ups
   */
  async getTodayFollowUps(userId, organizationId) {
    try {
      const followUps = await FollowUp.getTodayFollowUps(userId, organizationId);
      return { success: true, followUps };
    } catch (error) {
      logger.error('Get today follow-ups error:', error);
      return { success: false, message: 'Failed to get follow-ups' };
    }
  }

  // ==================== DASHBOARD METHODS ====================

  /**
   * Get dashboard stats
   */
  async getDashboardStats(organizationId, userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all stats in parallel
      const [
        leadCounts,
        callStats,
        taskCounts,
        todayTasks,
        todayFollowUps
      ] = await Promise.all([
        this.getLeadCategoryCounts(organizationId, userId),
        this.getCallStatistics(organizationId, userId, today, new Date()),
        TelecallerTask.getTaskCounts(userId, organizationId),
        TelecallerTask.getTodayTasks(userId, organizationId),
        FollowUp.getTodayFollowUps(userId, organizationId)
      ]);

      return {
        success: true,
        stats: {
          leads: leadCounts.counts,
          calls: callStats.stats,
          tasks: taskCounts,
          todayTasks: todayTasks.length,
          todayFollowUps: todayFollowUps.length
        }
      };
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      return { success: false, message: 'Failed to get dashboard stats' };
    }
  }

  /**
   * Get daily report
   */
  async getDailyReport(organizationId, userId, date) {
    try {
      const reportDate = date ? new Date(date) : new Date();
      reportDate.setHours(0, 0, 0, 0);

      // Create proper start and end of day for date range queries
      const startOfDay = new Date(reportDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      const [callStats, callTimeline, tasksCompleted, followUpsCompleted, attendanceSession] = await Promise.all([
        this.getCallStatistics(organizationId, userId, startOfDay, endOfDay),
        this.getCallTimeline(organizationId, userId, reportDate),
        TelecallerTask.find({
          organizationId,
          assignedTo: userId,
          status: 'completed',
          completedAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }).countDocuments(),
        FollowUp.find({
          organizationId,
          assignedTo: userId,
          status: 'completed',
          completedAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }).countDocuments(),
        // Get attendance session for the day
        TelecallerSession.findOne({
          organizationId,
          userId,
          date: reportDate
        }).populate('userId', 'profile.firstName profile.lastName email role')
      ]);

      // Build activities array from attendance and calls
      const activities = [];

      // Add login activity
      if (attendanceSession?.checkIn?.time) {
        activities.push({
          time: new Date(attendanceSession.checkIn.time).toISOString(),
          action: 'Login',
          description: 'Started work',
          type: 'login'
        });
      }

      // Add call activities (limit to recent ones)
      if (callTimeline && callTimeline.length > 0) {
        const recentCalls = callTimeline.slice(-5); // Last 5 calls
        recentCalls.forEach(call => {
          activities.push({
            time: new Date(call.createdAt).toISOString(),
            action: call.status === 'connected' ? 'Call Connected' : 'Call Made',
            description: call.leadId?.name || call.phoneNumber,
            type: call.status === 'connected' ? 'resume' : 'break'
          });
        });
      }

      // Add logout activity
      if (attendanceSession?.checkOut?.time) {
        activities.push({
          time: new Date(attendanceSession.checkOut.time).toISOString(),
          action: 'Logout',
          description: 'Ended work',
          type: 'logout'
        });
      }

      // Sort activities by time (ISO strings sort chronologically)
      activities.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      // Calculate working hours - dynamically if user is still checked in
      let workingHours = 0;
      logger.info('Calculating working hours for daily report:');
      logger.info(`  Attendance session found: ${!!attendanceSession}`);
      logger.info(`  Check-in time: ${attendanceSession?.checkIn?.time}`);
      logger.info(`  Check-out time: ${attendanceSession?.checkOut?.time}`);
      logger.info(`  Stored workingHours: ${attendanceSession?.workingHours}`);

      if (attendanceSession?.checkIn?.time) {
        if (attendanceSession.checkOut?.time) {
          // User has checked out - use stored working hours or calculate
          workingHours = attendanceSession.workingHours || 0;
          if (workingHours === 0) {
            // Calculate if not stored
            const checkInTime = new Date(attendanceSession.checkIn.time);
            const checkOutTime = new Date(attendanceSession.checkOut.time);
            const diffMs = checkOutTime.getTime() - checkInTime.getTime();
            workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
            logger.info(`  Calculated working hours from check-out: ${workingHours}`);
          }
        } else {
          // User is still checked in - calculate dynamically from now
          const checkInTime = new Date(attendanceSession.checkIn.time);
          const now = new Date();
          const diffMs = now.getTime() - checkInTime.getTime();
          workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
          logger.info(`  Calculated working hours dynamically: ${workingHours}`);
        }
      }
      logger.info(`  Final working hours: ${workingHours}`);

      return {
        success: true,
        report: {
          date: reportDate,
          // Return raw ISO timestamps so client can format in local timezone
          loginTime: attendanceSession?.checkIn?.time ? new Date(attendanceSession.checkIn.time).toISOString() : null,
          logoutTime: attendanceSession?.checkOut?.time ? new Date(attendanceSession.checkOut.time).toISOString() : null,
          workingHours,
          totalBreaks: 0, // Not implemented yet
          calls: callStats.stats,
          timeline: callTimeline.timeline,
          tasksCompleted,
          followUpsCompleted,
          activities
        }
      };
    } catch (error) {
      logger.error('Get daily report error:', error);
      return { success: false, message: 'Failed to get daily report' };
    }
  }

  // ==================== ATTENDANCE METHODS ====================

  /**
   * Telecaller check-in
   */
  async telecallerCheckIn(organizationId, userId, data) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already checked in today
      let session = await TelecallerSession.findOne({
        organizationId,
        userId,
        date: today
      });

      if (session && session.checkIn && session.checkIn.time) {
        return { success: false, message: 'Already checked in for today' };
      }

      // Create or update session
      if (!session) {
        session = new TelecallerSession({
          organizationId,
          userId,
          date: today,
          status: 'active'
        });
      }

      session.checkIn = {
        time: new Date(),
        location: data.location,
        ip: data.ip
      };
      session.status = 'active';

      await session.save();

      // Populate user info
      await session.populate('userId', 'profile.firstName profile.lastName email role');

      return {
        success: true,
        attendance: session
      };
    } catch (error) {
      logger.error('Telecaller check-in error:', error);
      return { success: false, message: 'Failed to check in' };
    }
  }

  /**
   * Telecaller check-out
   */
  async telecallerCheckOut(organizationId, userId, data) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find today's session
      const session = await TelecallerSession.findOne({
        organizationId,
        userId,
        date: today
      });

      if (!session || !session.checkIn || !session.checkIn.time) {
        return { success: false, message: 'No check-in record found for today' };
      }

      if (session.checkOut && session.checkOut.time) {
        return { success: false, message: 'Already checked out for today' };
      }

      // Set check-out
      session.checkOut = {
        time: new Date(),
        location: data.location,
        ip: data.ip
      };
      session.status = 'completed';

      // Calculate working hours
      session.calculateWorkingHours();

      await session.save();

      // Populate user info
      await session.populate('userId', 'profile.firstName profile.lastName email role');

      return {
        success: true,
        attendance: session
      };
    } catch (error) {
      logger.error('Telecaller check-out error:', error);
      return { success: false, message: 'Failed to check out' };
    }
  }

  /**
   * Get today's attendance for telecaller
   */
  async getTelecallerTodayAttendance(organizationId, userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const session = await TelecallerSession.findOne({
        organizationId,
        userId,
        date: today
      }).populate('userId', 'profile.firstName profile.lastName email role');

      if (!session) {
        return {
          success: true,
          attendance: null
        };
      }

      // Calculate working hours dynamically if user is still checked in
      let calculatedWorkingHours = session.workingHours || 0;
      if (session.checkIn?.time && !session.checkOut?.time) {
        // User is still checked in - calculate dynamically from now
        const checkInTime = new Date(session.checkIn.time);
        const now = new Date();
        const diffMs = now.getTime() - checkInTime.getTime();
        calculatedWorkingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
      } else if (session.checkIn?.time && session.checkOut?.time && !session.workingHours) {
        // User checked out but workingHours not stored - calculate
        const checkInTime = new Date(session.checkIn.time);
        const checkOutTime = new Date(session.checkOut.time);
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        calculatedWorkingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }

      // Return session with calculated working hours
      const sessionObj = session.toObject();
      sessionObj.workingHours = calculatedWorkingHours;

      return {
        success: true,
        attendance: sessionObj
      };
    } catch (error) {
      logger.error('Get telecaller today attendance error:', error);
      return { success: false, message: 'Failed to get attendance' };
    }
  }
}

export default new TelecallingService();