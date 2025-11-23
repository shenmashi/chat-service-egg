import { EggAppInfo, EggAppConfig, PowerPartial } from 'egg';

export default (appInfo: EggAppInfo) => {
  const config: PowerPartial<EggAppConfig> = {};

  // 测试环境配置
  config.logger = {
    level: 'DEBUG',
    consoleLevel: 'DEBUG',
  };

  // 测试环境数据库配置
  config.sequelize = {
    logging: false,
  };

  // 测试环境Redis配置
  config.redis = {
    client: {
      port: 6379,
      host: 'localhost',
      password: '',
      db: 1, // 使用不同的数据库
    },
  };

  return config;
};
