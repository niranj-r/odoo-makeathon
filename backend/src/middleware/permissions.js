/**
 * BRIGHTLOOP - STAFF PERMISSION MIDDLEWARE
 * Enforces granular permissions for STAFF and verifies ADMIN superuser status.
 */

// Default operational permissions granted to ACTIVE staff members
export const DEFAULT_STAFF_PERMISSIONS = [
  'customers.view',
  'customers.create',
  'customers.update',
  'quotations.view',
  'quotations.create',
  'quotations.update_draft',
  'quotations.send',
  'subscriptions.view',
  'subscriptions.create',
  'subscriptions.request_cancel',
  'subscriptions.request_plan_change',
  'subscriptions.request_renewal',
  'invoices.view',
  'invoices.generate',
  'invoices.send',
  'invoices.download',
  'payments.view',
  'payments.retry',
  'profile.view_own',
  'profile.update_own'
];

/**
 * Checks if the authenticated user has the required permission.
 * - ADMIN always has all permissions.
 * - STAFF has permissions listed in DEFAULT_STAFF_PERMISSIONS (or profile custom permissions if configured).
 * - CUSTOMER is denied staff permissions.
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Account must be ACTIVE
    if (req.user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Operation blocked.'
      });
    }

    // ADMIN has full access
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Only STAFF can exercise staff permissions
    if (req.user.role === 'STAFF') {
      const allowed = DEFAULT_STAFF_PERMISSIONS.includes(permission);
      if (allowed) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: `Forbidden: Staff account lacks permission '${permission}'.`
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: Customers cannot access internal staff operations.'
    });
  };
};

