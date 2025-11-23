import { Application } from 'egg';

export default (app: Application) => {
  const { STRING, INTEGER, TEXT, DATE, ENUM, JSON } = app.Sequelize;

  const ChatSession = app.model.define('ChatSession', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '会话ID',
    },
    session_id: {
      type: STRING(100),
      allowNull: false,
      unique: true,
      comment: '会话唯一标识',
    },
    customer_service_id: {
      type: INTEGER,
      allowNull: true,
      comment: '客服ID',
    },
    user_id: {
      type: INTEGER,
      allowNull: true,
      comment: '用户ID',
    },
    visitor_id: {
      type: STRING(100),
      allowNull: true,
      comment: '访客ID（未登录用户）',
    },
    visitor_name: {
      type: STRING(100),
      allowNull: true,
      comment: '访客姓名',
    },
    visitor_email: {
      type: STRING(100),
      allowNull: true,
      comment: '访客邮箱',
    },
    status: {
      type: ENUM('waiting', 'active', 'ended', 'transferred'),
      defaultValue: 'waiting',
      comment: '会话状态',
    },
    priority: {
      type: ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
      comment: '优先级',
    },
    tags: {
      type: JSON,
      allowNull: true,
      comment: '标签',
    },
    notes: {
      type: TEXT,
      allowNull: true,
      comment: '备注',
    },
    started_at: {
      type: DATE,
      allowNull: true,
      comment: '开始时间',
    },
    ended_at: {
      type: DATE,
      allowNull: true,
      comment: '结束时间',
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
    tableName: 'chat_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  // 定义关联关系
  ChatSession.associate = function() {
    // 关联用户
    ChatSession.belongsTo(app.model.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    
    // 关联客服
    ChatSession.belongsTo(app.model.CustomerService, {
      foreignKey: 'customer_service_id',
      as: 'customerService',
    });
  };

  return ChatSession;
};
