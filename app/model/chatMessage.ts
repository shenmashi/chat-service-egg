import { Application } from 'egg';

export default (app: Application) => {
  const { STRING, INTEGER, TEXT, DATE, ENUM, BOOLEAN, BIGINT } = app.Sequelize;

  const ChatMessage = app.model.define('ChatMessage', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '消息ID',
    },
    session_id: {
      type: STRING(100),
      allowNull: false,
      comment: '会话ID',
    },
    sender_type: {
      type: ENUM('customer_service', 'user', 'visitor', 'system'),
      allowNull: false,
      comment: '发送者类型',
    },
    sender_id: {
      type: INTEGER,
      allowNull: true,
      comment: '发送者ID',
    },
    sender_name: {
      type: STRING(100),
      allowNull: false,
      comment: '发送者姓名',
    },
    message_type: {
      type: ENUM('text', 'image', 'file', 'emoji', 'system'),
      defaultValue: 'text',
      comment: '消息类型',
    },
    content: {
      type: TEXT,
      allowNull: true,
      comment: '消息内容',
    },
    file_url: {
      type: STRING(500),
      allowNull: true,
      comment: '文件URL',
    },
    file_name: {
      type: STRING(255),
      allowNull: true,
      comment: '文件名',
    },
    file_size: {
      type: BIGINT,
      allowNull: true,
      comment: '文件大小',
    },
    file_type: {
      type: STRING(100),
      allowNull: true,
      comment: '文件类型',
    },
    is_read: {
      type: BOOLEAN,
      defaultValue: false,
      comment: '是否已读',
    },
    read_at: {
      type: DATE,
      allowNull: true,
      comment: '阅读时间',
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
    tableName: 'chat_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  return ChatMessage;
};
