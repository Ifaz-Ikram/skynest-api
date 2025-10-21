// =============================
// 📦 Required Modules
// =============================
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const createError = require("http-errors");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = express();

// =============================
// 🧰 Middlewares
// =============================
app.use(helmet());
app.use(cors());
app.use(express.json());

// =============================
// 🩺 Health Check
// =============================
app.get("/health", (_req, res) => res.json({ ok: true }));

// =============================
// 🧭 API Routes
// =============================
app.use("/api", require("./routes/api.routes"));

// =============================
// 🌐 Serve Frontend (React SPA)
// =============================
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir)); // fallback for simple static files

const reactBuildDir = path.join(__dirname, "..", "frontend", "dist");

// ✅ If React build exists, serve it at /app
if (fs.existsSync(reactBuildDir)) {
  app.use("/app", express.static(reactBuildDir));
  app.get("/app/*", (_req, res) => {
    res.sendFile(path.join(reactBuildDir, "index.html"));
  });
} else {
  // 🪄 Fallback to the simple in-repo SPA
  app.use("/app", express.static(publicDir));
  app.get("/app/*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

// =============================
// ❌ 404 Handler
// =============================
app.use((_req, _res, next) => next(createError(404, "Route not found")));

// =============================
// 🛑 Error Handler
// =============================
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
