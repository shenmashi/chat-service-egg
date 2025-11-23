import { Application } from 'egg';

export default class CleanExpiredTokens {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  // 定时任务配置
  static get schedule() {
    return {
      interval: '1h', // 每小时执行一次
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // 定时任务执行函数
  async task() {
    const { app } = this;
    
    try {
      // 检查Redis是否可用
      if (!app.redis || !app.redis.keys) {
        app.logger.warn('Redis不可用，跳过Token清理任务');
        return;
      }

      app.logger.info('开始清理过期Token...');
      
      // 清理黑名单中的过期token
      const blacklistKeys = await app.redis.keys('blacklist:*');
      let cleanedCount = 0;
      
      for (const key of blacklistKeys) {
        const ttl = await app.redis.ttl(key);
        if (ttl === -2) {
          // 已过期的键，删除
          await app.redis.del(key);
          cleanedCount++;
        }
      }
      
      // 清理重置密码token
      const resetKeys = await app.redis.keys('reset_password:*');
      for (const key of resetKeys) {
        const ttl = await app.redis.ttl(key);
        if (ttl === -2) {
          await app.redis.del(key);
          cleanedCount++;
        }
      }
      
      app.logger.info(`Token清理完成，处理了 ${cleanedCount} 个键`);
      
    } catch (error) {
      app.logger.error('清理过期Token失败:', error);
    }
  }
}
