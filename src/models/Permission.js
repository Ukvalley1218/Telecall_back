import mongoose from 'mongoose';

/**
 * Permission Schema
 * Defines what features/modules an employee can access
 */
const permissionSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One permission document per user
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    index: true
  },
  // Module-level permissions
  modules: {
    hrms: {
      canView: { type: Boolean, default: true },
      canEdit: { type: Boolean, default: false }
    },
    fm: { // Factory Made
      canView: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false },
      canCreate: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      stages: [{ type: String }] // Specific stages user can access
    },
    hm: { // Home Made/Custom
      canView: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false },
      canCreate: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      stages: [{ type: String }] // Specific stages user can access
    },
    marketing: {
      canView: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false }
    },
    sales: {
      canView: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false }
    },
    interiorDesigner: {
      canView: { type: Boolean, default: false },
      canEdit: { type: Boolean, default: false }
    }
  },
  // HRMS feature-level permissions (for employees)
  features: {
    viewOwnProfile: { type: Boolean, default: true },
    editOwnProfile: { type: Boolean, default: false },
    viewOwnAttendance: { type: Boolean, default: true },
    viewOwnPayslips: { type: Boolean, default: true },
    viewOwnLeaves: { type: Boolean, default: true },
    applyLeave: { type: Boolean, default: true },
    viewOwnPerformance: { type: Boolean, default: true },
    viewOwnIncentives: { type: Boolean, default: true },
    submitDWR: { type: Boolean, default: false }, // Daily Work Report
    viewCalendar: { type: Boolean, default: true },
    viewTraining: { type: Boolean, default: true }
  },
  // Custom permissions (flexible key-value pairs)
  customPermissions: {
    type: Map,
    of: Boolean,
    default: {}
  },
  // Who assigned these permissions
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
permissionSchema.index({ organizationId: 1, userId: 1 });

// Static method to get default permissions for a role
permissionSchema.statics.getDefaultPermissions = function(role) {
  const basePermissions = {
    modules: {
      hrms: { canView: true, canEdit: false },
      fm: { canView: false, canEdit: false, canCreate: false, canDelete: false, stages: [] },
      hm: { canView: false, canEdit: false, canCreate: false, canDelete: false, stages: [] },
      marketing: { canView: false, canEdit: false },
      sales: { canView: false, canEdit: false },
      interiorDesigner: { canView: false, canEdit: false }
    },
    features: {
      viewOwnProfile: true,
      editOwnProfile: false,
      viewOwnAttendance: true,
      viewOwnPayslips: true,
      viewOwnLeaves: true,
      applyLeave: true,
      viewOwnPerformance: true,
      viewOwnIncentives: true,
      submitDWR: false,
      viewCalendar: true,
      viewTraining: true
    }
  };

  // Role-based defaults
  switch (role) {
    case 'super_admin':
      return {
        modules: {
          hrms: { canView: true, canEdit: true },
          fm: { canView: true, canEdit: true, canCreate: true, canDelete: true, stages: [] },
          hm: { canView: true, canEdit: true, canCreate: true, canDelete: true, stages: [] },
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
    case 'admin':
      return {
        modules: {
          hrms: { canView: true, canEdit: true },
          fm: { canView: true, canEdit: true, canCreate: true, canDelete: true, stages: [] },
          hm: { canView: true, canEdit: true, canCreate: true, canDelete: true, stages: [] },
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
    case 'hr':
      return {
        modules: {
          hrms: { canView: true, canEdit: true },
          fm: { canView: true, canEdit: false, canCreate: false, canDelete: false, stages: [] },
          hm: { canView: true, canEdit: false, canCreate: false, canDelete: false, stages: [] },
          marketing: { canView: true, canEdit: false },
          sales: { canView: true, canEdit: false },
          interiorDesigner: { canView: true, canEdit: false }
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
    case 'employee':
    default:
      return basePermissions;
  }
};

// Method to check if user has permission for a module
permissionSchema.methods.canAccessModule = function(moduleName, action = 'view') {
  if (!this.modules || !this.modules[moduleName]) return false;

  const modulePerms = this.modules[moduleName];

  switch (action) {
    case 'view':
      return modulePerms.canView === true;
    case 'edit':
      return modulePerms.canEdit === true;
    case 'create':
      return modulePerms.canCreate === true;
    case 'delete':
      return modulePerms.canDelete === true;
    default:
      return false;
  }
};

// Method to check if user has a specific feature permission
permissionSchema.methods.hasFeature = function(featureName) {
  if (!this.features) return false;
  return this.features[featureName] === true;
};

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;