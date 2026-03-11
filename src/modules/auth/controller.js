import authService from './service.js';
import { successResponse, errorResponse, createdResponse } from '../../utils/response.js';
import { sanitizeUser } from '../../utils/helpers.js';
import logger from '../../utils/logger.js';

class AuthController {
  /**
   * Register new organization and admin user
   */
  async register(req, res, next) {
    try {
      const { organization, user } = req.body;

      const result = await authService.registerOrganization(organization, user);

      logger.info(`Organization registered: ${organization.name}`);

      return createdResponse(res, {
        organization: result.organization,
        user: sanitizeUser(result.user),
        token: result.token,
        refreshToken: result.refreshToken
      }, 'Organization registered successfully');
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      if (!result.success) {
        return errorResponse(res, result.message, 401);
      }

      logger.info(`User logged in: ${email}`);

      return successResponse(res, {
        user: sanitizeUser(result.user),
        token: result.token,
        refreshToken: result.refreshToken
      }, 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const result = await authService.verifyRefreshToken(refreshToken);

      if (!result.success) {
        return errorResponse(res, result.message, 401);
      }

      return successResponse(res, {
        token: result.token,
        refreshToken: result.refreshToken
      }, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh error:', error);
      next(error);
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(req, res, next) {
    try {
      const user = await authService.getUserById(req.user._id);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      return successResponse(res, sanitizeUser(user), 'User retrieved successfully');
    } catch (error) {
      logger.error('Get current user error:', error);
      next(error);
    }
  }

  /**
   * Update profile
   */
  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user._id, req.body);

      return successResponse(res, sanitizeUser(user), 'Profile updated successfully');
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const result = await authService.changePassword(req.user._id, currentPassword, newPassword);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      logger.error('Change password error:', error);
      next(error);
    }
  }
}

export default new AuthController();