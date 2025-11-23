import { EggAppInfo, EggAppConfig, PowerPartial } from 'egg';

export default (appInfo: EggAppInfo) => {
  const config: PowerPartial<EggAppConfig> = {};

  // 开发环境配置
  config.logger = {
    level: 'DEBUG',
    consoleLevel: 'DEBUG',
  };

  // 开发环境数据库配置
  config.sequelize = {
    database: process.env.DB_DATABASE || 'egg_enterprise_api', // 开发环境使用 egg_enterprise_api
    logging: console.log,
  } as any;

  return config;
};
