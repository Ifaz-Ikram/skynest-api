const define = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    "Customer",
    {
      customer_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      guest_id: { type: DataTypes.INTEGER, allowNull: true }, // if your schema has it
    },
    {
      tableName: "customer",
      timestamps: false,
    },
  );
  return Customer;
};

module.exports = define;
