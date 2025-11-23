import { EggAppInfo, EggAppConfig, PowerPartial } from 'egg';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export default (appInfo: EggAppInfo): PowerPartial<EggAppConfig> => {
  const config: PowerPartial<EggAppConfig> = {};

  // 覆盖框架默认配置
  config.keys = appInfo.name + '_1234567890abcdef';

  // 中间件配置 - 暂时禁用所有中间件进行调试
  config.middleware = [];

  // 安全配置
  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  };

  // CORS配置
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };

  // JWT配置
  config.jwt = {
    secret: process.env.JWT_SECRET || 'qinghe_customer_service',
    expiresIn: '24h',
  };

  // 数据库配置
  // 根据环境变量决定默认数据库：开发环境 egg_enterprise_api，生产环境 custom_service
  const defaultDatabase = process.env.NODE_ENV === 'production' ? 'custom_service' : 'egg_enterprise_api';
  
  config.sequelize = {
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_DATABASE || defaultDatabase,
    timezone: '+08:00',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
  };

  // Redis配置
  config.redis = {
    client: {
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST || '127.0.0.1',
      password: process.env.REDIS_PASSWORD || '',
      db: 0,
    },
  };

  // 静态资源配置
  config.static = {
    prefix: '/public/',
    dir: 'app/public',
  };

  // 视图配置
  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.tpl': 'nunjucks',
    },
  };

  // 文件上传配置
  config.multipart = {
    fileSize: '10mb',
    whitelist: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'],
  };

  // 日志配置
  config.logger = {
    level: 'INFO',
    consoleLevel: 'INFO',
  };

  // 集群配置
  config.cluster = {
    listen: {
      port: 7001,
      hostname: '0.0.0.0', // 绑定到所有网络接口
    },
    // 限制 worker 数量，避免创建过多进程导致端口冲突
    // 对于 Windows Server 部署，建议设置为 1-2 个 worker
    workers: process.env.EGG_WORKERS ? parseInt(process.env.EGG_WORKERS) : 1,
  };

  // 定时任务配置
  config.schedule = {
    directory: [],
  };

  return config;
};
