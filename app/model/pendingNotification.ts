import { Application } from 'egg';

export default (app: Application) => {
  const { STRING, INTEGER, JSON, DATE, ENUM, BOOLEAN } = app.Sequelize;

  const PendingNotification = app.model.define('PendingNotification', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '通知ID',
    },
    event_type: {
      type: STRING(100),
      allowNull: false,
      comment: '事件类型（如：session_accepted, customer_service_online等）',
    },
    target_type: {
      type: ENUM('user', 'customer_service'),
      allowNull: false,
      comment: '目标用户类型',
    },
    target_id: {
      type: INTEGER,
      allowNull: false,
      comment: '目标用户ID',
    },
    payload: {
      type: JSON,
      allowNull: false,
      comment: '消息内容（JSON格式）',
    },
    is_delivered: {
      type: BOOLEAN,
      defaultValue: false,
      comment: '是否已送达',
    },
    delivered_at: {
      type: DATE,
      allowNull: true,
      comment: '送达时间',
    },
    created_at: {
      type: DATE,
      allowNull: false,
      defaultValue: app.Sequelize.NOW,
      comment: '创建时间',
    },
    updated_at: {
      type: DATE,
      allowNull: false,
      defaultValue: app.Sequelize.NOW,
      comment: '更新时间',
    },
  }, {
    tableName: 'pending_notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  return PendingNotification;
};
