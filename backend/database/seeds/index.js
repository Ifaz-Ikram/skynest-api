// seeds/index.js
require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, UserAccount } = require("../../src/models");

async function seedAdmin() {
  console.log("Seeding admin...");
  await sequelize.authenticate();
  console.log("Sequelize connected for seed");

  const password_hash = await bcrypt.hash("admin123", 10);

  const [_user, created] = await UserAccount.findOrCreate({
    where: { username: "admin" },
    defaults: {
      username: "admin",
      password_hash,
      role: "Admin",
      guest_id: null,
    },
    attributes: ["user_id", "username", "password_hash", "role", "guest_id"],
  });

  if (created) {
    console.log("Seeded admin user: username=admin, password=admin123");
  } else {
    console.log("Admin user already exists (no change)");
  }
}

if (require.main === module) {
  seedAdmin()
    .then(async () => {
      console.log("Admin seed complete. Closing DB connection.");
      await sequelize.close();
    })
    .catch(async (err) => {
      console.error("Seed failed:", err);
      process.exitCode = 1;
      await sequelize.close();
    });
}

module.exports = { seedAdmin };
