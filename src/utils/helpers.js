import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique ID
 * @returns {string} UUID
 */
export const generateId = () => {
  return uuidv4();
};

/**
 * Generate employee ID
 * @param {string} prefix - Organization prefix
 * @param {number} count - Employee count
 * @returns {string} Employee ID
 */
export const generateEmployeeId = (prefix = 'EMP', count) => {
  const paddedNumber = String(count).padStart(4, '0');
  return `${prefix}${paddedNumber}`;
};

/**
 * Generate KPI ID
 * @param {string} group - KPI group
 * @param {number} count - KPI count
 * @returns {string} KPI ID
 */
export const generateKPIId = (group, count) => {
  const paddedNumber = String(count).padStart(3, '0');
  return `${group.toUpperCase()}_KPI_${paddedNumber}`;
};

/**
 * Generate shift code
 * @param {number} count - Shift count
 * @returns {string} Shift code
 */
export const generateShiftCode = (count) => {
  const paddedNumber = String(count).padStart(3, '0');
  return `SHIFT_${paddedNumber}`;
};

/**
 * Calculate working hours between two dates
 * @param {Date} checkIn - Check-in time
 * @param {Date} checkOut - Check-out time
 * @returns {number} Working hours in decimal
 */
export const calculateWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;

  const diffMs = checkOut - checkIn;
  const diffHours = diffMs / (1000 * 60 * 60);

  return Math.round(diffHours * 100) / 100;
};

/**
 * Calculate late minutes
 * @param {Date} checkInTime - Actual check-in time
 * @param {string} shiftStartTime - Shift start time (HH:MM format)
 * @param {number} bufferMinutes - Late buffer in minutes
 * @returns {number} Late minutes (0 if not late)
 */
export const calculateLateMinutes = (checkInTime, shiftStartTime, bufferMinutes = 10) => {
  const [hours, minutes] = shiftStartTime.split(':').map(Number);

  const shiftStart = new Date(checkInTime);
  shiftStart.setHours(hours, minutes, 0, 0);

  const bufferTime = new Date(shiftStart.getTime() + bufferMinutes * 60000);

  if (checkInTime > bufferTime) {
    const lateMs = checkInTime - shiftStart;
    return Math.floor(lateMs / 60000);
  }

  return 0;
};

/**
 * Calculate incentive payable date
 * @param {Date} salesDate - Date of sale
 * @param {number} payoutDays - Days after sale (default 45)
 * @returns {Date} Payable date
 */
export const calculateIncentivePayableDate = (salesDate, payoutDays = 45) => {
  const payableDate = new Date(salesDate);

  // Move to the beginning of next month
  payableDate.setMonth(payableDate.getMonth() + 1, 1);

  // Add payout days
  payableDate.setDate(payableDate.getDate() + payoutDays);

  return payableDate;
};

/**
 * Format date for response
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * Check if date falls on weekend
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

/**
 * Get month name from number
 * @param {number} month - Month number (1-12)
 * @returns {string} Month name
 */
export const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
};

/**
 * Sanitize user object for response
 * @param {Object} user - User document
 * @returns {Object} Sanitized user object
 */
export const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  return userObj;
};