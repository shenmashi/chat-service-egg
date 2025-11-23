import { Application } from 'egg';

export default (app: Application) => {
  // 扩展 Agent 对象
  app.agent.monitor = {
    // 监控系统资源
    async getSystemInfo() {
      const os = require('os');
      return {
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length,
        loadavg: os.loadavg(),
      };
    },

    // 监控进程信息
    async getProcessInfo() {
      const process = require('process');
      return {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
      };
    },

    // 监控数据库连接
    async getDatabaseStatus() {
      try {
        await app.model.User.findOne({ limit: 1 });
        return { status: 'healthy', message: '数据库连接正常' };
      } catch (error) {
        return { status: 'unhealthy', message: '数据库连接异常', error: (error as Error).message };
      }
    },

    // 监控Redis连接
    async getRedisStatus() {
      // 如果 Redis 不可用，返回未配置状态
      if (!app.redis || !app.redis.ping) {
        return { 
          status: 'not_configured', 
          message: 'Redis未配置或不可用',
          note: '应用将在无缓存模式下运行'
        };
      }
      
      try {
        await app.redis.ping();
        return { status: 'healthy', message: 'Redis连接正常' };
      } catch (error) {
        return { status: 'unhealthy', message: 'Redis连接异常', error: (error as Error).message };
      }
    },
  };
};
