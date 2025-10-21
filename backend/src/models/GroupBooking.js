const define = (sequelize, DataTypes) => {
  const GroupBooking = sequelize.define(
    "GroupBooking",
    {
      group_booking_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      group_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      group_contact_person: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      group_contact_phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      group_contact_email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      group_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      total_guests: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_by_employee_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      branch_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'colombo',
      },
    },
    {
      tableName: "group_booking",
      timestamps: false,
    }
  );

  return GroupBooking;
};

module.exports = define;
