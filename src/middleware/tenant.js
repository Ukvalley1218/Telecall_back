import { errorResponse } from '../utils/response.js';

/**
 * Multi-tenant context middleware
 * Extracts organization context from request and ensures data isolation
 */
export const tenantContext = (req, res, next) => {
  // Skip for public routes
  const publicPaths = ['/api/auth/register', '/api/auth/login', '/health'];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  // Get organization ID from user context (set by auth middleware)
  if (req.user && req.user.organizationId) {
    req.organizationId = req.user.organizationId._id || req.user.organizationId;
    return next();
  }

  // For authenticated requests without organization context
  if (req.user) {
    return errorResponse(res, 'Organization context not found', 400);
  }

  next();
};

/**
 * Add organization filter to query
 * Automatically filters queries by organization
 */
export const addOrganizationFilter = (req, res, next) => {
  if (req.organizationId) {
    req.organizationFilter = { organizationId: req.organizationId };
  }
  next();
};

/**
 * Set organization ID in request body
 * Automatically sets organizationId in request body
 */
export const setOrganizationInBody = (req, res, next) => {
  if (req.organizationId && !req.body.organizationId) {
    req.body.organizationId = req.organizationId;
  }
  next();
};

/**
 * Validate organization access for a specific resource
 * @param {string} paramName - Name of the parameter containing organization ID
 */
export const validateOrganizationAccess = (paramName = 'organizationId') => {
  return (req, res, next) => {
    const resourceOrgId = req.params[paramName] || req.body[paramName];

    if (!resourceOrgId) {
      return next();
    }

    if (!req.organizationId) {
      return errorResponse(res, 'Organization context required', 400);
    }

    if (resourceOrgId.toString() !== req.organizationId.toString()) {
      return errorResponse(res, 'Access denied. Resource belongs to different organization.', 403);
    }

    next();
  };
};

/**
 * Middleware to add organization ID to mongoose query
 */
export const filterByOrganization = (req, res, next) => {
  if (!req.organizationId) {
    return next();
  }

  // Add organization filter to query parameters
  if (!req.query) {
    req.query = {};
  }

  req.query.organizationId = req.organizationId.toString();
  next();
};

/**
 * Extract organization from header (for API integrations)
 */
export const extractOrganizationFromHeader = (req, res, next) => {
  const orgHeader = req.headers['x-organization-id'];

  if (orgHeader) {
    req.headerOrganizationId = orgHeader;
  }

  next();
};