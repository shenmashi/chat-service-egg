import { Controller } from 'egg';
import * as bcrypt from 'bcryptjs';

export default class CustomerServiceController extends Controller {
  /**
   * @Summary 客服注册
   * @Description 客服注册接口
   * @Router POST /api/v1/customer-service/register
   * @Request body customerServiceRegisterRequest
   * @Response 200 customerServiceRegisterResponse
   */
  public async register() {
    const { ctx, app } = this;
    const { username, email, password, realName } = ctx.request.body;

    try {
      // 验证参数
      if (!username || !email || !password) {
        ctx.body = {
          code: 400,
          message: '用户名、邮箱和密码不能为空',
        };
        return;
      }

      // 使用app.model中的CustomerService模型
      const CustomerService = (app.model as any).CustomerService;

      // 检查客服是否已存在
      const existingCustomerService = await CustomerService.findOne({
        where: {
          [app.Sequelize.Op.or]: [
            { username },
            { email },
          ],
        },
      });

      if (existingCustomerService) {
        ctx.body = {
          code: 400,
          message: '用户名或邮箱已存在',
        };
        return;
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建客服
      const customerService = await CustomerService.create({
        username,
        email,
        password: hashedPassword,
        status: 'offline',
        max_concurrent_chats: 100,
        current_chats: 0,
      });

      ctx.body = {
        code: 200,
        message: '客服注册成功',
        data: {
          id: customerService.id,
          username: customerService.username,
          email: customerService.email,
          status: customerService.status,
        },
      };
    } catch (error) {
      ctx.logger.error('客服注册失败:', error);
      ctx.body = {
        code: 500,
        message: '客服注册失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 客服登录
   * @Description 客服登录接口
   * @Router POST /api/v1/customer-service/login
   * @Request body customerServiceLoginRequest
   * @Response 200 customerServiceLoginResponse
   */
  public async login() {
    const { ctx, app } = this;
    const { username, password } = ctx.request.body;

    try {
      // 验证参数
      if (!username || !password) {
        ctx.body = {
          code: 400,
          message: '用户名和密码不能为空',
        };
        return;
      }

      // 使用app.model中的CustomerService模型
      const CustomerService = (app.model as any).CustomerService;

      // 查找客服
      const customerService = await CustomerService.findOne({
        where: {
          [app.Sequelize.Op.or]: [
            { username },
            { email: username },
          ],
        },
      });

      if (!customerService) {
        ctx.body = {
          code: 401,
          message: '用户名或密码错误',
        };
        return;
      }

      // 验证密码
      const isMatch = await bcrypt.compare(password, customerService.password);
      if (!isMatch) {
        ctx.body = {
          code: 401,
          message: '用户名或密码错误',
        };
        return;
      }

      // 生成JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({
        id: customerService.id,
        username: customerService.username,
        email: customerService.email,
        role: 'customer_service',
      }, app.config.jwt.secret, { expiresIn: app.config.jwt.expiresIn });

      // 更新最后登录时间
      await CustomerService.update(
        { last_login_at: new Date() },
        { where: { id: customerService.id } }
      );

      ctx.body = {
        code: 200,
        message: '登录成功',
        data: {
          token,
          customerService: {
            id: customerService.id,
            username: customerService.username,
            email: customerService.email,
            avatar: customerService.avatar,
            status: customerService.status,
            max_concurrent_chats: customerService.max_concurrent_chats,
            current_chats: customerService.current_chats,
          },
        },
      };
    } catch (error) {
      ctx.logger.error('客服登录失败:', error);
      ctx.body = {
        code: 500,
        message: '客服登录失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取客服信息
   * @Description 获取客服详细信息
   * @Router GET /api/v1/customer-service/profile
   * @Request header Authorization
   * @Response 200 customerServiceProfileResponse
   */
  public async profile() {
    const { ctx, app } = this;

    try {
      // 从JWT token中获取客服ID
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        ctx.body = {
          code: 401,
          message: '未提供Token',
        };
        return;
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, app.config.jwt.secret);

      // 使用app.model中的CustomerService模型
      const CustomerService = (app.model as any).CustomerService;
      const customerService = await CustomerService.findByPk(decoded.id);

      if (!customerService) {
        ctx.body = {
          code: 404,
          message: '客服不存在',
        };
        return;
      }

      ctx.body = {
        code: 200,
        message: '获取客服信息成功',
        data: {
          id: customerService.id,
          username: customerService.username,
          email: customerService.email,
          avatar: customerService.avatar,
          status: customerService.status,
          max_concurrent_chats: customerService.max_concurrent_chats,
          current_chats: customerService.current_chats,
          created_at: customerService.created_at,
          last_login_at: customerService.last_login_at,
        },
      };
    } catch (error) {
      ctx.logger.error('获取客服信息失败:', error);
      ctx.body = {
        code: 500,
        message: '获取客服信息失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 更新客服信息
   * @Description 更新客服信息
   * @Router PUT /api/v1/customer-service/profile
   * @Request header Authorization
   * @Request body customerServiceUpdateRequest
   * @Response 200 customerServiceUpdateResponse
   */
  public async updateProfile() {
    const { ctx, app } = this;
    const { realName, avatar, maxConcurrentChats } = ctx.request.body;

    try {
      // 从JWT token中获取客服ID
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        ctx.body = {
          code: 401,
          message: '未提供Token',
        };
        return;
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, app.config.jwt.secret);

      // 使用app.model中的CustomerService模型
      const CustomerService = (app.model as any).CustomerService;

      // 构建更新数据
      const updateData: any = {};
      if (avatar !== undefined) updateData.avatar = avatar;
      if (maxConcurrentChats !== undefined) updateData.max_concurrent_chats = maxConcurrentChats;

      // 更新客服信息
      await CustomerService.update(updateData, {
        where: { id: decoded.id }
      });

      // 获取更新后的客服信息
      const customerService = await CustomerService.findByPk(decoded.id);

      ctx.body = {
        code: 200,
        message: '更新客服信息成功',
        data: {
          id: customerService.id,
          username: customerService.username,
          email: customerService.email,
          avatar: customerService.avatar,
          status: customerService.status,
          max_concurrent_chats: customerService.max_concurrent_chats,
          current_chats: customerService.current_chats,
        },
      };
    } catch (error) {
      ctx.logger.error('更新客服信息失败:', error);
      ctx.body = {
        code: 500,
        message: '更新客服信息失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取在线客服列表
   * @Description 获取所有在线客服列表
   * @Router GET /api/v1/customer-service/online
   * @Response 200 onlineCustomerServiceListResponse
   */
  public async getOnlineList() {
    const { ctx, app } = this;

    try {
      // 使用app.model中的CustomerService模型
      const CustomerService = (app.model as any).CustomerService;
      const onlineCustomerServices = await CustomerService.findAll({
        where: {
          status: 'online'
        },
        attributes: ['id', 'username', 'avatar', 'current_chats', 'max_concurrent_chats'],
        order: [['current_chats', 'ASC']]
      });

      ctx.body = {
        code: 200,
        message: '获取在线客服列表成功',
        data: {
          list: onlineCustomerServices,
          total: onlineCustomerServices.length
        }
      };
    } catch (error) {
      ctx.logger.error('获取在线客服列表失败:', error);
      ctx.body = {
        code: 500,
        message: '获取在线客服列表失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取等待中的会话列表
   * @Description 获取等待客服处理的会话列表
   * @Router GET /api/v1/customer-service/waiting-sessions
   * @Request header Authorization
   * @Response 200 waitingSessionsResponse
   */
  public async getWaitingSessions() {
    const { ctx, app } = this;

    try {
      // 从JWT token中获取客服ID
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        ctx.body = {
          code: 401,
          message: '未提供Token',
        };
        return;
      }
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, app.config.jwt.secret);
      const customerServiceId = decoded.id;

      // 使用app.model中的ChatSession和User模型
      const ChatSession = (app.model as any).ChatSession;
      const User = (app.model as any).User;
      const { Op } = require('sequelize');
      
      // 查询所有等待会话（客服可以看到所有等待会话，方便处理或转移）
      const allWaitingSessions = await ChatSession.findAll({
        where: {
          status: 'waiting',
        },
        attributes: ['session_id', 'user_id', 'customer_service_id', 'created_at', 'status'],
        order: [['created_at', 'DESC']]
      });

      // 获取所有用户ID并批量查询
      const userIds = [...new Set(allWaitingSessions.map((s: any) => s.user_id).filter(Boolean))];
      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        // 某些环境的 users 表无 real_name 列，避免 SQL 报错
        attributes: ['id', 'username', 'email', 'avatar'],
      });
      const userMap = new Map(users.map((u: any) => [u.id, u]));

      // 按用户ID分组，只保留每个用户最新的等待会话
      const byUserId = new Map();
      allWaitingSessions.forEach((session: any) => {
        const userId = session.user_id;
        const existing = byUserId.get(userId);
        if (!existing || new Date(session.created_at) > new Date(existing.created_at)) {
          byUserId.set(userId, session);
        }
      });

      // 转换为数组并按时间排序，同时添加用户信息
      const waitingSessions = Array.from(byUserId.values()).map((session: any) => {
        const user: any = userMap.get(session.user_id);
        return {
          session_id: session.session_id,
          user_id: session.user_id,
          username: user?.username || `用户${session.user_id}`,
          email: user?.email,
          avatar: user?.avatar,
          status: session.status,
          created_at: session.created_at,
          updated_at: session.updated_at
        };
      }).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      ctx.body = {
        code: 200,
        message: '获取等待会话列表成功',
        data: {
          list: waitingSessions,
          total: waitingSessions.length
        }
      };
    } catch (error) {
      ctx.logger.error('获取等待会话列表失败:', error);
      ctx.body = {
        code: 500,
        message: '获取等待会话列表失败',
        error: (error as Error).message,
      };
    }
  }

  // 获取统计数据
  public async getStatistics() {
    const { ctx, app } = this;

    try {
      const ChatSession = (app.model as any).ChatSession;
      const ChatMessage = (app.model as any).ChatMessage;
      
      // 获取今日会话统计
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [totalSessions, activeSessions, waitingSessions, todayMessages] = await Promise.all([
        ChatSession.count(),
        ChatSession.count({ where: { status: 'active' } }),
        ChatSession.count({ where: { status: 'waiting' } }),
        ChatMessage.count({
          where: {
            created_at: {
              [app.Sequelize.Op.gte]: today,
              [app.Sequelize.Op.lt]: tomorrow
            }
          }
        })
      ]);

      ctx.body = {
        code: 200,
        message: '获取统计数据成功',
        data: {
          totalSessions,
          activeSessions,
          waitingSessions,
          todayMessages
        }
      };
    } catch (error) {
      ctx.logger.error('获取统计数据失败:', error);
      ctx.body = {
        code: 500,
        message: '获取统计数据失败',
        error: (error as Error).message,
      };
    }
  }
}
