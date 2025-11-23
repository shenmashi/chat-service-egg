import { EggAppInfo, EggAppConfig, PowerPartial } from 'egg';

export default (appInfo: EggAppInfo) => {
  const config: PowerPartial<EggAppConfig> = {};

  // 插件配置
  config.plugin = {
    // 数据库插件 - 暂时禁用以使用手动初始化
    sequelize: {
      enable: false,
      package: 'egg-sequelize',
    },
    // Redis插件 - 暂时禁用以简化调试
    redis: {
      enable: false,
      package: 'egg-redis',
    },
    // JWT插件
    jwt: {
      enable: true,
      package: 'egg-jwt',
    },
    // Swagger文档插件
    swaggerdoc: {
      enable: true,
      package: 'egg-swagger-doc',
    },
    // 参数验证插件
    validate: {
      enable: true,
      package: 'egg-validate',
    },
    // CORS插件
    cors: {
      enable: true,
      package: 'egg-cors',
    },
    // 安全插件 - 使用内置的安全中间件
    // helmet: {
    //   enable: true,
    //   package: 'egg-helmet',
    // },
    // 压缩插件 - 使用内置的压缩中间件
    // compression: {
    //   enable: true,
    //   package: 'egg-compression',
    // },
    // 定时任务插件
    schedule: {
      enable: true,
      package: 'egg-schedule',
    },
    // 文件上传插件
    multipart: {
      enable: true,
      package: 'egg-multipart',
    },
    // 静态资源插件
    static: {
      enable: true,
      package: 'egg-static',
    },
  };

  return config;
};
