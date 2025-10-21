const define = (sequelize, DataTypes) => {
  const RoomType = sequelize.define(
    "RoomType",
    {
      room_type_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      base_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      max_occupancy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amenities: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "room_type",
      timestamps: false,
    }
  );
  return RoomType;
};

module.exports = define;

