const define = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      invoice_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      booking_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      period_start: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      period_end: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      issued_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "invoice",
      timestamps: false,
    }
  );
  return Invoice;
};

module.exports = define;

