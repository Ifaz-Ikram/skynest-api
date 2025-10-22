// seeds/sample-data.js
require("dotenv").config({ quiet: true });
const { sequelize } = require("../../src/models");

async function ensureOneRow(sqlCheck, sqlInsert, replacements = {}, conflictColumns = null) {
  const [rows] = await sequelize.query(sqlCheck, { replacements });
  if (rows.length) return rows[0];

  let insertSql = sqlInsert;
  if (conflictColumns) {
    insertSql = insertSql.replace(/RETURNING \w+/, `ON CONFLICT (${conflictColumns}) DO NOTHING`);
  }

  await sequelize.query(insertSql, { replacements });

  // Always query after to get the row
  const [rows2] = await sequelize.query(sqlCheck, { replacements });
  return rows2[0];
}

async function seedSampleData() {
  await sequelize.authenticate();
  console.log("Seeding sample data...");

  const branch = await ensureOneRow(
    `SELECT branch_id FROM branch WHERE branch_code = :code LIMIT 1`,
    `INSERT INTO branch (branch_name, contact_number, address, manager_name, branch_code)
     VALUES (:name, :phone, :addr, :mgr, :code)
     RETURNING branch_id`,
    {
      code: "HQ",
      name: "Headquarters",
      phone: "000-000",
      addr: "N/A",
      mgr: "N/A",
    },
    'branch_code'
  );
  console.log(`Branch ready: ${branch.branch_id}`);

  const roomType = await ensureOneRow(
    `SELECT room_type_id FROM room_type WHERE name = :name LIMIT 1`,
    `INSERT INTO room_type (name, capacity, daily_rate, amenities)
     VALUES (:name, 2, 10000.00, 'AC, TV')
     RETURNING room_type_id`,
    { name: "Deluxe" },
    'name'
  );
  console.log(`Room type ready: ${roomType.room_type_id}`);

  const room = await ensureOneRow(
    `SELECT room_id FROM room WHERE room_number = :num LIMIT 1`,
    `INSERT INTO room (branch_id, room_type_id, room_number, status)
     VALUES (:branch_id, :room_type_id, :num, 'Available')
     RETURNING room_id`,
    {
      branch_id: branch.branch_id,
      room_type_id: roomType.room_type_id,
      num: "101",
    },
    'branch_id, room_number'
  );
  console.log(`Room ready: ${room.room_id}`);

  const guest = await ensureOneRow(
    `SELECT guest_id FROM guest WHERE full_name = :name LIMIT 1`,
    `INSERT INTO guest (full_name, email, phone)
     VALUES (:name, :email, :phone)
     RETURNING guest_id`,
    { name: "Test Guest", email: "guest@test.local", phone: "0710000000" },
    'email'
  );
  console.log(`Guest ready: ${guest.guest_id}`);

  const service = await ensureOneRow(
    `SELECT service_id FROM service_catalog WHERE code = :code LIMIT 1`,
    `INSERT INTO service_catalog (code, name, category, unit_price, tax_rate_percent, active)
     VALUES (:code, :name, 'Misc', 1500.00, 0, true)
     RETURNING service_id`,
    { code: "MISC", name: "Misc Service" },
    'code'
  );
  console.log(`Service ready: ${service.service_id}`);

  console.log("Sample data seeded");
}

if (require.main === module) {
  seedSampleData()
    .then(() => {
      console.log("Sample seed complete. Closing DB connection.");
      return sequelize.close();
    })
    .catch(async (err) => {
      console.error("Sample seed failed:", err);
      await sequelize.close();
      process.exit(1);
    });
}

module.exports = { seedSampleData };
