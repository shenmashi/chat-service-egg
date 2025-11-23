import { Controller } from 'egg';
import { Op } from 'sequelize';

export default class ArticleController extends Controller {
  /**
   * @Summary 获取文章列表
   * @Description 获取文章列表，支持分页和搜索
   * @Router GET /api/v1/articles
   * @Request query page
   * @Request query pageSize
   * @Request query keyword
   * @Request query status
   * @Response 200 articleListResponse
   */
  public async index() {
    const { ctx, app } = this;
    const { page = 1, pageSize = 10, keyword, status } = ctx.query;

    try {
      // 使用app.model中的Article模型
      const Article = (app.model as any).Article;

      const where: any = {};
      
      // 状态筛选
      if (status) {
        where.status = status;
      }

      // 关键词搜索
      if (keyword) {
        where[Op.or] = [
          { title: { [Op.like]: `%${keyword}%` } },
          { content: { [Op.like]: `%${keyword}%` } },
        ];
      }

      const { count, rows } = await Article.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(pageSize as string),
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      });

      ctx.body = {
        code: 200,
        message: '获取文章列表成功',
        data: {
          list: rows,
          pagination: {
            total: count,
            page: parseInt(page as string),
            pageSize: parseInt(pageSize as string),
            totalPages: Math.ceil(count / parseInt(pageSize as string)),
          },
        },
      };
    } catch (error) {
      ctx.logger.error('获取文章列表失败:', error);
      ctx.body = {
        code: 500,
        message: '获取文章列表失败',
        error: app.config.env === 'prod' ? 'Internal Server Error' : (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取文章详情
   * @Description 根据ID获取文章详情
   * @Router GET /api/v1/articles/:id
   * @Request path id
   * @Response 200 articleDetailResponse
   */
  public async show() {
    const { ctx, app } = this;
    const { id } = ctx.params;

    try {
      const article = await app.model.Article.findByPk(id);

      if (!article) {
        ctx.body = {
          code: 404,
          message: '文章不存在',
        };
        return;
      }

      // 增加浏览次数
      await article.increment('view_count');

      ctx.body = {
        code: 200,
        message: '获取文章详情成功',
        data: article,
      };
    } catch (error) {
      ctx.logger.error('获取文章详情失败:', error);
      ctx.body = {
        code: 500,
        message: '获取文章详情失败',
        error: app.config.env === 'prod' ? 'Internal Server Error' : (error as Error).message,
      };
    }
  }

  /**
   * @Summary 创建文章
   * @Description 创建新文章
   * @Router POST /api/v1/articles
   * @Request header Authorization
   * @Request body createArticleRequest
   * @Response 200 createArticleResponse
   */
  public async create() {
    const { ctx, app } = this;
    const { title, content, summary, cover_image, status = 'draft' } = ctx.request.body;

    try {
      // 验证参数
      if (!title || !content) {
        ctx.body = {
          code: 400,
          message: '标题和内容不能为空',
        };
        return;
      }

      // 创建文章
      const article = await app.model.Article.create({
        title,
        content,
        summary,
        cover_image,
        status,
        user_id: ctx.state.user!.id,
        published_at: status === 'published' ? new Date() : null,
      });

      ctx.body = {
        code: 200,
        message: '创建文章成功',
        data: article,
      };
    } catch (error) {
      ctx.logger.error('创建文章失败:', error);
      ctx.body = {
        code: 500,
        message: '创建文章失败',
        error: app.config.env === 'prod' ? 'Internal Server Error' : (error as Error).message,
      };
    }
  }

  /**
   * @Summary 更新文章
   * @Description 更新文章信息
   * @Router PUT /api/v1/articles/:id
   * @Request header Authorization
   * @Request path id
   * @Request body updateArticleRequest
   * @Response 200 updateArticleResponse
   */
  public async update() {
    const { ctx, app } = this;
    const { id } = ctx.params;
    const { title, content, summary, cover_image, status } = ctx.request.body;

    try {
      const article = await app.model.Article.findByPk(id);

      if (!article) {
        ctx.body = {
          code: 404,
          message: '文章不存在',
        };
        return;
      }

      // 检查权限（只有作者可以修改）
      if ((article as any).user_id !== ctx.state.user!.id && ctx.state.user!.role !== 'admin') {
        ctx.body = {
          code: 403,
          message: '无权限修改此文章',
        };
        return;
      }

      // 更新文章
      await article.update({
        title: title || (article as any).title,
        content: content || (article as any).content,
        summary: summary !== undefined ? summary : (article as any).summary,
        cover_image: cover_image !== undefined ? cover_image : (article as any).cover_image,
        status: status || (article as any).status,
        published_at: status === 'published' && (article as any).status !== 'published' ? new Date() : (article as any).published_at,
      });

      ctx.body = {
        code: 200,
        message: '更新文章成功',
        data: article,
      };
    } catch (error) {
      ctx.logger.error('更新文章失败:', error);
      ctx.body = {
        code: 500,
        message: '更新文章失败',
        error: app.config.env === 'prod' ? 'Internal Server Error' : (error as Error).message,
      };
    }
  }

  /**
   * @Summary 删除文章
   * @Description 删除文章
   * @Router DELETE /api/v1/articles/:id
   * @Request header Authorization
   * @Request path id
   * @Response 200 deleteArticleResponse
   */
  public async destroy() {
    const { ctx, app } = this;
    const { id } = ctx.params;

    try {
      const article = await app.model.Article.findByPk(id);

      if (!article) {
        ctx.body = {
          code: 404,
          message: '文章不存在',
        };
        return;
      }

      // 检查权限（只有作者或管理员可以删除）
      if ((article as any).user_id !== ctx.state.user!.id && ctx.state.user!.role !== 'admin') {
        ctx.body = {
          code: 403,
          message: '无权限删除此文章',
        };
        return;
      }

      await article.destroy();

      ctx.body = {
        code: 200,
        message: '删除文章成功',
      };
    } catch (error) {
      ctx.logger.error('删除文章失败:', error);
      ctx.body = {
        code: 500,
        message: '删除文章失败',
        error: app.config.env === 'prod' ? 'Internal Server Error' : (error as Error).message,
      };
    }
  }
}
