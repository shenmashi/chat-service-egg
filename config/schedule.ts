import { Application } from 'egg';

export default (app: Application) => {
  // 定时任务配置
  app.config.schedule = {
    // 清理过期缓存
    cleanExpiredCache: {
      cron: '0 0 2 * * *', // 每天凌晨2点执行
      type: 'worker',
      immediate: false,
    },
    
    // 清理过期token
    cleanExpiredTokens: {
      cron: '0 0 3 * * *', // 每天凌晨3点执行
      type: 'worker',
      immediate: false,
    },
    
    // 生成统计报告
    generateStatsReport: {
      cron: '0 0 1 * * *', // 每天凌晨1点执行
      type: 'worker',
      immediate: false,
    },
  };
};
