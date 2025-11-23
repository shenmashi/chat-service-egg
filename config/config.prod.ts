import { EggAppInfo, EggAppConfig, PowerPartial } from 'egg';

export default (appInfo: EggAppInfo) => {
  const config: PowerPartial<EggAppConfig> = {};

  // 生产环境配置
  config.logger = {
    level: 'WARN',
    consoleLevel: 'WARN',
  };

  // 生产环境数据库配置
  config.sequelize = {
    database: process.env.DB_DATABASE || 'custom_service', // 生产环境使用 custom_service
  } as any;

  // 生产环境安全配置
  config.security = {
    csrf: {
      enable: false, // 禁用 CSRF，API 接口不需要 CSRF 保护（使用 JWT 认证）
      // 如果需要启用 CSRF，可以使用以下配置排除 API 路由：
      // ignore: '/api',
      // ignoreJSON: true, // 忽略 JSON 请求的 CSRF 检查
    },
    // 允许跨域访问（如果需要）
    domainWhiteList: ['*'], // 生产环境可以根据需要配置具体域名
  };

  return config;
};
