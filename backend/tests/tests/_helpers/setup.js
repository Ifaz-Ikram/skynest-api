// tests/_helpers/setup.js
require("dotenv").config({ path: ".env" });

const { sequelize } = require("../../models");
const { seedAdmin } = require("../../seeds");
const { closePool } = require("../../src/db"); // 👈 import closePool
const { seedSampleData } = require("../../seeds/sample-data");

beforeAll(async () => {
  await sequelize.authenticate();
  await seedAdmin();
  await seedSampleData();
  console.log("🧩 Test setup complete (DB ready, admin seeded)");
});

afterAll(async () => {
  await sequelize.close(); // closes Sequelize
  await closePool(); // closes raw pg Pool
  console.log("🧹 DB connections closed");
});
