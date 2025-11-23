import { Controller } from 'egg';

export default class SmsController extends Controller {
  /**
   * @Summary 发送短信验证码
   * @Description 发送短信验证码到指定手机号
   * @Router POST /api/v1/sms/send
   * @Request body sendSmsRequest
   * @Response 200 sendSmsResponse
   */
  public async send() {
    const { ctx, service } = this;
    const { phone, type = 'register' } = ctx.request.body;

    try {
      // 验证参数
      if (!phone) {
        ctx.body = {
          code: 400,
          message: '手机号不能为空',
        };
        return;
      }

      // 发送验证码
      const result = await service.sms.sendCode(phone, type);

      ctx.body = {
        code: 200,
        message: result.message,
        data: result.code ? { code: result.code } : undefined, // 开发环境返回验证码
      };
    } catch (error) {
      ctx.logger.error('发送短信验证码失败:', error);
      ctx.body = {
        code: 500,
        message: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 验证短信验证码
   * @Description 验证短信验证码是否正确
   * @Router POST /api/v1/sms/verify
   * @Request body verifySmsRequest
   * @Response 200 verifySmsResponse
   */
  public async verify() {
    const { ctx, service } = this;
    const { phone, code, type = 'register' } = ctx.request.body;

    try {
      // 验证参数
      if (!phone || !code) {
        ctx.body = {
          code: 400,
          message: '手机号和验证码不能为空',
        };
        return;
      }

      // 验证验证码
      const result = await service.sms.verifyCode(phone, code, type);

      ctx.body = {
        code: 200,
        message: result.message,
      };
    } catch (error) {
      ctx.logger.error('验证短信验证码失败:', error);
      ctx.body = {
        code: 500,
        message: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 手机号注册
   * @Description 使用手机号和验证码注册
   * @Router POST /api/v1/sms/register
   * @Request body smsRegisterRequest
   * @Response 200 smsRegisterResponse
   */
  public async register() {
    const { ctx, service } = this;
    const { phone, code, password, username } = ctx.request.body;

    try {
      // 验证参数
      if (!phone || !code || !password || !username) {
        ctx.body = {
          code: 400,
          message: '手机号、验证码、密码和用户名不能为空',
        };
        return;
      }

      // 验证短信验证码
      await service.sms.verifyCode(phone, code, 'register');

      // 直接使用Sequelize创建模型
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(ctx.app.config.sequelize);
      
      const User = sequelize.define('User', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        username: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        phone: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        avatar: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        role: {
          type: Sequelize.ENUM('admin', 'user', 'moderator'),
          defaultValue: 'user',
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive', 'banned'),
          defaultValue: 'active',
        },
        last_login_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 检查用户是否已存在
      const existingUser = await User.findOne({
        where: {
          [Sequelize.Op.or]: [
            { username },
            { phone },
          ],
        },
      });

      if (existingUser) {
        ctx.body = {
          code: 400,
          message: '用户名或手机号已存在',
        };
        return;
      }

      // 密码加密
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const user = await User.create({
        username,
        email: `${phone}@sms.user`, // 使用手机号作为邮箱
        password: hashedPassword,
        phone,
      });

      ctx.body = {
        code: 200,
        message: '注册成功',
        data: {
          id: user.id,
          username: user.username,
          phone: user.phone,
        },
      };
    } catch (error) {
      ctx.logger.error('手机号注册失败:', error);
      ctx.body = {
        code: 500,
        message: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 手机号登录
   * @Description 使用手机号和验证码登录
   * @Router POST /api/v1/sms/login
   * @Request body smsLoginRequest
   * @Response 200 smsLoginResponse
   */
  public async login() {
    const { ctx, service } = this;
    const { phone, code } = ctx.request.body;

    try {
      // 验证参数
      if (!phone || !code) {
        ctx.body = {
          code: 400,
          message: '手机号和验证码不能为空',
        };
        return;
      }

      // 验证短信验证码
      await service.sms.verifyCode(phone, code, 'login');

      // 直接使用Sequelize创建模型
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(ctx.app.config.sequelize);
      
      const User = sequelize.define('User', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        username: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        phone: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        avatar: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        role: {
          type: Sequelize.ENUM('admin', 'user', 'moderator'),
          defaultValue: 'user',
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive', 'banned'),
          defaultValue: 'active',
        },
        last_login_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 查找用户
      const user = await User.findOne({
        where: { phone },
      });

      if (!user) {
        ctx.body = {
          code: 404,
          message: '用户不存在',
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
      }, ctx.app.config.jwt.secret, { expiresIn: ctx.app.config.jwt.expiresIn });

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
            phone: user.phone,
            role: user.role,
          },
        },
      };
    } catch (error) {
      ctx.logger.error('手机号登录失败:', error);
      ctx.body = {
        code: 500,
        message: (error as Error).message,
      };
    }
  }
}
