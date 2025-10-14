const define = (sequelize, DataTypes) => {
  const UserAccount = sequelize.define(
    "UserAccount",
    {
      user_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // DB role is a USER-DEFINED enum; using STRING avoids sync issues
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      guest_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      // ❌ No is_active / customer_id / employee_id / email — not in DB
    },
    {
      tableName: "user_account",
      timestamps: false,
    },
  );

  return UserAccount;
};

module.exports = define;
