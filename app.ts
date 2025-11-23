import { Application } from 'egg';

export default class AppBootHook {
  private readonly app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  configWillLoad() {
    // 此时 config 文件已经被读取并合并，但是还并未生效
    // 这是应用层修改配置的最后时机
    // 注意：此函数只支持同步调用

    // 例如：参数中的密码是加密的，在此处进行解密
    // this.app.config.mysql.password = decrypt(this.app.config.mysql.password);
    // 例如：处理 redis 连接地址
    // this.app.config.redis.url = formatUrl(this.app.config.redis.url);
  }

  configDidLoad() {
    // 配置加载完成
    this.app.logger.info('配置加载完成');
  }

  async didLoad() {
    // 文件加载完成
    this.app.logger.info('文件加载完成');
  }

  async willReady() {
    // 插件启动完毕
    this.app.logger.info('插件启动完毕');
    
    // 手动初始化Sequelize和模型
    try {
      const { Sequelize } = require('sequelize');
      (this.app as any).Sequelize = Sequelize;
      
      // 确保app.model存在
      if (!this.app.model) {
        (this.app as any).model = {};
      }
      
      // 创建Sequelize实例
      const sequelize = new Sequelize(this.app.config.sequelize);
      (this.app.model as any).sequelize = sequelize;
      
      // 手动定义模型
      const { STRING, INTEGER, TEXT, DATE, ENUM, BOOLEAN, BIGINT, JSON } = Sequelize;
      
      // 定义User模型
      const User = sequelize.define('User', {
        id: {
          type: INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        username: {
          type: STRING(50),
          allowNull: false,
          unique: true,
          comment: '用户名',
        },
        email: {
          type: STRING(100),
          allowNull: false,
          unique: true,
          comment: '邮箱',
        },
        password: {
          type: STRING(255),
          allowNull: false,
          comment: '密码',
        },
        phone: {
          type: STRING(20),
          allowNull: true,
          comment: '手机号',
        },
        avatar: {
          type: STRING(255),
          allowNull: true,
          comment: '头像',
        },
        role: {
          type: ENUM('admin', 'user', 'moderator'),
          defaultValue: 'user',
          comment: '角色',
        },
        status: {
          type: ENUM('active', 'inactive', 'banned'),
          defaultValue: 'active',
          comment: '状态',
        },
        last_login_at: {
          type: DATE,
          allowNull: true,
          comment: '最后登录时间',
        },
      }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: false,
      });
      
      // 定义Article模型
      const Article = sequelize.define('Article', {
        id: {
          type: INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        title: {
          type: STRING(200),
          allowNull: false,
          comment: '标题',
        },
        content: {
          type: TEXT,
          allowNull: false,
          comment: '内容',
        },
        summary: {
          type: TEXT,
          allowNull: true,
          comment: '摘要',
        },
        cover_image: {
          type: STRING(255),
          allowNull: true,
          comment: '封面图片',
        },
        status: {
          type: ENUM('draft', 'published', 'archived'),
          defaultValue: 'draft',
          comment: '状态',
        },
        view_count: {
          type: INTEGER,
          defaultValue: 0,
          comment: '浏览次数',
        },
        like_count: {
          type: INTEGER,
          defaultValue: 0,
          comment: '点赞次数',
        },
        comment_count: {
          type: INTEGER,
          defaultValue: 0,
          comment: '评论次数',
        },
        user_id: {
          type: INTEGER,
          allowNull: false,
          comment: '用户ID',
        },
        published_at: {
          type: DATE,
          allowNull: true,
          comment: '发布时间',
        },
      }, {
        tableName: 'articles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: false,
      });

      // 定义CustomerService模型
      const CustomerService = sequelize.define('CustomerService', {
        id: {
          type: INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: '客服ID',
        },
        username: {
          type: STRING(50),
          allowNull: false,
          unique: true,
          comment: '客服用户名',
        },
        email: {
          type: STRING(100),
          allowNull: false,
          unique: true,
          comment: '客服邮箱',
        },
        password: {
          type: STRING(255),
          allowNull: false,
          comment: '密码',
        },
        avatar: {
          type: STRING(255),
          allowNull: true,
          comment: '头像',
        },
        status: {
          type: ENUM('online', 'offline', 'busy'),
          defaultValue: 'offline',
          comment: '在线状态',
        },
        max_concurrent_chats: {
          type: INTEGER,
          defaultValue: 100,
          comment: '最大并发聊天数',
        },
        current_chats: {
          type: INTEGER,
          defaultValue: 0,
          comment: '当前聊天数',
        },
      }, {
        tableName: 'customer_services',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: false,
      });

      // 定义ChatSession模型
      const ChatSession = sequelize.define('ChatSession', {
        id: {
          type: INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: '会话ID',
        },
        session_id: {
          type: STRING(100),
          allowNull: false,
          unique: true,
          comment: '会话唯一标识',
        },
        customer_service_id: {
          type: INTEGER,
          allowNull: true,
          comment: '客服ID',
        },
        user_id: {
          type: INTEGER,
          allowNull: true,
          comment: '用户ID',
        },
        visitor_id: {
          type: STRING(100),
          allowNull: true,
          comment: '访客ID（未登录用户）',
        },
        visitor_name: {
          type: STRING(100),
          allowNull: true,
          comment: '访客姓名',
        },
        visitor_email: {
          type: STRING(100),
          allowNull: true,
          comment: '访客邮箱',
        },
        status: {
          type: ENUM('waiting', 'active', 'ended', 'transferred'),
          defaultValue: 'waiting',
          comment: '会话状态',
        },
        priority: {
          type: ENUM('low', 'normal', 'high', 'urgent'),
          defaultValue: 'normal',
          comment: '优先级',
        },
        tags: {
          type: JSON,
          allowNull: true,
          comment: '标签',
        },
        notes: {
          type: TEXT,
          allowNull: true,
          comment: '备注',
        },
        started_at: {
          type: DATE,
          allowNull: true,
          comment: '开始时间',
        },
        ended_at: {
          type: DATE,
          allowNull: true,
          comment: '结束时间',
        },
      }, {
        tableName: 'chat_sessions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: false,
      });

      // 定义ChatMessage模型
      const ChatMessage = sequelize.define('ChatMessage', {
        id: {
          type: INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: '消息ID',
        },
        session_id: {
          type: STRING(100),
          allowNull: false,
          comment: '会话ID',
        },
        sender_type: {
          type: ENUM('customer_service', 'user', 'visitor', 'system'),
          allowNull: false,
          comment: '发送者类型',
        },
        sender_id: {
          type: INTEGER,
          allowNull: true,
          comment: '发送者ID',
        },
        sender_name: {
          type: STRING(100),
          allowNull: false,
          comment: '发送者姓名',
        },
        message_type: {
          type: ENUM('text', 'image', 'file', 'emoji', 'system'),
          defaultValue: 'text',
          comment: '消息类型',
        },
        content: {
          type: TEXT,
          allowNull: true,
          comment: '消息内容',
        },
        file_url: {
          type: STRING(500),
          allowNull: true,
          comment: '文件URL',
        },
        file_name: {
          type: STRING(255),
          allowNull: true,
          comment: '文件名',
        },
        file_size: {
          type: BIGINT,
          allowNull: true,
          comment: '文件大小',
        },
        file_type: {
          type: STRING(100),
          allowNull: true,
          comment: '文件类型',
        },
        is_read: {
          type: BOOLEAN,
          defaultValue: false,
          comment: '是否已读',
        },
        read_at: {
          type: DATE,
          allowNull: true,
          comment: '阅读时间',
        },
      }, {
        tableName: 'chat_messages',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: false,
      });
      
      // 定义PendingNotification模型
      const PendingNotification = sequelize.define('PendingNotification', {
        id: {
          type: INTEGER,
          primaryKey: true,
          autoIncrement: true,
          comment: '通知ID',
        },
        event_type: {
          type: STRING(100),
          allowNull: false,
          comment: '事件类型',
        },
        target_type: {
          type: ENUM('user', 'customer_service'),
          allowNull: false,
          comment: '目标用户类型',
        },
        target_id: {
          type: INTEGER,
          allowNull: false,
          comment: '目标用户ID',
        },
        payload: {
          type: JSON,
          allowNull: false,
          comment: '消息内容（JSON格式）',
        },
        is_delivered: {
          type: BOOLEAN,
          defaultValue: false,
          comment: '是否已送达',
        },
        delivered_at: {
          type: DATE,
          allowNull: true,
          comment: '送达时间',
        },
      }, {
        tableName: 'pending_notifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        paranoid: false,
      });
      
      (this.app.model as any).User = User;
      (this.app.model as any).Article = Article;
      (this.app.model as any).CustomerService = CustomerService;
      (this.app.model as any).ChatSession = ChatSession;
      (this.app.model as any).ChatMessage = ChatMessage;
      (this.app.model as any).PendingNotification = PendingNotification;
      
      this.app.logger.info('Sequelize和模型手动初始化成功');
      this.app.logger.info('可用模型:', Object.keys(this.app.model || {}));
    } catch (error) {
      this.app.logger.error('Sequelize和模型手动初始化失败:', error);
    }
  }

  async didReady() {
    // Worker 准备就绪
    this.app.logger.info('Worker 准备就绪');
  }

  async serverDidReady() {
    // 应用启动完成
    this.app.logger.info('应用启动完成');
    console.log('=== serverDidReady 被调用 ===');
    
    // 启动Socket.IO服务器（确保HTTP服务器完全准备好）
    try {
      console.log('=== 启动Socket.IO服务器 ===');
      const socketServer = require('./app/extend/socket').default(this.app);
      console.log('Socket.IO服务器启动成功:', !!socketServer);
      this.app.logger.info('Socket.IO服务器初始化成功');
      
      (this.app as any).socketServer = socketServer;
    } catch (error) {
      console.error('Socket.IO服务器启动失败:', error);
      this.app.logger.error('Socket.IO服务器启动失败:', error);
    }
  }

  async beforeClose() {
    // 应用即将关闭
    this.app.logger.info('应用即将关闭');
  }
}