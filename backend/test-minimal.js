// Minimal test server
const express = require('express');
const { sequelize } = require('./src/models');

const app = express();

app.get('/health', (req, res) => res.json({ ok: true }));

async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB ok");
    
    const server = app.listen(3000, () => {
      console.log(`✅ Minimal server listening on http://localhost:3000`);
    });
    
    // Keep alive
    setInterval(() => {
      console.log('🟢 Still running...', new Date().toLocaleTimeString());
    }, 5000);
    
  } catch (err) {
    console.error("❌ Failed to start", err);
    process.exit(1);
  }
}

start();
