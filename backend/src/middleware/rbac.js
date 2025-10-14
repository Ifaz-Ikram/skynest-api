/**
 * Role-Based Access Control (RBAC) Middleware
 * Roles: Admin, Manager, Receptionist, Accountant, Customer
 */

/**
 * Middleware to require specific roles
 * @param {...string} allowedRoles - One or more roles that are allowed
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // requireAuth should have already populated req.user
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!user.role) {
      return res.status(403).json({ error: 'No role assigned to user' });
    }
    
    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
}

/**
 * Middleware to require staff roles (any employee)
 * Allows: Admin, Manager, Receptionist, Accountant
 * Denies: Customer
 */
function requireStaff(req, res, next) {
  return requireRole('Admin', 'Manager', 'Receptionist', 'Accountant')(req, res, next);
}

/**
 * Middleware to require Customer role
 */
function requireCustomer(req, res, next) {
  return requireRole('Customer')(req, res, next);
}

/**
 * Check if user owns a resource (for customer-specific data)
 * @param {Object} req - Express request
 * @param {number} guestId - The guest_id to check ownership
 * @returns {boolean}
 */
function ownsResource(req, guestId) {
  const user = req.user;
  if (!user) return false;
  
  // Admin and Manager can access all resources
  if (user.role === 'Admin' || user.role === 'Manager') {
    return true;
  }
  
  // Customer can only access their own data
  if (user.role === 'Customer') {
    return user.guest_id === guestId;
  }
  
  // Staff can access if they're working on it
  return true;
}

module.exports = {
  requireRole,
  requireStaff,
  requireCustomer,
  ownsResource,
};
