'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建客服表
    await queryInterface.createTable('customer_services', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '客服ID',
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '客服用户名',
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '客服邮箱',
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '密码',
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '头像',
      },
      status: {
        type: Sequelize.ENUM('online', 'offline', 'busy'),
        defaultValue: 'offline',
        comment: '在线状态',
      },
      max_concurrent_chats: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        comment: '最大并发聊天数',
      },
      current_chats: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '当前聊天数',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '创建时间',
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '更新时间',
      },
    });

    // 创建聊天会话表
    await queryInterface.createTable('chat_sessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '会话ID',
      },
      session_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '会话唯一标识',
      },
      customer_service_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '客服ID',
        references: {
          model: 'customer_services',
          key: 'id',
        },
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '用户ID',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      visitor_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '访客ID（未登录用户）',
      },
      visitor_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '访客姓名',
      },
      visitor_email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '访客邮箱',
      },
      status: {
        type: Sequelize.ENUM('waiting', 'active', 'ended', 'transferred'),
        defaultValue: 'waiting',
        comment: '会话状态',
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal',
        comment: '优先级',
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '标签',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '备注',
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '开始时间',
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '结束时间',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '创建时间',
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '更新时间',
      },
    });

    // 创建聊天消息表
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '消息ID',
      },
      session_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '会话ID',
        references: {
          model: 'chat_sessions',
          key: 'session_id',
        },
      },
      sender_type: {
        type: Sequelize.ENUM('customer_service', 'user', 'visitor', 'system'),
        allowNull: false,
        comment: '发送者类型',
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '发送者ID',
      },
      sender_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '发送者姓名',
      },
      message_type: {
        type: Sequelize.ENUM('text', 'image', 'file', 'emoji', 'system'),
        defaultValue: 'text',
        comment: '消息类型',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '消息内容',
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: '文件URL',
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '文件名',
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: '文件大小',
      },
      file_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '文件类型',
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: '是否已读',
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '阅读时间',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '创建时间',
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '更新时间',
      },
    });

    // 创建聊天文件表
    await queryInterface.createTable('chat_files', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '文件ID',
      },
      message_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '消息ID',
        references: {
          model: 'chat_messages',
          key: 'id',
        },
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '原始文件名',
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '存储文件名',
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: '文件路径',
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: '文件URL',
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '文件大小',
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'MIME类型',
      },
      file_type: {
        type: Sequelize.ENUM('image', 'document', 'video', 'audio', 'other'),
        allowNull: false,
        comment: '文件类型',
      },
      uploader_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '上传者ID',
      },
      uploader_type: {
        type: Sequelize.ENUM('customer_service', 'user', 'visitor'),
        allowNull: false,
        comment: '上传者类型',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '创建时间',
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '更新时间',
      },
    });

    // 创建索引
    await queryInterface.addIndex('chat_sessions', ['customer_service_id']);
    await queryInterface.addIndex('chat_sessions', ['user_id']);
    await queryInterface.addIndex('chat_sessions', ['visitor_id']);
    await queryInterface.addIndex('chat_sessions', ['status']);
    await queryInterface.addIndex('chat_messages', ['session_id']);
    await queryInterface.addIndex('chat_messages', ['sender_type', 'sender_id']);
    await queryInterface.addIndex('chat_messages', ['created_at']);
    await queryInterface.addIndex('chat_files', ['message_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('chat_files');
    await queryInterface.dropTable('chat_messages');
    await queryInterface.dropTable('chat_sessions');
    await queryInterface.dropTable('customer_services');
  },
};
