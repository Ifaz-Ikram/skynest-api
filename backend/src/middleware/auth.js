const jwt = require("jsonwebtoken");

function issueJWT(payload) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES || "2d";
  if (!secret) throw new Error("JWT_SECRET missing in .env");
  return jwt.sign(payload, secret, { expiresIn });
}

function parseCookie(header = "") {
  const out = {};
  if (!header) return out;
  const parts = header.split(/;\s*/);
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i > 0) {
      const k = decodeURIComponent(p.slice(0, i).trim());
      const v = decodeURIComponent(p.slice(i + 1));
      out[k] = v;
    }
  }
  return out;
}

function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  let token = m ? m[1] : null;
  if (!token) {
    const cookies = parseCookie(req.headers.cookie || "");
    token = cookies.token || null;
  }
  if (!token) return res.status(401).json({ error: "Missing auth token (Bearer or cookie)" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { issueJWT, requireAuth };
