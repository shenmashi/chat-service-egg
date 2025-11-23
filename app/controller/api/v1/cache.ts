import { Controller } from 'egg';

export default class CacheController extends Controller {
  /**
   * @Summary 获取缓存统计信息
   * @Description 获取缓存使用统计信息
   * @Router GET /api/v1/cache/stats
   * @Request header Authorization
   * @Response 200 cacheStatsResponse
   */
  public async stats() {
    const { ctx, service } = this;

    try {
      const stats = await service.cache.getCacheStats();

      ctx.body = {
        code: 200,
        message: '获取缓存统计成功',
        data: stats,
      };
    } catch (error) {
      ctx.logger.error('获取缓存统计失败:', error);
      ctx.body = {
        code: 500,
        message: '获取缓存统计失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 清除指定缓存
   * @Description 清除指定的缓存
   * @Router DELETE /api/v1/cache/:key
   * @Request header Authorization
   * @Request path string key 缓存键
   * @Response 200 clearCacheResponse
   */
  public async clear() {
    const { ctx, service } = this;
    const { key } = ctx.params;

    try {
      await service.cache.del(key);

      ctx.body = {
        code: 200,
        message: '缓存清除成功',
      };
    } catch (error) {
      ctx.logger.error('清除缓存失败:', error);
      ctx.body = {
        code: 500,
        message: '清除缓存失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 清除所有缓存
   * @Description 清除所有缓存
   * @Router DELETE /api/v1/cache/all
   * @Request header Authorization
   * @Response 200 clearAllCacheResponse
   */
  public async clearAll() {
    const { ctx, service } = this;

    try {
      await service.cache.clearAll();

      ctx.body = {
        code: 200,
        message: '所有缓存清除成功',
      };
    } catch (error) {
      ctx.logger.error('清除所有缓存失败:', error);
      ctx.body = {
        code: 500,
        message: '清除所有缓存失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 预热缓存
   * @Description 预热常用数据缓存
   * @Router POST /api/v1/cache/warmup
   * @Request header Authorization
   * @Response 200 warmupCacheResponse
   */
  public async warmup() {
    const { ctx, service } = this;

    try {
      // 预热用户信息缓存
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(ctx.app.config.sequelize);
      
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
        role: {
          type: Sequelize.ENUM('admin', 'user', 'moderator'),
          defaultValue: 'user',
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive', 'banned'),
          defaultValue: 'active',
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
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      }, {
        tableName: 'articles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 预热用户信息
      const users = await User.findAll({
        where: { status: 'active' },
        limit: 50,
        attributes: ['id', 'username', 'email', 'role'],
      });

      for (const user of users) {
        await service.cache.setUserInfo(user.id, user);
      }

      // 预热文章信息
      const articles = await Article.findAll({
        where: { status: 'published' },
        limit: 50,
        attributes: ['id', 'title', 'content', 'view_count', 'like_count', 'user_id'],
      });

      for (const article of articles) {
        await service.cache.setArticleInfo(article.id, article);
      }

      // 预热统计信息
      const totalUsers = await User.count();
      const totalArticles = await Article.count();
      const publishedArticles = await Article.count({ where: { status: 'published' } });

      await service.cache.setStatistics('overview', {
        totalUsers,
        totalArticles,
        publishedArticles,
        timestamp: new Date(),
      });

      ctx.body = {
        code: 200,
        message: '缓存预热成功',
        data: {
          usersCached: users.length,
          articlesCached: articles.length,
          statisticsCached: 1,
        },
      };
    } catch (error) {
      ctx.logger.error('缓存预热失败:', error);
      ctx.body = {
        code: 500,
        message: '缓存预热失败',
        error: (error as Error).message,
      };
    }
  }
}
