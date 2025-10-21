// tests/_helpers/setup.js
require("dotenv").config({ path: ".env" });

const { sequelize } = require("../../../src/models");
const { seedAdmin } = require("../../../database/seeds");
const { closePool } = require("../../../src/db");
const { seedSampleData } = require("../../../database/seeds/sample-data");

beforeAll(async () => {
  await sequelize.authenticate();
  await seedAdmin();
  await seedSampleData();
  console.log("Test setup complete (DB ready, admin seeded)");
});

afterAll(async () => {
  await sequelize.close();
  await closePool();
  console.log("DB connections closed");
});
