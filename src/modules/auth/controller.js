import authService from './service.js';
import { successResponse, errorResponse, createdResponse } from '../../utils/response.js';
import { sanitizeUser } from '../../utils/helpers.js';
import logger from '../../utils/logger.js';
import { sendTelecallerWelcomeEmail } from '../../utils/email.js';

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
      const { email, identifier, password } = req.body;

      // Support both 'email' and 'identifier' fields
      // identifier can be email or phone
      const loginIdentifier = identifier || email;

      const result = await authService.login(loginIdentifier, password);

      if (!result.success) {
        return errorResponse(res, result.message, 401);
      }

      logger.info(`User logged in: ${loginIdentifier}`);

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

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      return successResponse(res, null, result.message);
    } catch (error) {
      logger.error('Forgot password error:', error);
      next(error);
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      const result = await authService.resetPassword(token, newPassword);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      }, 'Password reset successfully');
    } catch (error) {
      logger.error('Reset password error:', error);
      next(error);
    }
  }

  /**
   * Verify reset token
   */
  async verifyResetToken(req, res, next) {
    try {
      const { token } = req.params;

      const result = await authService.verifyResetToken(token);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(res, { email: result.email }, 'Token is valid');
    } catch (error) {
      logger.error('Verify reset token error:', error);
      next(error);
    }
  }

  /**
   * Create telecaller (admin/HR only)
   */
  async createTelecaller(req, res, next) {
    try {
      const { email, firstName, lastName, phone, password } = req.body;
      const organizationId = req.organizationId;

      const result = await authService.createTelecaller(organizationId, {
        email,
        firstName,
        lastName,
        phone,
        password
      });

      // Send welcome email with credentials
      if (result.tempPassword) {
        await sendTelecallerWelcomeEmail(
          email,
          `${firstName} ${lastName}`,
          result.tempPassword
        );
      }

      logger.info(`Telecaller created: ${email}`);

      return createdResponse(res, {
        user: sanitizeUser(result.user)
      }, 'Telecaller created successfully');
    } catch (error) {
      logger.error('Create telecaller error:', error);
      next(error);
    }
  }

  /**
   * Get all telecallers
   */
  async getTelecallers(req, res, next) {
    try {
      const { page, limit, search, isActive } = req.query;
      const organizationId = req.organizationId;

      const result = await authService.getTelecallers(
        organizationId,
        { search, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined },
        { page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
      );

      return res.status(200).json({
        success: true,
        message: 'Telecallers retrieved successfully',
        data: result.telecallers,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get telecallers error:', error);
      next(error);
    }
  }
}

export default new AuthController();