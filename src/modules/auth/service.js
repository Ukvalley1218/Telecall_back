import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Organization from '../../models/Organization.js';
import User from '../../models/User.js';
import { generateToken, generateRefreshToken } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';
import logger from '../../utils/logger.js';

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
}

export default new AuthService();