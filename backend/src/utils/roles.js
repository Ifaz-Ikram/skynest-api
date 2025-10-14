// src/utils/roles.js
function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ error: "Missing bearer token" });
    if (!allowed.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden: role not allowed", role: req.user.role });
    }
    next();
  };
}

module.exports = { requireRole };
