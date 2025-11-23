import { Service } from 'egg';

export default class SmsService extends Service {
  /**
   * 生成验证码
   * @param length 验证码长度
   */
  generateCode(length: number = 6): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  /**
   * 发送短信验证码
   * @param phone 手机号
   * @param type 验证码类型
   */
  async sendCode(phone: string, type: 'register' | 'login' | 'reset_password' | 'bind_phone' = 'register') {
    const { ctx, app } = this;

    try {
      // 验证手机号格式
      if (!this.isValidPhone(phone)) {
        throw new Error('手机号格式不正确');
      }

      // 检查发送频率限制（1分钟内只能发送一次）
      const recentCode = await this.getRecentCode(phone);
      if (recentCode) {
        throw new Error('验证码发送过于频繁，请1分钟后再试');
      }

      // 生成验证码
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

      // 直接使用Sequelize创建模型
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);
      
      const SmsCode = sequelize.define('SmsCode', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        phone: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        code: {
          type: Sequelize.STRING(10),
          allowNull: false,
        },
        type: {
          type: Sequelize.ENUM('register', 'login', 'reset_password', 'bind_phone'),
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('pending', 'used', 'expired'),
          defaultValue: 'pending',
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        used_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true,
        },
      }, {
        tableName: 'sms_codes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 保存验证码到数据库
      await SmsCode.create({
        phone,
        code,
        type,
        expires_at: expiresAt,
        ip_address: ctx.request.ip,
      });

      // 在开发环境中直接返回验证码，生产环境应该调用真实的短信服务
      if (app.config.env === 'local' || app.config.env === 'unittest') {
        ctx.logger.info(`SMS Code for ${phone}: ${code}`);
        return {
          success: true,
          message: '验证码发送成功（开发环境）',
          code: code, // 开发环境返回验证码
        };
      }

      // 生产环境调用真实短信服务
      await this.callSmsService(phone, code, type);

      return {
        success: true,
        message: '验证码发送成功',
      };
    } catch (error) {
      ctx.logger.error('发送短信验证码失败:', error);
      throw error;
    }
  }

  /**
   * 验证短信验证码
   * @param phone 手机号
   * @param code 验证码
   * @param type 验证码类型
   */
  async verifyCode(phone: string, code: string, type: 'register' | 'login' | 'reset_password' | 'bind_phone' = 'register') {
    const { ctx, app } = this;

    try {
      // 直接使用Sequelize创建模型
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);
      
      const SmsCode = sequelize.define('SmsCode', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        phone: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        code: {
          type: Sequelize.STRING(10),
          allowNull: false,
        },
        type: {
          type: Sequelize.ENUM('register', 'login', 'reset_password', 'bind_phone'),
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('pending', 'used', 'expired'),
          defaultValue: 'pending',
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        used_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true,
        },
      }, {
        tableName: 'sms_codes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 查找有效的验证码
      const smsCode = await SmsCode.findOne({
        where: {
          phone,
          code,
          type,
          status: 'pending',
          expires_at: {
            [Sequelize.Op.gt]: new Date(),
          },
        },
        order: [['created_at', 'DESC']],
      });

      if (!smsCode) {
        throw new Error('验证码无效或已过期');
      }

      // 标记验证码为已使用
      await smsCode.update({
        status: 'used',
        used_at: new Date(),
      });

      return {
        success: true,
        message: '验证码验证成功',
      };
    } catch (error) {
      ctx.logger.error('验证短信验证码失败:', error);
      throw error;
    }
  }

  /**
   * 获取最近的验证码
   * @param phone 手机号
   */
  private async getRecentCode(phone: string) {
    const { app } = this;

    const { Sequelize } = require('sequelize');
    const sequelize = new Sequelize(app.config.sequelize);
    
    const SmsCode = sequelize.define('SmsCode', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('register', 'login', 'reset_password', 'bind_phone'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'used', 'expired'),
        defaultValue: 'pending',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
    }, {
      tableName: 'sms_codes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });

    return await SmsCode.findOne({
      where: {
        phone,
        status: 'pending',
        created_at: {
          [Sequelize.Op.gte]: new Date(Date.now() - 60 * 1000), // 1分钟内
        },
      },
    });
  }

  /**
   * 验证手机号格式
   * @param phone 手机号
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 调用真实短信服务（生产环境）
   * @param phone 手机号
   * @param code 验证码
   * @param type 验证码类型
   */
  private async callSmsService(phone: string, code: string, type: string) {
    const { ctx, app } = this;

    // 这里应该调用真实的短信服务，比如阿里云短信、腾讯云短信等
    // 示例：使用阿里云短信服务
    try {
      // const Core = require('@alicloud/pop-core');
      // const client = new Core({
      //   accessKeyId: app.config.sms.accessKeyId,
      //   accessKeySecret: app.config.sms.accessKeySecret,
      //   endpoint: 'https://dysmsapi.aliyuncs.com',
      //   apiVersion: '2017-05-25'
      // });

      // const params = {
      //   PhoneNumbers: phone,
      //   SignName: app.config.sms.signName,
      //   TemplateCode: app.config.sms.templateCode,
      //   TemplateParam: JSON.stringify({ code })
      // };

      // const result = await client.request('SendSms', params, { method: 'POST' });
      
      ctx.logger.info(`SMS sent to ${phone}: ${code}`);
      
      // 模拟短信发送成功
      return { success: true };
    } catch (error) {
      ctx.logger.error('调用短信服务失败:', error);
      throw new Error('短信发送失败');
    }
  }
}
