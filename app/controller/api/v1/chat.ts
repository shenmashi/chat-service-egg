import { Controller } from 'egg';

export default class ChatController extends Controller {
  /**
   * @Summary 获取会话列表
   * @Description 获取客服的会话列表
   * @Router GET /api/v1/chat/sessions
   * @Request header Authorization
   * @Response 200 chatSessionsResponse
   */
  public async getSessions() {
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

      // 使用app.model中的ChatSession模型
      const ChatSession = (app.model as any).ChatSession;
      const sessions = await ChatSession.findAll({
        where: {
          customer_service_id: decoded.id,
          status: ['active', 'ended']
        },
        order: [['updated_at', 'DESC']],
        limit: 50
      });

      ctx.body = {
        code: 200,
        message: '获取会话列表成功',
        data: {
          list: sessions,
          total: sessions.length
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
   * @Summary 获取会话消息
   * @Description 获取指定会话的消息列表
   * @Router GET /api/v1/chat/messages/:sessionId
   * @Request header Authorization
   * @Response 200 messagesResponse
   */
  public async getMessages() {
    const { ctx, app } = this;
    const { sessionId } = ctx.params;

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

      // 使用app.model中的ChatMessage模型
      const ChatMessage = (app.model as any).ChatMessage;
      const messages = await ChatMessage.findAll({
        where: {
          session_id: sessionId
        },
        order: [['created_at', 'ASC']]
      });

      ctx.body = {
        code: 200,
        message: '获取消息列表成功',
        data: messages
      };
    } catch (error) {
      ctx.logger.error('获取消息列表失败:', error);
      ctx.body = {
        code: 500,
        message: '获取消息列表失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取会话详情
   * @Description 获取指定会话的详细信息
   * @Router GET /api/v1/chat/sessions/:sessionId
   * @Request header Authorization
   * @Request path string sessionId 会话ID
   * @Response 200 chatSessionDetailResponse
   */
  public async getSessionDetail() {
    const { ctx, app } = this;
    const { sessionId } = ctx.params;

    try {
      // 使用app.model中的ChatSession模型
      const ChatSession = (app.model as any).ChatSession;
      const session = await ChatSession.findOne({
        where: { session_id: sessionId }
      });

      if (!session) {
        ctx.body = {
          code: 404,
          message: '会话不存在',
        };
        return;
      }

      ctx.body = {
        code: 200,
        message: '获取会话详情成功',
        data: session
      };
    } catch (error) {
      ctx.logger.error('获取会话详情失败:', error);
      ctx.body = {
        code: 500,
        message: '获取会话详情失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取会话消息历史
   * @Description 获取指定会话的消息历史
   * @Router GET /api/v1/chat/sessions/:sessionId/messages
   * @Request header Authorization
   * @Request path string sessionId 会话ID
   * @Request query number page 页码
   * @Request query number pageSize 每页数量
   * @Response 200 chatMessagesResponse
   */
  public async getSessionMessages() {
    const { ctx, app } = this;
    const { sessionId } = ctx.params;
    const { page = 1, pageSize = 50, onlyToday } = ctx.query as any;

    try {
      // 使用app.model中的ChatMessage模型
      const ChatMessage = (app.model as any).ChatMessage;
      const Op = app.Sequelize.Op;
      const where: any = { session_id: sessionId };

      // 仅查看当日消息
      if (onlyToday === '1' || onlyToday === 'true') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        where.created_at = { [Op.gte]: start, [Op.lt]: end };
      }

      // 先获取总数
      const total = await ChatMessage.count({ where });
      
      // 获取分页消息
      const messages = await ChatMessage.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(pageSize as string),
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string)
      });

      ctx.body = {
        code: 200,
        message: '获取消息历史成功',
        data: {
          list: messages.reverse(),
          page: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total: total,
          hasMore: messages.length === parseInt(pageSize as string) && (parseInt(page as string) * parseInt(pageSize as string)) < total
        }
      };
    } catch (error) {
      ctx.logger.error('获取消息历史失败:', error);
      ctx.body = {
        code: 500,
        message: '获取消息历史失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 结束会话
   * @Description 结束指定的聊天会话
   * @Router POST /api/v1/chat/sessions/:sessionId/end
   * @Request header Authorization
   * @Request path string sessionId 会话ID
   * @Request body endSessionRequest
   * @Response 200 endSessionResponse
   */
  public async endSession() {
    const { ctx, app } = this;
    const { sessionId } = ctx.params;
    const { notes } = ctx.request.body;

    try {
      // 从JWT token中获取用户信息
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

      // 使用app.model中的ChatSession和CustomerService模型
      const ChatSession = (app.model as any).ChatSession;
      const CustomerService = (app.model as any).CustomerService;

      // 先获取会话信息
      const session = await ChatSession.findOne({
        where: { 
          session_id: sessionId
        }
      });

      if (!session) {
        ctx.body = {
          code: 404,
          message: '会话不存在',
        };
        return;
      }

      // 验证权限：客服只能结束自己负责的会话，用户只能结束自己的会话
      const isCustomerService = decoded.role === 'customer_service';
      const isUser = decoded.role === 'user' || decoded.role === 'admin';
      
      if (isCustomerService && session.customer_service_id !== decoded.id) {
        ctx.body = {
          code: 403,
          message: '无权结束此会话',
        };
        return;
      }

      if (isUser && session.user_id !== decoded.id) {
        ctx.body = {
          code: 403,
          message: '无权结束此会话',
        };
        return;
      }

      // 记录结束前的状态（用于更新客服计数）
      const wasActive = session.status === 'active';
      
      // 更新会话状态
      await ChatSession.update(
        {
          status: 'ended',
          ended_at: new Date(),
          notes: notes || session.notes
        },
        { 
          where: { 
            session_id: sessionId
          } 
        }
      );

      // 如果是客服结束会话，更新客服当前聊天数（只有active状态的会话结束才减少计数）
      if (isCustomerService && wasActive && session.customer_service_id) {
        const customerService = await CustomerService.findByPk(session.customer_service_id);
        if (customerService && customerService.current_chats > 0) {
          await CustomerService.update(
            { current_chats: customerService.current_chats - 1 },
            { where: { id: session.customer_service_id } }
          );
          console.log(`客服 ${session.customer_service_id} 结束会话 ${sessionId}，当前聊天数更新为: ${customerService.current_chats - 1}`);
        }
      }

      // 通过 Socket.IO 广播会话结束事件
      const socketServer = (app as any).socketServer;
      if (socketServer && socketServer.io) {
        // 通知会话房间内的所有人
        socketServer.io.to(`session_${sessionId}`).emit('session_ended', {
          sessionId: sessionId,
          endedBy: {
            type: isCustomerService ? 'customer_service' : 'user',
            id: decoded.id
          },
          timestamp: new Date().toISOString()
        });

        // 如果会话有客服，也通知客服
        if (session.customer_service_id) {
          socketServer.io.to(`customer_service_${session.customer_service_id}`).emit('session_ended', {
            sessionId: sessionId,
            endedBy: {
              type: isCustomerService ? 'customer_service' : 'user',
              id: decoded.id
            },
            timestamp: new Date().toISOString()
          });
        }

        // 如果会话有用户，也通知用户
        if (session.user_id) {
          socketServer.io.to(`user_${session.user_id}`).emit('session_ended', {
            sessionId: sessionId,
            endedBy: {
              type: isCustomerService ? 'customer_service' : 'user',
              id: decoded.id
            },
            timestamp: new Date().toISOString()
          });
        }

        console.log(`会话 ${sessionId} 已结束，已通过 Socket.IO 广播`);
      }

      ctx.body = {
        code: 200,
        message: '会话结束成功'
      };
    } catch (error) {
      ctx.logger.error('结束会话失败:', error);
      ctx.body = {
        code: 500,
        message: '结束会话失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 转移会话
   * @Description 将会话转移给其他客服
   * @Router POST /api/v1/chat/sessions/:sessionId/transfer
   * @Request header Authorization
   * @Request path string sessionId 会话ID
   * @Request body transferSessionRequest
   * @Response 200 transferSessionResponse
   */
  public async transferSession() {
    const { ctx, app } = this;
    const { sessionId } = ctx.params;
    const { targetCustomerServiceId, reason } = ctx.request.body;

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

      // 使用app.model中的ChatSession和CustomerService模型
      const ChatSession = (app.model as any).ChatSession;
      const CustomerService = (app.model as any).CustomerService;

      // 检查目标客服是否存在且在线
      const targetCustomerService = await CustomerService.findByPk(targetCustomerServiceId);
      if (!targetCustomerService || targetCustomerService.status !== 'online') {
        ctx.body = {
          code: 400,
          message: '目标客服不存在或不在线',
        };
        return;
      }

      // 检查目标客服是否还能接受新会话
      if (targetCustomerService.current_chats >= targetCustomerService.max_concurrent_chats) {
        ctx.body = {
          code: 400,
          message: '目标客服已达到最大并发聊天数',
        };
        return;
      }

      // 更新会话
      await ChatSession.update(
        {
          customer_service_id: targetCustomerServiceId,
          status: 'transferred',
          notes: reason
        },
        { 
          where: { 
            session_id: sessionId,
            customer_service_id: decoded.id
          } 
        }
      );

      // 更新原客服当前聊天数
      const currentCustomerService = await CustomerService.findByPk(decoded.id);
      if (currentCustomerService && currentCustomerService.current_chats > 0) {
        await CustomerService.update(
          { current_chats: currentCustomerService.current_chats - 1 },
          { where: { id: decoded.id } }
        );
      }

      // 更新目标客服当前聊天数
      await CustomerService.update(
        { current_chats: targetCustomerService.current_chats + 1 },
        { where: { id: targetCustomerServiceId } }
      );

      ctx.body = {
        code: 200,
        message: '会话转移成功'
      };
    } catch (error) {
      ctx.logger.error('转移会话失败:', error);
      ctx.body = {
        code: 500,
        message: '转移会话失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取聊天统计
   * @Description 获取客服的聊天统计数据
   * @Router GET /api/v1/chat/statistics
   * @Request header Authorization
   * @Response 200 chatStatisticsResponse
   */
  public async getStatistics() {
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

      // 使用app.model中的ChatSession和ChatMessage模型
      const ChatSession = (app.model as any).ChatSession;
      const ChatMessage = (app.model as any).ChatMessage;

      // 获取统计数据
      const totalSessions = await ChatSession.count({
        where: { customer_service_id: decoded.id }
      });

      const activeSessions = await ChatSession.count({
        where: { 
          customer_service_id: decoded.id,
          status: 'active'
        }
      });

      const endedSessions = await ChatSession.count({
        where: { 
          customer_service_id: decoded.id,
          status: 'ended'
        }
      });

      const totalMessages = await ChatMessage.count({
        where: { 
          sender_type: 'customer_service',
          sender_id: decoded.id
        }
      });

      // 今日统计
      const Op = app.Sequelize.Op;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 先获取该客服的所有会话ID（复用，避免重复查询）
      const customerServiceSessions = await ChatSession.findAll({
        where: { customer_service_id: decoded.id },
        attributes: ['id', 'session_id']
      });
      const sessionIds = customerServiceSessions.map((s: any) => s.session_id);
      
      // 今日会话：统计今天有活动的会话（通过检查今天是否有消息来判断）
      let todaySessions = 0;
      if (sessionIds.length > 0) {
        // 查询今天有消息的所有会话ID，然后去重
        const sessionsWithMessages = await ChatMessage.findAll({
          where: { 
            session_id: {
              [Op.in]: sessionIds
            },
            created_at: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          },
          attributes: ['session_id'],
          raw: true
        });
        
        // 使用Set去重，统计今天有消息的不同会话数量
        const uniqueSessionIds = new Set(sessionsWithMessages.map((m: any) => m.session_id));
        todaySessions = uniqueSessionIds.size;
      }

      // 今日消息：统计当前客服参与的所有会话中的今日消息（包括用户和客服的消息）
      let todayMessages = 0;
      if (sessionIds.length > 0) {
        todayMessages = await ChatMessage.count({
          where: { 
            session_id: {
              [Op.in]: sessionIds
            },
            created_at: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        });
      }

      ctx.body = {
        code: 200,
        message: '获取聊天统计成功',
        data: {
          totalSessions,
          activeSessions,
          endedSessions,
          totalMessages,
          todaySessions,
          todayMessages
        }
      };
    } catch (error) {
      ctx.logger.error('获取聊天统计失败:', error);
      ctx.body = {
        code: 500,
        message: '获取聊天统计失败',
        error: (error as Error).message,
      };
    }
  }
}
