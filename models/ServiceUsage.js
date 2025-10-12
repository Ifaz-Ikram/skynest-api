const define = (sequelize, DataTypes) => {
  const ServiceUsage = sequelize.define(
    "ServiceUsage",
    {
      usage_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      booking_id: { type: DataTypes.INTEGER, allowNull: false },
      service_id: { type: DataTypes.INTEGER, allowNull: false },
      used_on: { type: DataTypes.DATEONLY, allowNull: false },
      qty: { type: DataTypes.INTEGER, allowNull: false },
      unit_price_at_use: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    {
      tableName: "service_usage",
      timestamps: false,
    },
  );
  return ServiceUsage;
};

module.exports = define;
