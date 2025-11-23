import { Controller } from 'egg';

export default class HomeController extends Controller {
  /**
   * @Summary 健康检查
   * @Description 系统健康检查接口
   * @Router GET /health
   * @Response 200 healthResponse
   */
  public async index() {
    const { ctx, app } = this;
    
    try {
      ctx.body = {
        code: 200,
        message: '系统运行正常',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: app.config.env,
        },
      };
    } catch (error) {
      ctx.logger.error('健康检查失败:', error);
      ctx.body = {
        code: 500,
        message: '系统异常',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: app.config.env === 'prod' ? 'Internal Server Error' : (error as Error).message,
        },
      };
    }
  }

  /**
   * @Summary 欢迎页面
   * @Description 系统欢迎页面
   * @Router GET /
   * @Response 200 welcomeResponse
   */
  public async welcome() {
    const { ctx } = this;
    
    ctx.body = {
      code: 200,
      message: '欢迎使用企业级 Node.js + Egg.js RESTful API 框架',
      data: {
        name: 'Enterprise API Framework',
        version: '1.0.0',
        description: '基于 Node.js + Egg.js + MySQL + Redis 的企业级 RESTful API 框架',
        features: [
          'JWT Token 认证',
          'MySQL 数据库支持',
          'Redis 缓存系统',
          'Swagger API 文档',
          'TypeScript 支持',
          '高并发处理',
          '安全防护',
          '性能监控',
          '定时任务',
          'Docker 部署'
        ],
        endpoints: {
          health: '/health',
          api: '/api/v1',
          docs: '/swagger-ui.html'
        }
      }
    };
  }
}
