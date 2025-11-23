import { Controller } from 'egg';

export default class StatisticsController extends Controller {
  /**
   * @Summary 获取系统统计信息
   * @Description 获取系统整体统计信息
   * @Router GET /api/v1/statistics/overview
   * @Request header Authorization
   * @Response 200 statisticsOverviewResponse
   */
  public async overview() {
    const { ctx, app } = this;

    try {
      // 直接使用Sequelize创建模型
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);
      
      const User = sequelize.define('User', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        username: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        phone: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        avatar: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        role: {
          type: Sequelize.ENUM('admin', 'user', 'moderator'),
          defaultValue: 'user',
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive', 'banned'),
          defaultValue: 'active',
        },
        last_login_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      const Article = sequelize.define('Article', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        title: {
          type: Sequelize.STRING(200),
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        summary: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        cover_image: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('draft', 'published', 'archived'),
          defaultValue: 'draft',
        },
        view_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        like_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        comment_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        published_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      }, {
        tableName: 'articles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      const File = sequelize.define('File', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        filename: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        original_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        file_path: {
          type: Sequelize.STRING(500),
          allowNull: false,
        },
        file_size: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        mime_type: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        file_type: {
          type: Sequelize.ENUM('image', 'document', 'video', 'audio', 'other'),
          allowNull: false,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('active', 'deleted'),
          defaultValue: 'active',
        },
      }, {
        tableName: 'files',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 获取用户统计
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { status: 'active' } });
      const newUsersToday = await User.count({
        where: {
          created_at: {
            [Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      // 获取文章统计
      const totalArticles = await Article.count();
      const publishedArticles = await Article.count({ where: { status: 'published' } });
      const draftArticles = await Article.count({ where: { status: 'draft' } });
      const totalViews = await Article.sum('view_count') || 0;
      const totalLikes = await Article.sum('like_count') || 0;

      // 获取文件统计
      const totalFiles = await File.count({ where: { status: 'active' } });
      const totalFileSize = await File.sum('file_size', { where: { status: 'active' } }) || 0;

      // 按文件类型统计
      const fileTypeStats = await File.findAll({
        attributes: [
          'file_type',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          [Sequelize.fn('SUM', Sequelize.col('file_size')), 'total_size'],
        ],
        where: { status: 'active' },
        group: ['file_type'],
        raw: true,
      });

      // 获取最近7天的用户注册趋势
      const userTrends = await sequelize.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, {
        type: Sequelize.QueryTypes.SELECT,
      });

      // 获取最近7天的文章发布趋势
      const articleTrends = await sequelize.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM articles
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, {
        type: Sequelize.QueryTypes.SELECT,
      });

      ctx.body = {
        code: 200,
        message: '获取统计信息成功',
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
            newToday: newUsersToday,
            trends: userTrends,
          },
          articles: {
            total: totalArticles,
            published: publishedArticles,
            draft: draftArticles,
            totalViews,
            totalLikes,
            trends: articleTrends,
          },
          files: {
            total: totalFiles,
            totalSize: totalFileSize,
            typeStats: fileTypeStats,
          },
          system: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform,
          },
        },
      };
    } catch (error) {
      ctx.logger.error('获取统计信息失败:', error);
      ctx.body = {
        code: 500,
        message: '获取统计信息失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取用户统计信息
   * @Description 获取用户相关的统计信息
   * @Router GET /api/v1/statistics/users
   * @Request header Authorization
   * @Response 200 userStatisticsResponse
   */
  public async users() {
    const { ctx, app } = this;

    try {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);
      
      const User = sequelize.define('User', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        username: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        phone: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        avatar: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        role: {
          type: Sequelize.ENUM('admin', 'user', 'moderator'),
          defaultValue: 'user',
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive', 'banned'),
          defaultValue: 'active',
        },
        last_login_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 按角色统计用户
      const roleStats = await User.findAll({
        attributes: [
          'role',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        ],
        group: ['role'],
        raw: true,
      });

      // 按状态统计用户
      const statusStats = await User.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      });

      // 最近活跃用户（有登录记录）
      const recentActiveUsers = await User.findAll({
        where: {
          last_login_at: {
            [Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天内
          },
        },
        order: [['last_login_at', 'DESC']],
        limit: 10,
        attributes: ['id', 'username', 'email', 'last_login_at'],
      });

      ctx.body = {
        code: 200,
        message: '获取用户统计信息成功',
        data: {
          roleStats,
          statusStats,
          recentActiveUsers,
        },
      };
    } catch (error) {
      ctx.logger.error('获取用户统计信息失败:', error);
      ctx.body = {
        code: 500,
        message: '获取用户统计信息失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取文章统计信息
   * @Description 获取文章相关的统计信息
   * @Router GET /api/v1/statistics/articles
   * @Request header Authorization
   * @Response 200 articleStatisticsResponse
   */
  public async articles() {
    const { ctx, app } = this;

    try {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);
      
      const Article = sequelize.define('Article', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        title: {
          type: Sequelize.STRING(200),
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        summary: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        cover_image: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('draft', 'published', 'archived'),
          defaultValue: 'draft',
        },
        view_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        like_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        comment_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        published_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      }, {
        tableName: 'articles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      const User = sequelize.define('User', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        username: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
      }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 按状态统计文章
      const statusStats = await Article.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      });

      // 热门文章（按浏览量排序）
      const popularArticles = await Article.findAll({
        where: { status: 'published' },
        order: [['view_count', 'DESC']],
        limit: 10,
        attributes: ['id', 'title', 'view_count', 'like_count', 'user_id'],
        include: [{
          model: User,
          as: 'author',
          attributes: ['username'],
        }],
      });

      // 最活跃作者（按文章数量）
      const activeAuthors = await sequelize.query(`
        SELECT u.id, u.username, COUNT(a.id) as article_count, SUM(a.view_count) as total_views
        FROM users u
        LEFT JOIN articles a ON u.id = a.user_id
        GROUP BY u.id, u.username
        ORDER BY article_count DESC
        LIMIT 10
      `, {
        type: Sequelize.QueryTypes.SELECT,
      });

      ctx.body = {
        code: 200,
        message: '获取文章统计信息成功',
        data: {
          statusStats,
          popularArticles,
          activeAuthors,
        },
      };
    } catch (error) {
      ctx.logger.error('获取文章统计信息失败:', error);
      ctx.body = {
        code: 500,
        message: '获取文章统计信息失败',
        error: (error as Error).message,
      };
    }
  }
}
