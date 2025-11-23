'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建默认管理员用户
    const hashedPassword = await bcrypt.hash('admin123456', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        nickname: '系统管理员',
        role: 'admin',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 创建默认分类
    await queryInterface.bulkInsert('categories', [
      {
        name: '技术',
        description: '技术相关文章',
        sort_order: 1,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: '生活',
        description: '生活相关文章',
        sort_order: 2,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: '学习',
        description: '学习相关文章',
        sort_order: 3,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // 创建默认标签
    await queryInterface.bulkInsert('tags', [
      {
        name: 'JavaScript',
        color: '#f7df1e',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Node.js',
        color: '#339933',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'TypeScript',
        color: '#3178c6',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Egg.js',
        color: '#ff6b6b',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'MySQL',
        color: '#4479a1',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Redis',
        color: '#dc382d',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('tags', null, {});
  },
};
