import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

/**
 * Validation middleware
 * Checks express-validator results and returns errors if any
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return errorResponse(res, 'Validation failed', 400, errorMessages);
  }

  next();
};

/**
 * Sanitize request body
 * Removes specified fields from request body
 * @param {...string} fields - Fields to remove
 */
export const sanitizeBody = (...fields) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach(field => {
        delete req.body[field];
      });
    }
    next();
  };
};

/**
 * Validate MongoDB ObjectId
 * @param {string} paramName - Parameter name to validate
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    if (!id || !objectIdRegex.test(id)) {
      return errorResponse(res, `Invalid ${paramName} format`, 400);
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return errorResponse(res, 'Page must be a positive integer', 400);
    }
    req.query.page = pageNum;
  }

  if (limit) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return errorResponse(res, 'Limit must be between 1 and 100', 400);
    }
    req.query.limit = limitNum;
  }

  next();
};

/**
 * Validate date range
 * @param {string} startDateParam - Start date parameter name
 * @param {string} endDateParam - End date parameter name
 */
export const validateDateRange = (startDateParam = 'startDate', endDateParam = 'endDate') => {
  return (req, res, next) => {
    const { [startDateParam]: startDate, [endDateParam]: endDate } = req.query;

    if (startDate && !Date.parse(startDate)) {
      return errorResponse(res, 'Invalid start date format', 400);
    }

    if (endDate && !Date.parse(endDate)) {
      return errorResponse(res, 'Invalid end date format', 400);
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        return errorResponse(res, 'Start date must be before end date', 400);
      }
    }

    next();
  };
};