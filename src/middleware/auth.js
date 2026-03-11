import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided. Authorization denied.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Invalid token format. Authorization denied.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId)
      .populate('organizationId')
      .select('-password');

    if (!user) {
      return errorResponse(res, 'User not found. Authorization denied.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'User account is deactivated. Authorization denied.', 401);
    }

    // Attach user to request
    req.user = user;
    req.organizationId = user.organizationId._id;

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token. Authorization denied.', 401);
    }

    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired. Please refresh your token.', 401);
    }

    return errorResponse(res, 'Authentication failed.', 401);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token present, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId)
          .populate('organizationId')
          .select('-password');

        if (user && user.isActive) {
          req.user = user;
          req.organizationId = user.organizationId._id;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

/**
 * Generate JWT token
 * @param {Object} user - User document
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Generate refresh token
 * @param {Object} user - User document
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
};