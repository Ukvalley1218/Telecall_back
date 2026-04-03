// User Roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HR: 'hr',
  TELECALLER: 'telecaller',
  EMPLOYEE: 'employee'
};

// Role hierarchy for permission checks
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 5,
  [ROLES.ADMIN]: 4,
  [ROLES.HR]: 3,
  [ROLES.TELECALLER]: 2,
  [ROLES.EMPLOYEE]: 1
};

// Candidate Status
export const CANDIDATE_STATUS = {
  APPLIED: 'applied',
  SHORTLISTED: 'shortlisted',
  SCREENING: 'screening',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  SELECTED: 'selected',
  TRAINING: 'training',
  OFFER_SENT: 'offer_sent',
  REJECTED: 'rejected'
};

// Employee Status
export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
  TERMINATED: 'terminated'
};

// Attendance Status
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  HALF_DAY: 'half_day',
  LEAVE: 'leave'
};

// Offer Letter Status
export const OFFER_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
};

// Incentive Status
export const INCENTIVE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled'
};

// Incentive Reasons
export const INCENTIVE_REASONS = {
  EARLY_PAYMENT: 'early_payment',
  PARTIAL_PAYMENT: 'partial_payment',
  SALES_COMPLETION: 'sales_completion',
  OTHER: 'other'
};

// Sandwich Leave Status
export const SANDWICH_LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Late Mark Rules
export const LATE_MARK_RULES = {
  BUFFER_MINUTES: parseInt(process.env.LATE_MARK_BUFFER_MINUTES) || 10,
  DEDUCTION_HOURS: 1, // Deduct 1 hour for late mark
  // Monthly deduction rules
  HALF_DAY_THRESHOLD: 3, // 3 late marks = 0.5 day deduction
  FULL_DAY_THRESHOLD: 5  // 5 late marks = 1 full day deduction
};

// Incentive Payout
export const INCENTIVE_PAYOUT = {
  DAYS_AFTER_SALE: parseInt(process.env.INCENTIVE_PAYOUT_DAYS) || 45
};

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
};

// Document Types
export const DOCUMENT_TYPES = {
  AADHAR: 'aadhar',
  PAN: 'pan',
  EDUCATION: 'education',
  EXPERIENCE: 'experience',
  OTHER: 'other'
};

// Job Opening Status
export const JOB_OPENING_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
  ON_HOLD: 'on_hold'
};

// Employment Types
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship'
};