/**
 * Admin middleware to restrict access to admin users only
 */
const admin = (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in admin authorization'
    });
  }
};

/**
 * Role-based access control middleware
 * @param {string|Array} allowedRoles - Role or array of roles that are allowed
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${roles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in role authorization'
      });
    }
  };
};

/**
 * Staff middleware (admin or staff roles)
 */
const staff = requireRole(['admin', 'staff']);

/**
 * Manager middleware (admin or manager roles)
 */
const manager = requireRole(['admin', 'manager']);

module.exports = { admin, requireRole, staff, manager }; 