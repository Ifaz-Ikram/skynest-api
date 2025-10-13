// src/app.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const createError = require("http-errors");

require("dotenv").config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// routes
app.get("/health", (_req, res) => res.json({ ok: true }));

// attach your existing routers (adjust paths if needed)
app.use("/auth", require("./routes/auth.routes"));
app.use("/bookings", require("./routes/booking.routes"));
app.use("/services", require("./routes/service.routes"));
app.use("/payments", require("./routes/payment.routes"));
app.use("/reports", require("./routes/report.routes"));

// serve frontend (static SPA)
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Prefer React build if requested, otherwise serve the in-repo SPA
const reactBuildDir = path.join(__dirname, "..", "frontend", "dist");
const preferReact = String(process.env.USE_REACT_BUILD || "").toLowerCase() === "true";
if (preferReact && fs.existsSync(reactBuildDir)) {
  app.use("/app", express.static(reactBuildDir));
  // Serve index.html only for non-asset routes under /app
  app.use("/app", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    // Let real files (e.g., /app/assets/*.js, *.css) pass through
    if (req.path.startsWith("/assets/") || req.path.includes(".")) return next();
    // Only answer HTML navigation requests
    const accept = String(req.headers.accept || "");
    if (!accept.includes("text/html")) return next();
    res.sendFile(path.join(reactBuildDir, "index.html"));
  });
} else {
  // HTML5 history fallback for client routes under /app (static SPA)
  app.use("/app", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const accept = String(req.headers.accept || "");
    if (!accept.includes("text/html")) return next();
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

// 404
app.use((_req, _res, next) => next(createError(404, "Route not found")));

// error handler
app.use((err, _req, res, _next) => {
  if (process.env.NODE_ENV !== "production") console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

module.exports = { app };
