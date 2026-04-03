import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Organization from '../../models/Organization.js';
import User from '../../models/User.js';
import { generateToken, generateRefreshToken } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';
import logger from '../../utils/logger.js';
import { sendPasswordResetEmail } from '../../utils/email.js';

class AuthService {
  /**
   * Register new organization and admin user
   */
  async registerOrganization(orgData, userData) {
    // Check if domain already exists
    const existingOrg = await Organization.findOne({ domain: orgData.domain });
    if (existingOrg) {
      throw new Error('Domain already registered');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create organization
    const organization = new Organization({
      name: orgData.name,
      domain: orgData.domain,
      subscriptionPlan: orgData.subscriptionPlan || 'free',
      maxEmployees: orgData.maxEmployees || 10
    });
    await organization.save();

    // Create admin user
    const user = new User({
      organizationId: organization._id,
      email: userData.email,
      password: userData.password,
      role: ROLES.ADMIN,
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone
      }
    });
    await user.save();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      organization,
      user,
      token,
      refreshToken
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user with password
    const user = await User.findOne({ email }).select('+password').populate('organizationId');

    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    if (!user.isActive) {
      return { success: false, message: 'Account is deactivated' };
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      success: true,
      user,
      token,
      refreshToken
    };
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      if (decoded.type !== 'refresh') {
        return { success: false, message: 'Invalid refresh token' };
      }

      const user = await User.findById(decoded.userId).populate('organizationId');

      if (!user || !user.isActive) {
        return { success: false, message: 'User not found or inactive' };
      }

      const newToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return {
        success: true,
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Refresh token verification error:', error);
      return { success: false, message: 'Invalid or expired refresh token' };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    return User.findById(userId).populate('organizationId').select('-password');
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    const update = {};

    if (profileData.firstName !== undefined) {
      update['profile.firstName'] = profileData.firstName;
    }
    if (profileData.lastName !== undefined) {
      update['profile.lastName'] = profileData.lastName;
    }
    if (profileData.phone !== undefined) {
      update['profile.phone'] = profileData.phone;
    }
    if (profileData.avatar !== undefined) {
      update['profile.avatar'] = profileData.avatar;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    ).populate('organizationId').select('-password');

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return { success: false, message: 'Current password is incorrect' };
    }

    user.password = newPassword;
    await user.save();

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Create user for organization
   */
  async createUser(organizationId, userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const user = new User({
      organizationId,
      email: userData.email,
      password: userData.password,
      role: userData.role || ROLES.EMPLOYEE,
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone
      }
    });

    await user.save();
    return user;
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );
    return user;
  }

  /**
   * Forgot password - generate reset token and send email
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal whether user exists
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      };
    }

    if (!user.isActive) {
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiry (1 hour)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour

    await user.save({ validateBeforeSave: false });

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(email, resetToken, resetUrl);

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    };
  }

  /**
   * Reset password using token
   */
  async resetPassword(token, newPassword) {
    if (!token) {
      return { success: false, message: 'Reset token is required' };
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return { success: false, message: 'Invalid or expired reset token' };
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return {
      success: true,
      message: 'Password reset successfully',
      token: newToken,
      refreshToken: newRefreshToken,
      user: sanitizeUserForResponse(user)
    };
  }

  /**
   * Verify reset token validity
   */
  async verifyResetToken(token) {
    if (!token) {
      return { success: false, message: 'Reset token is required' };
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return { success: false, message: 'Invalid or expired reset token' };
    }

    return { success: true, message: 'Token is valid', email: user.email };
  }

  /**
   * Create telecaller user (for admin/HR)
   */
  async createTelecaller(organizationId, userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Generate temporary password if not provided
    const tempPassword = userData.password || generateTemporaryPassword();

    const user = new User({
      organizationId,
      email: userData.email,
      password: tempPassword,
      role: ROLES.TELECALLER,
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone
      }
    });

    await user.save();

    return {
      user,
      tempPassword: userData.password ? null : tempPassword // Return temp password only if auto-generated
    };
  }

  /**
   * Get all telecallers for organization
   */
  async getTelecallers(organizationId, filters = {}, options = {}) {
    const query = { organizationId, role: ROLES.TELECALLER };

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.search) {
      query.$or = [
        { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
        { 'profile.lastName': { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const telecallers = await User.find(query)
      .select('-password -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return {
      telecallers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

/**
 * Generate temporary password
 */
function generateTemporaryPassword() {
  const length = 10;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Sanitize user for response
 */
function sanitizeUserForResponse(user) {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpires;
  return userObj;
}

export default new AuthService();