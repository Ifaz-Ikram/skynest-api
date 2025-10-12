require("dotenv").config(); // ✅ load .env first
const { Sequelize, DataTypes } = require("sequelize");
const { types } = require("pg"); // for type parsers used by sequelize/pg

// ---- Parse Postgres types to sane JS numbers ----
// 1700 = NUMERIC/DECIMAL
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
// 20 = BIGINT/INT8 (only safe if your values fit in JS integer range)
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

// ---- Connection envs ----
const useUrl = !!process.env.DATABASE_URL;

const dbName = process.env.PGDATABASE || process.env.DB_NAME || "skynest";
const dbUser = process.env.PGUSER || process.env.DB_USER || "postgres";
const dbPass = process.env.PGPASSWORD || process.env.DB_PASSWORD || "";

// Basic sanity checks for non-URL config
if (!useUrl) {
  if (typeof dbPass !== "string") {
    throw new Error(
      "DB password env must be a string. Check PGPASSWORD or DB_PASSWORD in .env",
    );
  }
  if (!process.env.PGHOST && !process.env.DB_HOST) {
    console.warn("⚠️ PGHOST/DB_HOST not set; defaulting to localhost");
  }
}

// ---- SSL handling (prod/cloud often needs it) ----
const wantSSL =
  process.env.DB_SSL === "true" ||
  process.env.NODE_ENV === "production" ||
  (process.env.DATABASE_URL && !process.env.LOCAL_DEV);

const dialectOptions = wantSSL
  ? { ssl: { require: true, rejectUnauthorized: false } }
  : { ssl: false };

// ---- Sequelize init ----
const commonOptions = {
  dialect: "postgres",
  logging: false,
  dialectOptions,
  define: {
    freezeTableName: true, // don't pluralize model names
  },
  timezone: "+05:30", // Asia/Colombo offset
};

const sequelize = useUrl
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize(dbName, dbUser, dbPass, {
      host: process.env.PGHOST || process.env.DB_HOST || "localhost",
      port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
      ...commonOptions,
    });

// ---- Export container + DataTypes ----
const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.types = DataTypes;

// ---- Load models ----
db.UserAccount = require("./UserAccount")(sequelize, DataTypes);
db.Customer = require("./Customer")(sequelize, DataTypes);
db.Employee = require("./Employee")(sequelize, DataTypes);
db.Booking = require("./Booking")(sequelize, DataTypes);
db.ServiceUsage = require("./ServiceUsage")(sequelize, DataTypes);
db.Payment = require("./Payment")(sequelize, DataTypes);

// ---- Associations (match ONLY what's in your DB today) ----
// ❌ Do NOT inject FKs that don't exist in user_account:
/// db.UserAccount.belongsTo(db.Customer, { foreignKey: 'customer_id' });
/// db.UserAccount.belongsTo(db.Employee, { foreignKey: 'employee_id' });

// ✅ These map to real columns
db.Booking.hasMany(db.ServiceUsage, { foreignKey: "booking_id" });
db.ServiceUsage.belongsTo(db.Booking, { foreignKey: "booking_id" });

db.Booking.hasMany(db.Payment, { foreignKey: "booking_id" });
db.Payment.belongsTo(db.Booking, { foreignKey: "booking_id" });

// ---- Connectivity check (don't hard-exit in dev) ----
// models/index.js
async function testConnection() {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== "test") {
      console.log("✅ Sequelize connected");
    }
  } catch (e) {
    console.error("❌ Sequelize connection failed", e);
    if (process.env.NODE_ENV === "production") process.exit(1);
  }
}
testConnection();

module.exports = db;
