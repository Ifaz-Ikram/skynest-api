const define = (sequelize, DataTypes) => {
  const CheckinValidation = sequelize.define(
    "CheckinValidation",
    {
      validation_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      booking_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      guest_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      id_proof_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      id_proof_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      validation_status: {
        type: DataTypes.ENUM('pending', 'validated', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      validated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      validated_by_employee_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      validation_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "checkin_validation",
      timestamps: false,
    }
  );

  return CheckinValidation;
};

module.exports = define;
