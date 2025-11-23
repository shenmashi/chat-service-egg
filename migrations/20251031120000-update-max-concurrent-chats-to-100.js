'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 将所有客服的 max_concurrent_chats 更新为 100
    await queryInterface.sequelize.query(`
      UPDATE customer_services 
      SET max_concurrent_chats = 100, updated_at = NOW()
      WHERE max_concurrent_chats < 100
    `);
    
    console.log('✅ 已将所有客服的最大并发聊天数更新为 100');
  },

  down: async (queryInterface, Sequelize) => {
    // 回滚：将 max_concurrent_chats 恢复为 5
    await queryInterface.sequelize.query(`
      UPDATE customer_services 
      SET max_concurrent_chats = 5, updated_at = NOW()
      WHERE max_concurrent_chats = 100
    `);
    
    console.log('✅ 已将所有客服的最大并发聊天数恢复为 5');
  }
};

