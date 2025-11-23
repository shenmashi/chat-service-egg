import { Controller } from 'egg';
import { Op } from 'sequelize';
import * as bcrypt from 'bcryptjs';

export default class UserController extends Controller {
  /**
   * @Summary 用户注册
   * @Description 用户注册接口
   * @Router POST /api/v1/users/register
   * @Request body registerRequest
   * @Response 200 registerResponse
   */
  public async register() {
    const { ctx, app } = this;
    const { username, email, password, phone } = ctx.request.body;
    try {
      // 验证参数
      if (!username || !email || !password) {
        ctx.body = {
          code: 400,
          message: '用户名、邮箱和密码不能为空',
        };
        return;
      }

      // 使用app.model中的User模型
      const User = (app.model as any).User;

      // 检查用户是否已存在
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email },
          ],
        },
      });

      if (existingUser) {
        ctx.body = {
          code: 400,
          message: '用户名或邮箱已存在',
        };
        return;
      }

      // 密码加密
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        phone,
      });

      ctx.body = {
        code: 200,
        message: '注册成功',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          created_at: user.created_at,
        },
      };
    } catch (error) {
      ctx.logger.error('用户注册失败:', error);
      ctx.body = {
        code: 500,
        message: '注册失败',
        error: app.config.env === 'prod' ? 'Internal Server Error' : (error as Error).message,
      };
    }
  }

  /**
   * @Summary 用户登录
   * @Description 用户登录接口
   * @Router POST /api/v1/users/login
   * @Request body loginRequest
   * @Response 200 loginResponse
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

      // 使用app.model中的User模型
      const User = (app.model as any).User;

      // 查找用户
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email: username },
          ],
        },
      });

      if (!user) {
        ctx.body = {
          code: 401,
          message: '用户名或密码错误',
        };
        return;
      }

      // 验证密码
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        ctx.body = {
          code: 401,
          message: '用户名或密码错误',
        };
        return;
      }

      // 检查用户状态
      if (user.status !== 'active') {
        ctx.body = {
          code: 403,
          message: '账户已被禁用',
        };
        return;
      }

      // 生成JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({
        id: user.id,
        username: user.username,
        role: user.role,
      }, app.config.jwt.secret, { expiresIn: app.config.jwt.expiresIn });

      // 更新最后登录时间
      await user.update({
        last_login_at: new Date(),
      });

      ctx.body = {
        code: 200,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
            status: user.status,
            last_login_at: user.last_login_at,
          },
        },
      };
    } catch (error) {
      ctx.logger.error('用户登录失败:', error);
      ctx.body = {
        code: 500,
        message: '登录失败',
        error: app.config.env === 'prod' ? 'Internal Server Error' : (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取用户信息
   * @Description 获取当前用户信息
   * @Router GET /api/v1/users/profile
   * @Request header Authorization
   * @Response 200 profileResponse
   */
  public async profile() {
    const { ctx, app } = this;

    try {
      // 从JWT token中获取用户ID
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
      const user = await app.model.User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        ctx.body = {
          code: 404,
          message: '用户不存在',
        };
        return;
      }

      ctx.body = {
        code: 200,
        message: '获取用户信息成功',
        data: user,
      };
    } catch (error) {
      ctx.logger.error('获取用户信息失败:', error);
      ctx.body = {
        code: 500,
        message: '获取用户信息失败',
        error: app.config.env === 'prod' ? 'Internal Server Error' : (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取用户信息
   * @Description 根据用户ID获取用户详细信息
   * @Router GET /api/v1/users/info/:userId
   * @Response 200 getUserInfoResponse
   */
  public async getUserInfo() {
    const { ctx, app } = this;
    const { userId } = ctx.params;

    try {
      if (!userId) {
        ctx.body = {
          code: 400,
          message: '用户ID不能为空',
        };
        return;
      }

      // 使用app.model中的User模型
      const User = (app.model as any).User;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'phone', 'avatar', 'created_at', 'updated_at']
      });

      if (!user) {
        ctx.body = {
          code: 404,
          message: '用户不存在',
        };
        return;
      }

      ctx.body = {
        code: 200,
        message: '获取用户信息成功',
        data: user
      };
    } catch (error) {
      ctx.logger.error('获取用户信息失败:', error);
      ctx.body = {
        code: 500,
        message: '获取用户信息失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取用户历史会话
   * @Description 获取用户的历史会话列表
   * @Router GET /api/v1/users/sessions
   * @Request header Authorization
   * @Response 200 sessionsResponse
   */
  public async getSessions() {
    const { ctx, app } = this;

    try {
      // 从JWT token中获取用户ID
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

      // 使用app.model中的ChatSession模型
      const ChatSession = (app.model as any).ChatSession;
      const CustomerService = (app.model as any).CustomerService;
      const { Op } = require('sequelize');
      
      const sessions = await ChatSession.findAll({
        where: {
          user_id: decoded.id,
          status: 'ended', // 只返回已结束的会话作为历史记录
        },
        attributes: ['id', 'session_id', 'customer_service_id', 'user_id', 'status', 'priority', 'started_at', 'ended_at', 'created_at', 'updated_at'],
        order: [['updated_at', 'DESC']],
        limit: 50,
      });

      // 获取所有客服ID并批量查询客服信息
      const customerServiceIds = [...new Set(sessions.map((s: any) => s.customer_service_id).filter(Boolean))];
      const customerServices = customerServiceIds.length > 0 
        ? await CustomerService.findAll({
            where: { id: { [Op.in]: customerServiceIds } },
            attributes: ['id', 'username', 'email', 'avatar']
          })
        : [];
      
      const customerServiceMap = new Map(customerServices.map((cs: any) => [cs.id, cs]));

      // 合并会话和客服信息
      const sessionsWithCustomerService = sessions.map((session: any) => {
        const customerService = session.customer_service_id 
          ? customerServiceMap.get(session.customer_service_id)
          : null;
        
        return {
          ...session.toJSON(),
          customerService: customerService ? {
            id: (customerService as any).id,
            username: (customerService as any).username,
            email: (customerService as any).email,
            avatar: (customerService as any).avatar
          } : null
        };
      });

      ctx.body = {
        code: 200,
        message: '获取会话列表成功',
        data: {
          list: sessionsWithCustomerService,
          total: sessionsWithCustomerService.length
        }
      };
    } catch (error) {
      ctx.logger.error('获取会话列表失败:', error);
      ctx.body = {
        code: 500,
        message: '获取会话列表失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取所有客服列表
   * @Description 获取所有客服的列表和状态
   * @Router GET /api/v1/users/customer-services
   * @Request header Authorization
   * @Response 200 customerServicesResponse
   */
  public async getCustomerServices() {
    const { ctx, app } = this;

    try {
      // 从JWT token中获取用户ID
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
      const customerServices = await CustomerService.findAll({
        attributes: ['id', 'username', 'status', 'current_chats', 'max_concurrent_chats'],
        order: [['status', 'DESC'], ['current_chats', 'ASC']] // 在线状态优先，然后按当前聊天数排序
      });

      ctx.body = {
        code: 200,
        message: '获取客服列表成功',
        data: customerServices
      };
    } catch (error) {
      ctx.logger.error('获取客服列表失败:', error);
      ctx.body = {
        code: 500,
        message: '获取客服列表失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 更新用户信息
   * @Description 更新当前用户信息
   * @Router PUT /api/v1/users/profile
   * @Request header Authorization
   * @Request body updateProfileRequest
   * @Response 200 updateProfileResponse
   */
  public async updateProfile() {
    const { ctx, app } = this;
    const { phone, avatar } = ctx.request.body;

    try {
      const user = await app.model.User.findByPk(ctx.state.user!.id);

      if (!user) {
        ctx.body = {
          code: 404,
          message: '用户不存在',
        };
        return;
      }

      // 更新用户信息
      await user.update({
        phone: phone || (user as any).phone,
        avatar: avatar || (user as any).avatar,
      });

      ctx.body = {
        code: 200,
        message: '更新用户信息成功',
        data: {
          id: (user as any).id,
          username: (user as any).username,
          email: (user as any).email,
          phone: (user as any).phone,
          avatar: (user as any).avatar,
          role: (user as any).role,
          status: (user as any).status,
          updated_at: (user as any).updated_at,
        },
      };
    } catch (error) {
      ctx.logger.error('更新用户信息失败:', error);
      ctx.body = {
        code: 500,
        message: '更新用户信息失败',
        error: app.config.env === 'prod' ? 'Internal Server Error' : (error as Error).message,
      };
    }
  }
}
