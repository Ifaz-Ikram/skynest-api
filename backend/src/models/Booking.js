const define = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    "Booking",
    {
      booking_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      guest_id: { type: DataTypes.INTEGER, allowNull: false },
      room_id: { type: DataTypes.INTEGER, allowNull: false },
      check_in_date: { type: DataTypes.DATEONLY, allowNull: false },
      check_out_date: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM(
          "Booked",
          "Checked-In",
          "Checked-Out",
          "Cancelled",
        ),
        defaultValue: "Booked",
      },
      booked_rate: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      tax_rate_percent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      advance_payment: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
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
