'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('files', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '原始文件名'
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '原始文件名'
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: '文件存储路径'
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '文件大小(字节)'
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'MIME类型'
      },
      file_type: {
        type: Sequelize.ENUM('image', 'document', 'video', 'audio', 'other'),
        allowNull: false,
        comment: '文件类型'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '上传用户ID',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.ENUM('active', 'deleted'),
        defaultValue: 'active',
        comment: '文件状态'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 添加索引
    await queryInterface.addIndex('files', ['user_id']);
    await queryInterface.addIndex('files', ['file_type']);
    await queryInterface.addIndex('files', ['status']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('files');
  }
};
