const define = (sequelize, DataTypes) => {
  const Guest = sequelize.define(
    "Guest",
    {
      guest_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      full_name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      gender: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      nationality: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      id_proof_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      id_proof_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      tableName: "guest",
      timestamps: false,
    }
  );
  return Guest;
};

module.exports = define;

