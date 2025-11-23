'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('sms_codes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '手机号'
      },
      code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: '验证码'
      },
      type: {
        type: Sequelize.ENUM('register', 'login', 'reset_password', 'bind_phone'),
        allowNull: false,
        comment: '验证码类型'
      },
      status: {
        type: Sequelize.ENUM('pending', 'used', 'expired'),
        defaultValue: 'pending',
        comment: '验证码状态'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '过期时间'
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '使用时间'
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'IP地址'
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
    await queryInterface.addIndex('sms_codes', ['phone']);
    await queryInterface.addIndex('sms_codes', ['code']);
    await queryInterface.addIndex('sms_codes', ['status']);
    await queryInterface.addIndex('sms_codes', ['expires_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('sms_codes');
  }
};
