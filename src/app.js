// src/app.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
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
// HTML5 history fallback for client routes under /app
app.get(["/app", "/app/*"], (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

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
