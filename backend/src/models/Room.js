const define = (sequelize, DataTypes) => {
  const Room = sequelize.define(
    "Room",
    {
      room_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      branch_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      room_type_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      room_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('Available', 'Occupied', 'Maintenance'),
        allowNull: false,
        defaultValue: 'Available',
      },
    },
    {
      tableName: "room",
      timestamps: false,
    }
  );
  return Room;
};

module.exports = define;

