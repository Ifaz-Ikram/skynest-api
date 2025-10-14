const define = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    "Employee",
    {
      employee_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      branch_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: "employee",
      timestamps: false,
    },
  );
  return Employee;
};

module.exports = define;
