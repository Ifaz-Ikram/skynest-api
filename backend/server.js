const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

console.log('📦 Loading app module...');
const { app } = require("./src/app");
console.log('✅ App module loaded');

console.log('📦 Loading Sequelize models...');
const { sequelize } = require("./src/models");
console.log('✅ Sequelize models loaded');

const port = Number(process.env.PORT || 4000);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  // Don't exit - just log
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - just log
});

async function start() {
  try {
    console.log('🔄 Authenticating database...');
    await sequelize.authenticate();
    console.log("✅ Sequelize connected");
    console.log("✅ DB ok");
    
    console.log('🔄 Starting Express server...');
    const server = app.listen(port, () => {
      console.log(`✅ API listening on http://localhost:${port}`);
    });
    
    server.on('error', (error) => {
      console.error("❌ Server error:", error);
      process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, closing server...');
      server.close(() => {
        console.log('Server closed');
        sequelize.close();
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('\nSIGINT received, closing server...');
      server.close(() => {
        console.log('Server closed');
        sequelize.close();
        process.exit(0);
      });
    });
    
  } catch (err) {
    console.error("❌ Failed to start", err);
    process.exit(1);
  }
}

start();
