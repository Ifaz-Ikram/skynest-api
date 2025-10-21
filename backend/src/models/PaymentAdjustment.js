const define = (sequelize, DataTypes) => {
  const PaymentAdjustment = sequelize.define(
    "PaymentAdjustment",
    {
      adjustment_id: {
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
        validate: {
          min: 0.01, // amount > 0 per schema CHECK constraint
        },
      },
      type: {
        type: DataTypes.ENUM('refund', 'chargeback', 'manual_adjustment'),
        allowNull: false,
      },
      reference_note: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "payment_adjustment",
      timestamps: false,
    }
  );
  return PaymentAdjustment;
};

module.exports = define;

