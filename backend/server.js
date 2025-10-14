require("dotenv").config();
const { app } = require("./src/app");
const { sequelize } = require("./src/models");

const port = Number(process.env.PORT || 4000);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB ok");
    
    const server = app.listen(port, () => {
      console.log(`✅ API listening on http://localhost:${port}`);
    });
    
    server.on('error', (error) => {
      console.error("❌ Server error:", error);
      process.exit(1);
    });
    
    // Keep the process alive
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, closing server...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
    
  } catch (err) {
    console.error("❌ Failed to start", err);
    process.exit(1);
  }
}

start();
