// seeds/sample-data.js
require("dotenv").config({ quiet: true });
const { sequelize } = require("../../src/models");

async function ensureOneRow(sqlCheck, sqlInsert, replacements = {}, conflictColumns = null) {
  const [rows] = await sequelize.query(sqlCheck, { replacements });
  if (rows.length) return rows[0];

  try {
    let insertSql = sqlInsert;
    if (conflictColumns) {
      insertSql = insertSql.replace(/RETURNING \w+/, `ON CONFLICT (${conflictColumns}) DO NOTHING`);
    }
    await sequelize.query(insertSql, { replacements });
  } catch (err) {
    if (err.name === 'SequelizeDatabaseError' && err.original?.code === '42P10') {
      // No unique constraint, insert without ON CONFLICT
      const insertSql = sqlInsert.replace(/RETURNING \w+/, '');
      await sequelize.query(insertSql, { replacements });
    } else {
      throw err;
    }
  }

  // Query again
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

  // Reset sequence for room_type to avoid conflicts
  await sequelize.query(`SELECT setval('room_type_room_type_id_seq', (SELECT COALESCE(MAX(room_type_id), 0) + 1 FROM room_type))`);

  const roomType = await ensureOneRow(
    `SELECT room_type_id FROM room_type WHERE name = :name LIMIT 1`,
    `INSERT INTO room_type (name, capacity, daily_rate, amenities)
     VALUES (:name, 2, 10000.00, 'AC, TV')
     RETURNING room_type_id`,
    { name: "Deluxe" },
    'name'
  );
  console.log(`Room type ready: ${roomType.room_type_id}`);

  // Reset sequence for room to avoid conflicts
  await sequelize.query(`SELECT setval('room_room_id_seq', (SELECT COALESCE(MAX(room_id), 0) + 1 FROM room))`);

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
    'room_number'
  );
  console.log(`Room ready: ${room.room_id}`);

  // Reset sequence for guest to avoid conflicts
  await sequelize.query(`SELECT setval('guest_guest_id_seq', (SELECT COALESCE(MAX(guest_id), 0) + 1 FROM guest))`);

  const guest = await ensureOneRow(
    `SELECT guest_id FROM guest WHERE full_name = :name LIMIT 1`,
    `INSERT INTO guest (full_name, email, phone)
     VALUES (:name, :email, :phone)
     RETURNING guest_id`,
    { name: "Test Guest", email: "guest@test.local", phone: "0710000000" },
    'email'
  );
  console.log(`Guest ready: ${guest.guest_id}`);

  // Reset sequence for service_catalog to avoid conflicts
  await sequelize.query(`SELECT setval('service_catalog_service_id_seq', (SELECT COALESCE(MAX(service_id), 0) + 1 FROM service_catalog))`);

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
