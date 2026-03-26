import Permission from '../models/Permission.js';
import { errorResponse, forbiddenResponse } from '../utils/response.js';

/**
 * Check if user has permission to access a feature
 * @param {string} featureName - The feature to check
 */
export const checkFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }

      // Admin and HR have access to all features
      const adminRoles = ['super_admin', 'admin', 'hr'];
      if (adminRoles.includes(req.user.role)) {
        return next();
      }

      // Check user permissions
      const permission = await Permission.findOne({ userId: req.user._id });

      if (!permission) {
        // Create default permissions for user
        const defaultPerms = Permission.getDefaultPermissions(req.user.role);
        const newPermission = new Permission({
          organizationId: req.organizationId,
          userId: req.user._id,
          ...defaultPerms
        });
        await newPermission.save();

        // Check if default permission allows this feature
        if (!newPermission.hasFeature(featureName)) {
          return forbiddenResponse(res, `Access denied. You don't have permission to access ${featureName}`);
        }
        return next();
      }

      if (!permission.hasFeature(featureName)) {
        return forbiddenResponse(res, `Access denied. You don't have permission to access ${featureName}`);
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return errorResponse(res, 'Permission check failed', 500);
    }
  };
};

/**
 * Check if user has permission to access a module
 * @param {string} moduleName - The module to check
 * @param {string} action - The action (view, edit, create, delete)
 */
export const checkModule = (moduleName, action = 'view') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }

      // Admin and HR have access to all modules
      const adminRoles = ['super_admin', 'admin', 'hr'];
      if (adminRoles.includes(req.user.role)) {
        return next();
      }

      // Check user permissions
      const permission = await Permission.findOne({ userId: req.user._id });

      if (!permission) {
        // Create default permissions
        const defaultPerms = Permission.getDefaultPermissions(req.user.role);
        const newPermission = new Permission({
          organizationId: req.organizationId,
          userId: req.user._id,
          ...defaultPerms
        });
        await newPermission.save();

        if (!newPermission.canAccessModule(moduleName, action)) {
          return forbiddenResponse(res, `Access denied. You don't have permission to ${action} in ${moduleName}`);
        }
        return next();
      }

      if (!permission.canAccessModule(moduleName, action)) {
        return forbiddenResponse(res, `Access denied. You don't have permission to ${action} in ${moduleName}`);
      }

      next();
    } catch (error) {
      console.error('Module permission check error:', error);
      return errorResponse(res, 'Permission check failed', 500);
    }
  };
};

/**
 * Get user permissions middleware - attaches permissions to request
 */
export const attachPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Admin and HR have full access
    const adminRoles = ['super_admin', 'admin', 'hr'];
    if (adminRoles.includes(req.user.role)) {
      req.permissions = {
        isAdmin: true,
        isHR: req.user.role === 'hr',
        modules: {
          hrms: { canView: true, canEdit: true },
          fm: { canView: true, canEdit: true, canCreate: true, canDelete: true },
          hm: { canView: true, canEdit: true, canCreate: true, canDelete: true },
          marketing: { canView: true, canEdit: true },
          sales: { canView: true, canEdit: true },
          interiorDesigner: { canView: true, canEdit: true }
        },
        features: {
          viewOwnProfile: true,
          editOwnProfile: true,
          viewOwnAttendance: true,
          viewOwnPayslips: true,
          viewOwnLeaves: true,
          applyLeave: true,
          viewOwnPerformance: true,
          viewOwnIncentives: true,
          submitDWR: true,
          viewCalendar: true,
          viewTraining: true
        }
      };
      return next();
    }

    // Get user permissions
    let permission = await Permission.findOne({ userId: req.user._id });

    if (!permission) {
      // Create default permissions
      const defaultPerms = Permission.getDefaultPermissions(req.user.role);
      permission = new Permission({
        organizationId: req.organizationId,
        userId: req.user._id,
        ...defaultPerms
      });
      await permission.save();
    }

    req.permissions = {
      isAdmin: false,
      isHR: false,
      modules: permission.modules,
      features: permission.features
    };

    next();
  } catch (error) {
    console.error('Attach permissions error:', error);
    next(); // Continue without permissions
  }
};