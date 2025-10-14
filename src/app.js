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

// health
app.get("/health", (_req, res) => res.json({ ok: true }));

// routers - Comprehensive API routes with RBAC
app.use("/api", require("./routes/api.routes"));

// serve frontend (static SPA)
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Prefer React build if requested, otherwise serve the in-repo SPA
const reactBuildDir = path.join(__dirname, "..", "frontend", "dist");
const preferReact = String(process.env.USE_REACT_BUILD || "").toLowerCase() === "true";
if (preferReact && fs.existsSync(reactBuildDir)) {
  app.use("/app", express.static(reactBuildDir));
  app.use("/app", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/assets/") || req.path.includes(".")) return next();
    const accept = String(req.headers.accept || "");
    if (!accept.includes("text/html")) return next();
    res.sendFile(path.join(reactBuildDir, "index.html"));
  });
} else {
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
  const status = err.status || err.statusCode || 500;
  const is404 = status === 404;
  const isStaticMiss = err && (err.code === "ENOENT" || err.code === "EISDIR");
  if (process.env.NODE_ENV !== "production" && !is404 && !isStaticMiss) {
    console.error(err);
  }
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

module.exports = { app };
