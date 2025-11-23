'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, STRING, TEXT, DATE, BOOLEAN, ENUM } = Sequelize;

    // 创建用户表
    await queryInterface.createTable('users', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '用户ID',
      },
      username: {
        type: STRING(50),
        allowNull: false,
        unique: true,
        comment: '用户名',
      },
      email: {
        type: STRING(100),
        allowNull: false,
        unique: true,
        comment: '邮箱',
      },
      password: {
        type: STRING(255),
        allowNull: false,
        comment: '密码',
      },
      nickname: {
        type: STRING(50),
        allowNull: true,
        comment: '昵称',
      },
      avatar: {
        type: STRING(255),
        allowNull: true,
        comment: '头像',
      },
      phone: {
        type: STRING(20),
        allowNull: true,
        comment: '手机号',
      },
      status: {
        type: ENUM('active', 'inactive', 'banned'),
        defaultValue: 'active',
        comment: '状态',
      },
      role: {
        type: ENUM('admin', 'user', 'guest'),
        defaultValue: 'user',
        comment: '角色',
      },
      last_login_at: {
        type: DATE,
        allowNull: true,
        comment: '最后登录时间',
      },
      created_at: {
        type: DATE,
        allowNull: false,
        comment: '创建时间',
      },
      updated_at: {
        type: DATE,
        allowNull: false,
        comment: '更新时间',
      },
    });

    // 创建文章表
    await queryInterface.createTable('articles', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '文章ID',
      },
      title: {
        type: STRING(200),
        allowNull: false,
        comment: '标题',
      },
      content: {
        type: TEXT,
        allowNull: false,
        comment: '内容',
      },
      summary: {
        type: STRING(500),
        allowNull: true,
        comment: '摘要',
      },
      cover_image: {
        type: STRING(255),
        allowNull: true,
        comment: '封面图片',
      },
      status: {
        type: ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft',
        comment: '状态',
      },
      view_count: {
        type: INTEGER,
        defaultValue: 0,
        comment: '浏览次数',
      },
      like_count: {
        type: INTEGER,
        defaultValue: 0,
        comment: '点赞数',
      },
      user_id: {
        type: INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        comment: '作者ID',
      },
      created_at: {
        type: DATE,
        allowNull: false,
        comment: '创建时间',
      },
      updated_at: {
        type: DATE,
        allowNull: false,
        comment: '更新时间',
      },
    });

    // 创建分类表
    await queryInterface.createTable('categories', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '分类ID',
      },
      name: {
        type: STRING(50),
        allowNull: false,
        comment: '分类名称',
      },
      description: {
        type: STRING(200),
        allowNull: true,
        comment: '描述',
      },
      parent_id: {
        type: INTEGER,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id',
        },
        comment: '父分类ID',
      },
      sort_order: {
        type: INTEGER,
        defaultValue: 0,
        comment: '排序',
      },
      status: {
        type: ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: '状态',
      },
      created_at: {
        type: DATE,
        allowNull: false,
        comment: '创建时间',
      },
      updated_at: {
        type: DATE,
        allowNull: false,
        comment: '更新时间',
      },
    });

    // 创建文章分类关联表
    await queryInterface.createTable('article_categories', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '关联ID',
      },
      article_id: {
        type: INTEGER,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'id',
        },
        comment: '文章ID',
      },
      category_id: {
        type: INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
        comment: '分类ID',
      },
      created_at: {
        type: DATE,
        allowNull: false,
        comment: '创建时间',
      },
      updated_at: {
        type: DATE,
        allowNull: false,
        comment: '更新时间',
      },
    });

    // 创建标签表
    await queryInterface.createTable('tags', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '标签ID',
      },
      name: {
        type: STRING(30),
        allowNull: false,
        unique: true,
        comment: '标签名称',
      },
      color: {
        type: STRING(7),
        allowNull: true,
        comment: '标签颜色',
      },
      created_at: {
        type: DATE,
        allowNull: false,
        comment: '创建时间',
      },
      updated_at: {
        type: DATE,
        allowNull: false,
        comment: '更新时间',
      },
    });

    // 创建文章标签关联表
    await queryInterface.createTable('article_tags', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '关联ID',
      },
      article_id: {
        type: INTEGER,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'id',
        },
        comment: '文章ID',
      },
      tag_id: {
        type: INTEGER,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id',
        },
        comment: '标签ID',
      },
      created_at: {
        type: DATE,
        allowNull: false,
        comment: '创建时间',
      },
      updated_at: {
        type: DATE,
        allowNull: false,
        comment: '更新时间',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('article_tags');
    await queryInterface.dropTable('tags');
    await queryInterface.dropTable('article_categories');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('articles');
    await queryInterface.dropTable('users');
  },
};
