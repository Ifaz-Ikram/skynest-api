const define = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      payment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      booking_id: { type: DataTypes.INTEGER, allowNull: false },
      paid_on: { type: DataTypes.DATEONLY, allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      method: { type: DataTypes.STRING, allowNull: false }, // or ENUM if you want
      reference: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "payment",
      timestamps: false,
    },
  );
  return Payment;
};

module.exports = define;
