import { EggAppInfo, EggAppConfig, PowerPartial } from 'egg';

export default (appInfo: EggAppInfo) => {
  const config: PowerPartial<EggAppConfig> = {};

  // 单元测试环境配置
  config.logger = {
    level: 'ERROR',
    consoleLevel: 'ERROR',
  };

  // 单元测试数据库配置
  config.sequelize = {
    logging: false,
  };

  // 单元测试Redis配置
  config.redis = {
    client: {
      port: 6379,
      host: 'localhost',
      password: '',
      db: 2, // 使用不同的数据库
    },
  };

  return config;
};
