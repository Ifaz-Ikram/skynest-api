const define = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    "Booking",
    {
      booking_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      pre_booking_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      guest_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      room_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      check_in_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      check_out_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("Booked", "Checked-In", "Checked-Out", "Cancelled"),
        allowNull: false,
        defaultValue: "Booked",
      },
      booked_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      tax_rate_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      late_fee_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      preferred_payment_method: {
        type: DataTypes.ENUM("Cash", "Card", "Online", "BankTransfer"),
        allowNull: true,
      },
      advance_payment: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      group_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_group_booking: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      group_booking_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      // room_estimate is GENERATED column - Sequelize doesn't handle well, omit from model
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "booking",
      timestamps: false,
    },
  );
  return Booking;
};

module.exports = define;
