/**
 * Middleware to restrict route access to specific user roles.
 * Must be used after `verifyAuth`.
 */
export const requireRole = (allowedRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role !== allowedRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires ${allowedRole} privilege. Your current role is ${req.user.role}.`
      });
    }

    next();
  };
};

export const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] privileges. Your role is ${req.user.role}.`
      });
    }

    next();
  };
};

