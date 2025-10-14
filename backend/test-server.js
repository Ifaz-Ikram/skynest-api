// Minimal test server
require("dotenv").config();
const express = require('express');
const app = express();

app.get('/health', (req, res) => res.json({ ok: true }));

const port = 4000;
const server = app.listen(port, () => {
  console.log(`✅ Test server listening on http://localhost:${port}`);
});

// Keep alive
setInterval(() => {
  console.log('Still alive...');
}, 10000);

server.on('error', (error) => {
  console.error("❌ Server error:", error);
});
