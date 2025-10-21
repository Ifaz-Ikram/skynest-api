const define = (sequelize, DataTypes) => {
  const PreBooking = sequelize.define(
    "PreBooking",
    {
      pre_booking_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      guest_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Original guest/customer reference (for backward compatibility)',
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      prebooking_method: {
        type: DataTypes.ENUM('Online', 'Phone', 'Walk-in'),
        allowNull: false,
      },
      expected_check_in: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      expected_check_out: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      room_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      created_by_employee_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      customer_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'Customer who made the booking (may differ from guest)',
      },
      room_type_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'Requested room type for this pre-booking (required)',
      },
      group_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      group_contact_person: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      group_contact_phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      group_contact_email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      is_group_booking: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      group_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "pre_booking",
      timestamps: false,
    }
  );
  return PreBooking;
};

module.exports = define;

