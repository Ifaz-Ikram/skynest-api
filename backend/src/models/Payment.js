const define = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      payment_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      booking_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      method: {
        type: DataTypes.ENUM("Cash", "Card", "Online", "BankTransfer"),
        allowNull: true,
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      payment_reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: "payment",
      timestamps: false,
    },
  );
  return Payment;
};

module.exports = define;
