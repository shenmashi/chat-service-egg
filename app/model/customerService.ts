import { Application } from 'egg';

export default (app: Application) => {
  const { STRING, INTEGER, TEXT, DATE, ENUM, BOOLEAN, BIGINT, JSON } = app.Sequelize;

  const CustomerService = app.model.define('CustomerService', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '客服ID',
    },
    username: {
      type: STRING(50),
      allowNull: false,
      unique: true,
      comment: '客服用户名',
    },
    email: {
      type: STRING(100),
      allowNull: false,
      unique: true,
      comment: '客服邮箱',
    },
    password: {
      type: STRING(255),
      allowNull: false,
      comment: '密码',
    },
    avatar: {
      type: STRING(255),
      allowNull: true,
      comment: '头像',
    },
    status: {
      type: ENUM('online', 'offline', 'busy'),
      defaultValue: 'offline',
      comment: '在线状态',
    },
    max_concurrent_chats: {
      type: INTEGER,
      defaultValue: 100,
      comment: '最大并发聊天数',
    },
    current_chats: {
      type: INTEGER,
      defaultValue: 0,
      comment: '当前聊天数',
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
    tableName: 'customer_services',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  return CustomerService;
};
