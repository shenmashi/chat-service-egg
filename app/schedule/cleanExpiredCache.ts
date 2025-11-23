import { Application } from 'egg';

export default class CleanExpiredCache {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  // 定时任务配置
  static get schedule() {
    return {
      interval: '10m', // 每10分钟执行一次
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // 定时任务执行函数
  async subscribe() {
    const { app } = this;
    
    try {
      // 检查Redis是否可用
      if (!app.redis || !app.redis.keys) {
        app.logger.warn('Redis不可用，跳过缓存清理任务');
        return;
      }

      app.logger.info('开始清理过期缓存...');
      
      // 获取所有缓存键
      const keys = await app.redis.keys('cache:*');
      
      let cleanedCount = 0;
      for (const key of keys) {
        const ttl = await app.redis.ttl(key);
        if (ttl === -1) {
          // 没有过期时间的键，设置默认过期时间
          await app.redis.expire(key, 3600); // 1小时
          cleanedCount++;
        } else if (ttl === -2) {
          // 已过期的键，删除
          await app.redis.del(key);
          cleanedCount++;
        }
      }
      
      app.logger.info(`缓存清理完成，处理了 ${cleanedCount} 个键`);
      
    } catch (error) {
      app.logger.error('清理过期缓存失败:', error);
    }
  }
}
