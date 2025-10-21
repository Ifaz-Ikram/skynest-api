const define = (sequelize, DataTypes) => {
  const Branch = sequelize.define(
    "Branch",
    {
      branch_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      branch_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      contact_number: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      manager_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      branch_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
    },
    {
      tableName: "branch",
      timestamps: false,
    }
  );
  return Branch;
};

module.exports = define;

