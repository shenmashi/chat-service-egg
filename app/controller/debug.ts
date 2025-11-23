import { Controller } from 'egg';

export default class DebugController extends Controller {
  /**
   * 调试接口 - 检查模型加载状态
   */
  public async modelStatus() {
    const { ctx, app } = this;

    try {
      const modelInfo = {
        availableModels: Object.keys(app.model || {}),
        sequelizeStatus: !!app.Sequelize,
        sequelizeConfig: app.config.sequelize,
        userModel: !!(app.model as any)?.User,
        articleModel: !!(app.model as any)?.Article,
        modelKeys: Object.keys(app.model || {}),
        modelUser: (app.model as any)?.User,
        modelArticle: (app.model as any)?.Article,
      };

      ctx.body = {
        code: 200,
        message: '模型状态检查完成',
        data: modelInfo,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        message: '模型状态检查失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * 调试接口 - 测试数据库连接
   */
  public async dbTest() {
    const { ctx, app } = this;

    try {
      // 测试数据库连接
      await (app.model as any).sequelize.authenticate();
      
      ctx.body = {
        code: 200,
        message: '数据库连接成功',
        data: {
          database: app.config.sequelize.database,
          host: app.config.sequelize.host,
          port: app.config.sequelize.port,
        },
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        message: '数据库连接失败',
        error: (error as Error).message,
      };
    }
  }
}
