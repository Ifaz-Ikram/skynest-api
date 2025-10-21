const define = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    "AuditLog",
    {
      audit_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      actor: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      action: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      entity: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      entity_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "audit_log",
      timestamps: false,
    }
  );
  return AuditLog;
};

module.exports = define;

