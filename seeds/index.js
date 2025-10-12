// seeds/index.js
require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, UserAccount } = require("../models");

async function seedAdmin() {
  console.log("⏳ Seeding admin…");
  await sequelize.authenticate();
  console.log("✅ Sequelize connected");

  const password_hash = await bcrypt.hash("admin123", 10);

  const [user, created] = await UserAccount.findOrCreate({
    where: { username: "admin" },
    defaults: {
      username: "admin",
      password_hash,
      role: "Admin",
      guest_id: null, // safe placeholder for now
    },
    // Limit SELECT to existing DB columns
    attributes: ["user_id", "username", "password_hash", "role", "guest_id"],
  });

  if (created)
    console.log("✅ Seeded admin user: username=admin, password=admin123");
  else console.log("ℹ️ Admin user already exists (no change).");
}

// Run directly via CLI
if (require.main === module) {
  seedAdmin()
    .then(async () => {
      console.log("✅ Done.");
      await sequelize.close();
    })
    .catch(async (err) => {
      console.error("❌ Seed failed:", err);
      process.exitCode = 1;
      await sequelize.close();
    });
}

// Exported for programmatic use (e.g. tests)
module.exports = { seedAdmin };
