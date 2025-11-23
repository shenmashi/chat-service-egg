'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建未送达通知表
    await queryInterface.createTable('pending_notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '通知ID',
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '事件类型（如：session_accepted, customer_service_online等）',
      },
      target_type: {
        type: Sequelize.ENUM('user', 'customer_service'),
        allowNull: false,
        comment: '目标用户类型',
      },
      target_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '目标用户ID',
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: '消息内容（JSON格式）',
      },
      is_delivered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: '是否已送达',
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '送达时间',
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

    // 添加索引以提高查询性能
    await queryInterface.addIndex('pending_notifications', ['target_type', 'target_id', 'is_delivered'], {
      name: 'idx_target_delivered',
    });
    await queryInterface.addIndex('pending_notifications', ['event_type'], {
      name: 'idx_event_type',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pending_notifications');
  },
};
