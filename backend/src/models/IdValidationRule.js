const define = (sequelize, DataTypes) => {
  const IdValidationRule = sequelize.define(
    "IdValidationRule",
    {
      rule_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      guest_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      requires_id_proof: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      required_id_types: {
        type: DataTypes.ARRAY(DataTypes.STRING),
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
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "id_validation_rules",
      timestamps: false,
    }
  );

  return IdValidationRule;
};

module.exports = define;
