import { Application } from 'egg';

export default class GenerateStatsReport {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  // 定时任务配置
  static get schedule() {
    return {
      cron: '0 0 * * *', // 每天凌晨执行
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // 定时任务执行函数
  async task() {
    const { app } = this;
    
    try {
      app.logger.info('开始生成统计报告...');
      
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      // 用户统计
      const totalUsers = await app.model.User.count();
      const newUsersToday = await app.model.User.count({
        where: {
          created_at: {
            [app.model.sequelize.Op.gte]: today,
          },
        },
      });
      
      // 文章统计
      const totalArticles = await app.model.Article.count();
      const publishedArticles = await app.model.Article.count({
        where: { status: 'published' },
      });
      const newArticlesToday = await app.model.Article.count({
        where: {
          created_at: {
            [app.model.sequelize.Op.gte]: today,
          },
        },
      });
      
      // 访问统计
      const totalViews = await app.model.Article.sum('viewCount') || 0;
      const totalLikes = await app.model.Article.sum('likeCount') || 0;
      
      const stats = {
        date: yesterday.toISOString().split('T')[0],
        users: {
          total: totalUsers,
          newToday: newUsersToday,
        },
        articles: {
          total: totalArticles,
          published: publishedArticles,
          newToday: newArticlesToday,
        },
        engagement: {
          totalViews,
          totalLikes,
        },
      };
      
      // 将统计信息存储到Redis（如果可用）
      if (app.redis && app.redis.setex) {
        const statsKey = `stats:${yesterday.toISOString().split('T')[0]}`;
        await app.redis.setex(statsKey, 7 * 24 * 3600, JSON.stringify(stats)); // 保存7天
      }
      
      app.logger.info('统计报告生成完成:', stats);
      
    } catch (error) {
      app.logger.error('生成统计报告失败:', error);
    }
  }
}
