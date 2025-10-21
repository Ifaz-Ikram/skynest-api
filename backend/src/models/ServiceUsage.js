const define = (sequelize, DataTypes) => {
  const ServiceUsage = sequelize.define(
    "ServiceUsage",
    {
      service_usage_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      booking_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      service_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      used_on: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unit_price_at_use: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "service_usage",
      timestamps: false,
    },
  );
  return ServiceUsage;
};

module.exports = define;
