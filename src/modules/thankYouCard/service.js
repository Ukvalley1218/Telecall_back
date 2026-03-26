import mongoose from 'mongoose';
import ThankYouCard from '../../models/ThankYouCard.js';
import Employee from '../../models/Employee.js';

class ThankYouCardService {
  /**
   * Send a thank you card
   */
  async sendCard(organizationId, senderId, data) {
    const { receiverId, cardType, title, message, tags, isPublic } = data;

    // Verify receiver exists and is in the same organization
    const receiver = await Employee.findOne({
      _id: receiverId,
      organizationId,
      status: 'active'
    });

    if (!receiver) {
      throw new Error('Recipient not found or not active');
    }

    // Prevent sending to self
    if (senderId.toString() === receiverId.toString()) {
      throw new Error('You cannot send a thank you card to yourself');
    }

    const card = new ThankYouCard({
      organizationId,
      senderId,
      receiverId,
      cardType,
      title,
      message,
      tags: tags || [],
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await card.save();

    return this.getCardById(card._id, organizationId);
  }

  /**
   * Get card by ID with populated fields
   */
  async getCardById(id, organizationId) {
    return ThankYouCard.findOne({ _id: id, organizationId })
      .populate('senderId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .populate('receiverId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation');
  }

  /**
   * Get cards sent by an employee
   */
  async getSentCards(senderId, organizationId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const cards = await ThankYouCard.find({ senderId, organizationId })
      .populate('receiverId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ThankYouCard.countDocuments({ senderId, organizationId });

    return {
      cards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get cards received by an employee
   */
  async getReceivedCards(receiverId, organizationId, options = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const query = { receiverId, organizationId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const cards = await ThankYouCard.find(query)
      .populate('senderId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ThankYouCard.countDocuments(query);

    return {
      cards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get all cards for organization (admin view)
   */
  async getAllCards(organizationId, options = {}) {
    const { page = 1, limit = 20, month, year, cardType } = options;
    const skip = (page - 1) * limit;

    const query = { organizationId };

    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }

    if (cardType) {
      query.cardType = cardType;
    }

    const cards = await ThankYouCard.find(query)
      .populate('senderId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .populate('receiverId', 'personalInfo.firstName personalInfo.lastName employeeId employment.department employment.designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ThankYouCard.countDocuments(query);

    return {
      cards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Mark card as read
   */
  async markAsRead(cardId, receiverId) {
    const card = await ThankYouCard.findOne({
      _id: cardId,
      receiverId
    });

    if (!card) {
      throw new Error('Card not found');
    }

    if (!card.isRead) {
      card.isRead = true;
      card.readAt = new Date();
      await card.save();
    }

    return card;
  }

  /**
   * Get unread count for an employee
   */
  async getUnreadCount(receiverId, organizationId) {
    return ThankYouCard.countDocuments({
      receiverId,
      organizationId,
      isRead: false
    });
  }

  /**
   * Get top receivers for a month
   */
  async getTopReceivers(organizationId, month, year, limit = 10) {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    return ThankYouCard.getTopReceivers(organizationId, currentMonth, currentYear, limit);
  }

  /**
   * Get card statistics for a month
   */
  async getCardStats(organizationId, month, year) {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    return ThankYouCard.getCardStats(organizationId, currentMonth, currentYear);
  }

  /**
   * Delete a card (only sender can delete)
   */
  async deleteCard(cardId, senderId, organizationId) {
    const card = await ThankYouCard.findOne({
      _id: cardId,
      senderId,
      organizationId
    });

    if (!card) {
      throw new Error('Card not found or you do not have permission to delete it');
    }

    await card.deleteOne();
    return { success: true, message: 'Card deleted successfully' };
  }

  /**
   * Get available card templates
   */
  getCardTemplates() {
    return [
      {
        type: 'appreciation',
        name: 'Appreciation',
        icon: 'heart',
        color: '#ef4444',
        defaultMessage: 'Thank you for your hard work and dedication!'
      },
      {
        type: 'teamwork',
        name: 'Teamwork',
        icon: 'users',
        color: '#3b82f6',
        defaultMessage: 'Thank you for being an amazing team player!'
      },
      {
        type: 'innovation',
        name: 'Innovation',
        icon: 'lightbulb',
        color: '#f59e0b',
        defaultMessage: 'Thank you for your creative thinking and innovative ideas!'
      },
      {
        type: 'leadership',
        name: 'Leadership',
        icon: 'award',
        color: '#8b5cf6',
        defaultMessage: 'Thank you for your exceptional leadership and guidance!'
      },
      {
        type: 'customer_service',
        name: 'Customer Service',
        icon: 'smile',
        color: '#10b981',
        defaultMessage: 'Thank you for delivering outstanding customer service!'
      },
      {
        type: 'going_above_beyond',
        name: 'Going Above & Beyond',
        icon: 'star',
        color: '#ec4899',
        defaultMessage: 'Thank you for going above and beyond the call of duty!'
      },
      {
        type: 'custom',
        name: 'Custom',
        icon: 'edit',
        color: '#6b7280',
        defaultMessage: ''
      }
    ];
  }
}

export default new ThankYouCardService();