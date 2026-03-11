import { ROLES, ROLE_HIERARCHY } from '../config/constants.js';
import { errorResponse, forbiddenResponse } from '../utils/response.js';

/**
 * Check if user has required role(s)
 * @param {...string} roles - Required roles
 */
export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return forbiddenResponse(res, `Access denied. Required role: ${roles.join(' or ')}`);
    }

    next();
  };
};

/**
 * Check if user has minimum role level
 * @param {string} minimumRole - Minimum required role
 */
export const checkRoleLevel = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const userRole = req.user.role;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return forbiddenResponse(res, `Access denied. Minimum role required: ${minimumRole}`);
    }

    next();
  };
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.SUPER_ADMIN) {
    return forbiddenResponse(res, 'Access denied. Super admin privileges required.');
  }
  next();
};

/**
 * Check if user is admin or above
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }

  const adminRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
  if (!adminRoles.includes(req.user.role)) {
    return forbiddenResponse(res, 'Access denied. Admin privileges required.');
  }
  next();
};

/**
 * Check if user is HR or above
 */
export const isHR = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }

  const hrRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR];
  if (!hrRoles.includes(req.user.role)) {
    return forbiddenResponse(res, 'Access denied. HR privileges required.');
  }
  next();
};

/**
 * Check if user can access resource (own resource or admin/HR)
 */
export const canAccessResource = (resourceUserIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const resourceUserId = req.params[resourceUserIdParam];
    const userId = req.user._id.toString();
    const userRole = req.user.role;

    // Admin roles can access any resource
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR].includes(userRole)) {
      return next();
    }

    // Check if user is accessing their own resource
    if (resourceUserId === userId) {
      return next();
    }

    return forbiddenResponse(res, 'Access denied. You can only access your own resources.');
  };
};

/**
 * Check organization access
 * Ensures user can only access resources in their organization
 */
export const checkOrganization = (req, res, next) => {
  const resourceOrgId = req.body.organizationId || req.params.organizationId || req.query.organizationId;

  if (!resourceOrgId) {
    // No organization specified, proceed (will be set from user context)
    return next();
  }

  if (!req.user || !req.organizationId) {
    return errorResponse(res, 'Authentication required', 401);
  }

  if (resourceOrgId.toString() !== req.organizationId.toString()) {
    return forbiddenResponse(res, 'Access denied. Organization mismatch.');
  }

  next();
};