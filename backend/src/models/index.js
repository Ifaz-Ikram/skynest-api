require("dotenv").config(); // ✅ load .env first
const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
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
const dbPass = process.env.PGPASSWORD || process.env.DB_PASSWORD || undefined;

// Basic sanity checks for non-URL config
if (!useUrl) {
  if (dbPass !== undefined && typeof dbPass !== "string") {
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
db.Guest = require("./Guest")(sequelize, DataTypes);
db.Customer = require("./Customer")(sequelize, DataTypes);
db.Employee = require("./Employee")(sequelize, DataTypes);
db.Branch = require("./Branch")(sequelize, DataTypes);
db.RoomType = require("./RoomType")(sequelize, DataTypes);
db.Room = require("./Room")(sequelize, DataTypes);
db.PreBooking = require("./PreBooking")(sequelize, DataTypes);
db.Booking = require("./Booking")(sequelize, DataTypes);
db.GroupBooking = require("./GroupBooking")(sequelize, DataTypes);
db.CheckinValidation = require("./CheckinValidation")(sequelize, DataTypes);
db.IdValidationRule = require("./IdValidationRule")(sequelize, DataTypes);
db.ServiceCatalog = require("./ServiceCatalog")(sequelize, DataTypes);
db.ServiceUsage = require("./ServiceUsage")(sequelize, DataTypes);
db.Payment = require("./Payment")(sequelize, DataTypes);
db.PaymentAdjustment = require("./PaymentAdjustment")(sequelize, DataTypes);
db.Invoice = require("./Invoice")(sequelize, DataTypes);
db.AuditLog = require("./AuditLog")(sequelize, DataTypes);

// ---- Associations (based on schema FK constraints) ----

// UserAccount associations
db.UserAccount.belongsTo(db.Guest, { foreignKey: "guest_id", as: "guest" });

// Customer associations
db.Customer.belongsTo(db.UserAccount, { foreignKey: "user_id", as: "user" });
// Note: customer.guest_id has NO FK in schema (orphaned)

// Employee associations
db.Employee.belongsTo(db.UserAccount, { foreignKey: "user_id", as: "user" });
db.Employee.belongsTo(db.Branch, { foreignKey: "branch_id", as: "branch" });

// Room associations
db.Room.belongsTo(db.Branch, { foreignKey: "branch_id", as: "branch" });
db.Room.belongsTo(db.RoomType, { foreignKey: "room_type_id", as: "roomType" });

// PreBooking associations
db.PreBooking.belongsTo(db.Room, { foreignKey: "room_id", as: "room" });
db.PreBooking.belongsTo(db.Employee, { foreignKey: "created_by_employee_id", as: "createdBy" });
db.PreBooking.belongsTo(db.Customer, { foreignKey: "customer_id", as: "customer" });
db.PreBooking.belongsTo(db.RoomType, { foreignKey: "room_type_id", as: "roomType" });
// Note: pre_booking.guest_id has NO FK in schema (orphaned)

// Booking associations
db.Booking.belongsTo(db.PreBooking, { foreignKey: "pre_booking_id", as: "preBooking" });
db.Booking.belongsTo(db.Room, { foreignKey: "room_id", as: "room" });
db.Booking.belongsTo(db.GroupBooking, { foreignKey: "group_booking_id", as: "groupBooking" });
// Note: booking.guest_id has NO FK in schema (orphaned)

// GroupBooking associations
db.GroupBooking.belongsTo(db.Employee, { foreignKey: "created_by_employee_id", as: "createdBy" });
db.GroupBooking.hasMany(db.Booking, { foreignKey: "group_booking_id", as: "bookings" });

// CheckinValidation associations
db.CheckinValidation.belongsTo(db.Booking, { foreignKey: "booking_id", as: "booking" });
db.CheckinValidation.belongsTo(db.Guest, { foreignKey: "guest_id", as: "guest" });
db.CheckinValidation.belongsTo(db.Employee, { foreignKey: "validated_by_employee_id", as: "validatedBy" });

db.Booking.hasMany(db.ServiceUsage, { foreignKey: "booking_id", as: "serviceUsages" });
db.Booking.hasMany(db.Payment, { foreignKey: "booking_id", as: "payments" });
db.Booking.hasMany(db.PaymentAdjustment, { foreignKey: "booking_id", as: "paymentAdjustments" });
db.Booking.hasMany(db.Invoice, { foreignKey: "booking_id", as: "invoices" });

// ServiceUsage associations
db.ServiceUsage.belongsTo(db.Booking, { foreignKey: "booking_id", as: "booking" });
db.ServiceUsage.belongsTo(db.ServiceCatalog, { foreignKey: "service_id", as: "service" });

// Payment associations
db.Payment.belongsTo(db.Booking, { foreignKey: "booking_id", as: "booking" });

// PaymentAdjustment associations
db.PaymentAdjustment.belongsTo(db.Booking, { foreignKey: "booking_id", as: "booking" });

// Invoice associations
db.Invoice.belongsTo(db.Booking, { foreignKey: "booking_id", as: "booking" });

// AuditLog associations
// Note: actor field contains user_id as string, not a proper foreign key
// We'll handle user lookup manually in the controller

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
