// tests/_helpers/setup.js
require("dotenv").config({ path: ".env" });

const { sequelize } = require("../../../src/models");
const { seedAdmin } = require("../../../database/seeds");
const { closePool } = require("../../../src/db");
const { seedSampleData } = require("../../../database/seeds/sample-data");

beforeAll(async () => {
  try {
    console.log("🔄 Connecting to test database...");
    await sequelize.authenticate();
    console.log("✅ Test database connected");
    
    console.log("🔄 Seeding admin user...");
    await seedAdmin();
    console.log("✅ Admin user seeded");
    
    console.log("🔄 Seeding sample data...");
    await seedSampleData();
    console.log("✅ Sample data seeded");
    
    console.log("✅ Test setup complete");
  } catch (error) {
    console.error("❌ Test setup failed:", error.message);
    console.error("Stack trace:", error.stack);
    throw error;
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
    await closePool();
    console.log("✅ DB connections closed");
  } catch (error) {
    console.error("❌ Error closing connections:", error.message);
  }
});
