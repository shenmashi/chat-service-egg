'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 删除外键约束
    await queryInterface.sequelize.query('ALTER TABLE chat_messages DROP FOREIGN KEY chat_messages_ibfk_1');
    
    // 修改数据库字符集为utf8mb4
    await queryInterface.sequelize.query('ALTER DATABASE custom_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    // 修改customer_services表字符集
    await queryInterface.sequelize.query('ALTER TABLE customer_services CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    // 修改chat_sessions表字符集
    await queryInterface.sequelize.query('ALTER TABLE chat_sessions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    // 修改chat_messages表字符集
    await queryInterface.sequelize.query('ALTER TABLE chat_messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    // 修改users表字符集
    await queryInterface.sequelize.query('ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    // 修改articles表字符集
    await queryInterface.sequelize.query('ALTER TABLE articles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    // 重新添加外键约束
    await queryInterface.sequelize.query('ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_ibfk_1 FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE');
  },

  down: async (queryInterface, Sequelize) => {
    // 回滚操作
    await queryInterface.sequelize.query('ALTER DATABASE custom_service CHARACTER SET utf8 COLLATE utf8_general_ci');
  },
};