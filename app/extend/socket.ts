import { Application } from 'egg';
import { Server as SocketIOServer, Socket } from 'socket.io';

// 扩展Socket类型定义
interface CustomSocket extends Socket {
  customerServiceId?: number;
  userId?: number;
  visitorId?: string;
  sessionId?: string;
  userType?: 'customer_service' | 'user' | 'visitor';
  username?: string;
}

export default (app: Application) => {
  console.log('开始初始化Socket.IO服务器...');

  // 创建Socket.IO服务器，使用Egg.js的HTTP服务器
  let httpServer = (app as any).httpServer || (app as any).server;
  console.log('HTTP服务器实例:', !!httpServer);
  console.log('HTTP服务器类型:', typeof httpServer);
  console.log('HTTP服务器构造函数:', httpServer?.constructor?.name);

  // 如果无法获取HTTP服务器，尝试其他方法
  if (!httpServer) {
    console.log('尝试从app获取服务器实例...');
    httpServer = (app as any).server;
    
    if (!httpServer) {
      console.log('尝试从app.httpServer获取...');
      httpServer = (app as any).httpServer;
    }
    
    if (!httpServer) {
      console.error('无法获取HTTP服务器实例');
      return null;
    }
  }

  console.log('成功获取HTTP服务器实例，创建Socket.IO服务器...');

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH' ],
      credentials: true,
    },
    transports: [ 'websocket', 'polling' ],
    path: '/socket.io',
    allowEIO3: true, // 允许Engine.IO v3客户端连接
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 验证Socket.IO服务器是否正确启动
  io.on('connection', (socket) => {
    console.log('=== Socket.IO连接成功 ===');
    console.log('Socket ID:', socket.id);
  });

  // 将io实例挂载到app上
  (app as any).io = io;

  console.log('Socket.IO服务器初始化成功，路径: /socket.io');
  console.log('Socket.IO服务器实例:', !!io);

  // 辅助函数：发送通知（如果目标不在线则存储）
  const sendNotificationOrStore = async (
    io: SocketIOServer,
    eventType: string,
    targetType: 'user' | 'customer_service',
    targetId: number,
    payload: any
  ) => {
    const PendingNotification = (app.model as any).PendingNotification;
    const room = targetType === 'user' ? `user_${targetId}` : `customer_service_${targetId}`;
    
    // 检查目标是否在线
    const socketsInRoom = await io.in(room).fetchSockets();
    const isOnline = socketsInRoom.length > 0;
    
    if (isOnline) {
      // 在线，直接发送
      io.to(room).emit(eventType, payload);
      console.log(`✅ 通知已送达 ${targetType} ${targetId}: ${eventType}`);
      return true;
    } else {
      // 不在线，存储到数据库
      try {
        await PendingNotification.create({
          event_type: eventType,
          target_type: targetType,
          target_id: targetId,
          payload: payload,
          is_delivered: false,
        });
        console.log(`💾 通知已存储（${targetType} ${targetId} 不在线）: ${eventType}`);
        return false;
      } catch (error) {
        console.error('存储未送达通知失败:', error);
        return false;
      }
    }
  };

  // 辅助函数：查询并推送等待会话给客服
  // 优化：手动查询用户信息，避免 Sequelize 关联错误；使用缓存避免重复推送
  const pushWaitingSessionsToCustomerService = async (
    io: SocketIOServer,
    socket: CustomSocket,
    customerServiceId: number,
    lastPushedSessionIds: Set<string> = new Set() // 记录上次已推送的会话ID，避免重复推送
  ) => {
    try {
      // 检查socket是否仍然连接，避免无效操作
      if (!socket || !socket.connected) {
        console.log(`⏹️ [推送等待会话] Socket已断开，取消推送 (客服ID: ${customerServiceId})`);
        return 0;
      }

      const ChatSession = (app.model as any).ChatSession;
      const UserModel = (app.model as any).User;
      const { Op } = require('sequelize');
      
      // 查询当前客服负责的等待会话（仅显示分配给该客服的）
      const waitingSessions = await ChatSession.findAll({
        where: {
          status: 'waiting',
          customer_service_id: customerServiceId,
        },
        attributes: ['session_id', 'user_id', 'customer_service_id', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 50, // 限制最多50个，避免一次性查询太多
      });

      console.log(`🔍 [推送等待会话] 查询到 ${waitingSessions.length} 个等待会话 (客服ID: ${customerServiceId})`);
      if (waitingSessions.length > 0) {
        console.log(`🔍 [推送等待会话] 会话列表:`, waitingSessions.map((s: any) => ({
          sessionId: s.session_id,
          userId: s.user_id,
          csId: s.customer_service_id
        })));
      }

      if (waitingSessions.length === 0) {
        console.log(`📭 [推送等待会话] 未找到等待会话 (客服ID: ${customerServiceId})`);
        return 0;
      }

      // 获取所有需要查询的用户ID（去重）
      const userIds = [...new Set(waitingSessions.map((s: any) => s.user_id).filter(Boolean))];
      
      // 批量查询用户信息，避免N+1查询
      const users = await UserModel.findAll({
        where: { id: { [Op.in]: userIds } },
        // 某些库不存在 real_name 列，避免查询失败，只取通用列
        attributes: ['id', 'username', 'email', 'avatar'],
      });
      
      const userMap = new Map(users.map((u: any) => [u.id, u]));

      // 只推送新的会话（不在上次已推送列表中的）
      let pushedCount = 0;
      let skippedCount = 0;
      const currentPushedIds = new Set<string>();
      
      for (const session of waitingSessions) {
        const sessionId = session.session_id;
        
        // 如果该会话ID上次已推送过，跳过（避免重复）
        if (lastPushedSessionIds.has(sessionId)) {
          skippedCount++;
          console.log(`⏭️ [推送等待会话] 跳过已推送的会话: ${sessionId}`);
          continue;
        }

        const user: any = userMap.get(session.user_id);
        const waitingData = {
          sessionId: sessionId,
          userId: session.user_id,
          customerServiceId: session.customer_service_id,
          username: user?.username || `用户${session.user_id}`,
          email: user?.email,
          avatar: user?.avatar,
          priority: 'normal',
          timestamp: session.created_at?.toISOString() || new Date().toISOString(),
        };
        
        // 再次检查socket连接状态
        if (socket.connected) {
          socket.emit('new_waiting_user', waitingData);
          currentPushedIds.add(sessionId);
          pushedCount++;
          console.log(`📤 [推送等待会话] 推送会话 ${sessionId} 给客服 ${customerServiceId} (用户: ${session.user_id}, 数据:`, waitingData, ')');
        } else {
          console.log(`⚠️ [推送等待会话] Socket已断开，无法推送会话 ${sessionId}`);
        }
      }

      if (pushedCount > 0) {
        console.log(`✅ [推送等待会话] 已推送 ${pushedCount} 个新等待会话给客服 ${customerServiceId}，跳过 ${skippedCount} 个已推送的`);
      } else if (skippedCount > 0) {
        console.log(`ℹ️ [推送等待会话] 所有会话都已推送过，跳过 ${skippedCount} 个`);
      }
      
      // 更新已推送的会话ID集合（合并到lastPushedSessionIds中）
      currentPushedIds.forEach(id => lastPushedSessionIds.add(id));
      
      return pushedCount;
    } catch (error) {
      console.error(`[推送等待会话] 查询并推送失败 (客服ID: ${customerServiceId}):`, error);
      return 0;
    }
  };

  // 辅助函数：发送并加载未送达通知
  const loadAndSendPendingNotifications = async (
    io: SocketIOServer,
    socket: CustomSocket,
    targetType: 'user' | 'customer_service',
    targetId: number
  ) => {
    const PendingNotification = (app.model as any).PendingNotification;
    
    try {
      // 查询未送达的通知
      const pendingNotifications = await PendingNotification.findAll({
        where: {
          target_type: targetType,
          target_id: targetId,
          is_delivered: false,
        },
        order: [['created_at', 'ASC']],
        limit: 100, // 限制每次最多发送100条
      });

      if (pendingNotifications.length > 0) {
        console.log(`📬 发现 ${pendingNotifications.length} 条未送达通知，开始发送给 ${targetType} ${targetId}`);
        
        // 逐个发送通知
        for (const notification of pendingNotifications) {
          try {
            socket.emit(notification.event_type, notification.payload);
            console.log(`✅ 已发送未送达通知: ${notification.event_type}`);
            
            // 标记为已送达
            await notification.update({
              is_delivered: true,
              delivered_at: new Date(),
            });
          } catch (error) {
            console.error(`发送未送达通知失败 (ID: ${notification.id}):`, error);
          }
        }
        
        console.log(`✅ 所有未送达通知已发送给 ${targetType} ${targetId}`);
      }
    } catch (error) {
      console.error('加载未送达通知失败:', error);
    }
  };

  // Socket.IO连接处理
  io.on('connection', (socket: CustomSocket) => {
    console.log('=== 用户连接 ===');
    console.log('Socket ID:', socket.id);
    console.log('连接来源:', socket.handshake.address);
    console.log('连接头信息:', socket.handshake.headers);
    console.log('认证信息:', socket.handshake.auth);
    console.log('Socket事件监听器已注册');


    // 处理ping测试
    socket.on('ping', data => {
      console.log('收到ping:', data);
      socket.emit('pong', { timestamp: Date.now(), original: data });
    });

    // 客服或用户加入指定会话房间
    socket.on('join_session', async data => {
      try {
        const { sessionId } = data || {};
        if (!sessionId) {
          socket.emit('error', { message: '会话ID不能为空' });
          return;
        }
        
        // 验证用户是否有权限加入此会话
        if (socket.userType === 'customer_service') {
          // 客服可以加入任何会话房间
          socket.join(`session_${sessionId}`);
          socket.emit('session_joined', { sessionId });
          console.log(`客服 ${socket.customerServiceId} 加入会话房间: session_${sessionId}`);
        } else if (socket.userType === 'user') {
          // 用户只能加入自己的会话
          const ChatSession = (app.model as any).ChatSession;
          const session = await ChatSession.findOne({
            where: { 
              session_id: sessionId,
              user_id: socket.userId 
            }
          });
          
          if (!session) {
            socket.emit('error', { message: '无权限加入此会话' });
            return;
          }
          
          socket.join(`session_${sessionId}`);
          socket.emit('session_joined', { sessionId });
          console.log(`用户 ${socket.userId} 加入会话房间: session_${sessionId}`);
        } else {
          socket.emit('error', { message: '用户类型不支持' });
          return;
        }
      } catch (e) {
        console.error('加入会话房间失败:', e);
        socket.emit('error', { message: '加入会话失败', error: e instanceof Error ? e.message : String(e) });
      }
    });

    // 用户登录/重连
    socket.on('user_login', async data => {
      try {
        console.log('📤 收到用户登录请求:', data);
        const { token } = data;
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, app.config.jwt.secret);

        console.log('🔍 解码用户token:', decoded);

        // 允许所有角色作为"用户侧"登录聊天（便于测试和不同角色使用）
        // 不再限制角色，只要token有效即可

        socket.userId = decoded.id;
        socket.userType = 'user';
        socket.username = decoded.username;

        // 加入用户房间，用于接收个人通知
        socket.join(`user_${decoded.id}`);
        // 加入用户总房间，用于接收全局通知
        socket.join('users');

        // 检查用户是否有活跃的会话需要重新加入房间
        const ChatSession = (app.model as any).ChatSession;
        const activeSession = await ChatSession.findOne({
          where: {
            user_id: decoded.id,
            status: [ 'waiting', 'active' ],
          },
          order: [ [ 'created_at', 'DESC' ] ],
        });

        if (activeSession) {
          console.log('用户重连，重新加入会话房间:', activeSession.session_id);
          socket.join(`session_${activeSession.session_id}`);
          socket.join(`user_${decoded.id}`);
          socket.sessionId = activeSession.session_id;

          // 获取会话的最新消息（最近10条）
          const ChatMessage = (app.model as any).ChatMessage;
          const recentMessages = await ChatMessage.findAll({
            where: { session_id: activeSession.session_id },
            order: [['created_at', 'DESC']],
            limit: 10
          });

          // 通知用户当前会话状态和最新消息
          socket.emit('session_reconnected', {
            sessionId: activeSession.session_id,
            status: activeSession.status,
            userId: decoded.id,
            recentMessages: recentMessages.reverse() // 按时间正序排列
          });
        }

        socket.emit('user_login_success', {
          message: '用户登录成功',
          userId: decoded.id,
          hasActiveSession: !!activeSession,
        });

        // 发送用户在线状态给所有客服
        socket.to('customer_services').emit('user_online', {
          userId: decoded.id,
          username: socket.username,
          timestamp: new Date().toISOString()
        });

        // 加载并发送未送达的通知
        await loadAndSendPendingNotifications(io, socket, 'user', decoded.id);

        console.log(`用户 ${decoded.id} 登录成功`);
        console.log('✅ 已发送 user_login_success 事件');
      } catch (error) {
        console.error('用户登录错误:', error);
        socket.emit('user_login_error', {
          message: '用户登录失败',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // 客服登录
    socket.on('customer_service_login', async data => {
      try {
        console.log('📤 收到客服登录请求:', data);
        console.log('🔍 客服token:', data.token ? data.token.substring(0, 50) + '...' : 'none');

        const { token } = data;
        // 验证JWT token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, app.config.jwt.secret);

        console.log('🔍 解码客服token成功:', decoded);

        if (decoded.role !== 'customer_service') {
          socket.emit('login_error', { message: '无效的客服角色' });
          return;
        }

        // 更新客服在线状态
        const CustomerService = (app.model as any).CustomerService;
        await CustomerService.update(
          { status: 'online' },
          { where: { id: decoded.id } }
        );

        socket.join(`customer_service_${decoded.id}`);
        socket.join('customer_services'); // 加入客服房间
        socket.customerServiceId = decoded.id;
        socket.userType = 'customer_service';
        socket.username = decoded.username;

        // 获取客服信息
        const customerService = await CustomerService.findByPk(decoded.id);

        socket.emit('login_success', {
          message: '客服登录成功',
          customerServiceId: decoded.id,
          customerService,
        });

        // 通知其他客服有新客服上线（使用辅助函数，不在线则存储）
        const otherCustomerServices = await io.in('customer_services').fetchSockets();
        for (const otherSocket of otherCustomerServices) {
          const otherCsId = (otherSocket as any).customerServiceId;
          if (otherCsId && otherCsId !== decoded.id) {
            await sendNotificationOrStore(io, 'customer_service_online', 'customer_service', otherCsId, {
              customerServiceId: decoded.id,
              username: decoded.username,
            });
          }
        }

        // 通知所有用户有客服上线（使用辅助函数，不在线则存储）
        const UserModel = (app.model as any).User;
        const allUsers = await UserModel.findAll({ attributes: ['id'] });
        for (const user of allUsers) {
          await sendNotificationOrStore(io, 'customer_service_online', 'user', user.id, {
            customerServiceId: decoded.id,
            username: decoded.username,
          });
        }

        // 通知所有客服有用户上线（这个应该是错误的，客服登录不应该通知所有客服有用户上线，暂时保留）
        // io.to('customer_services').emit('user_online', {
        //   userId: decoded.id,
        //   username: decoded.username,
        // });

        // 加载并发送未送达的通知
        await loadAndSendPendingNotifications(io, socket, 'customer_service', decoded.id);

        // 为客服Socket存储已推送的会话ID集合（用于去重，避免重复推送）
        // 登录时清空缓存，确保能推送所有等待会话
        const socketAny: any = socket;
        socketAny._pushedSessionIds = new Set<string>(); // 每次登录都清空，重新推送
        const pushedSessionIds: Set<string> = socketAny._pushedSessionIds;

        console.log(`🔍 [客服登录] 客服 ${decoded.id} 登录，开始查询并推送等待会话`);
        
        // 查询并推送等待会话（登录时立即推送）
        const pushedCount = await pushWaitingSessionsToCustomerService(io, socket, decoded.id, pushedSessionIds);
        
        console.log(`📊 [客服登录] 客服 ${decoded.id} 登录完成，推送了 ${pushedCount} 个等待会话`);

        // 为客服Socket添加定期查询等待会话的机制（每60秒查询一次，避免过于频繁）
        // 确保即使客服一直在线，也能收到新的等待会话
        let checkWaitingInterval: NodeJS.Timeout | null = null;
        let isChecking = false; // 防抖标志，避免重叠查询
        
        const startPeriodicCheck = () => {
          if (checkWaitingInterval) {
            clearInterval(checkWaitingInterval);
          }
          
          checkWaitingInterval = setInterval(async () => {
            // 防止重叠查询
            if (isChecking) {
              console.log(`⏸️ [定期检查] 客服 ${decoded.id} 上一次查询尚未完成，跳过本次`);
              return;
            }

            // 检查客服是否仍然在线
            if (!socket.connected || socket.customerServiceId !== decoded.id) {
              if (checkWaitingInterval) {
                clearInterval(checkWaitingInterval);
                checkWaitingInterval = null;
              }
              console.log(`⏹️ [定期检查] 客服 ${decoded.id} 已断开，停止定期查询`);
              return;
            }

            try {
              isChecking = true;
              console.log(`🔄 [定期检查] 客服 ${decoded.id} 在线，查询等待会话`);
              await pushWaitingSessionsToCustomerService(io, socket, decoded.id, pushedSessionIds);
            } catch (error) {
              console.error(`[定期检查] 查询失败 (客服ID: ${decoded.id}):`, error);
            } finally {
              isChecking = false;
            }
          }, 60000); // 改为每60秒查询一次，减少资源消耗
        };

        // 启动定期查询
        startPeriodicCheck();

        // 当Socket断开时，清除定时器和缓存
        const cleanup = () => {
          if (checkWaitingInterval) {
            clearInterval(checkWaitingInterval);
            checkWaitingInterval = null;
          }
          const socketAny = socket as any;
          if (socketAny._pushedSessionIds) {
            socketAny._pushedSessionIds.clear();
          }
          console.log(`⏹️ [定期检查] 客服 ${decoded.id} Socket断开，清除定期查询和缓存`);
        };
        
        socket.once('disconnect', cleanup);

        console.log(`客服 ${decoded.username} 登录成功`);
        console.log('✅ 已发送 login_success 事件');
      } catch (error) {
        console.error('客服登录错误:', error);
        socket.emit('login_error', { message: '登录失败', error: error instanceof Error ? error.message : String(error) });
      }
    });

    // 用户开始聊天（使用用户ID_客服ID格式的session_id）
    socket.on('start_chat', async (data, ack) => {
      try {
        console.log('📤 收到用户开始聊天请求:', data);
        const { userId, customerServiceId } = data;

        if (!userId) {
          socket.emit('error', { message: '用户ID不能为空' });
          return;
        }

        if (socket.userType !== 'user') {
          socket.emit('error', { message: '只有用户可以开始聊天' });
          return;
        }

        const ChatSession = (app.model as any).ChatSession;
        const { Op } = require('sequelize');

        // 如果指定了客服ID，使用用户ID_客服ID格式
        if (customerServiceId) {
          const sessionId = `${userId}_${customerServiceId}`;
          console.log('使用用户ID_客服ID格式的session_id:', sessionId);
          
          // 检查是否已存在该会话
          let session = await ChatSession.findOne({
            where: { session_id: sessionId }
          });

          if (session) {
            // 如果会话存在且已结束，重置为waiting等待客服接受
            if (session.status === 'ended') {
              await session.update({ 
                status: 'waiting',
                customer_service_id: customerServiceId,
                updated_at: new Date()
              });
              console.log('复用已结束会话，重置为waiting:', sessionId);
            } else if (session.status === 'active') {
              // 如果会话是active状态，保持不变
              await session.update({ 
                updated_at: new Date()
              });
              console.log('复用现有active会话:', sessionId);
            } else {
              // waiting状态，保持不变
              console.log('会话已在等待中:', sessionId);
            }
          } else {
            // 如果会话不存在，创建新会话，状态为waiting（等待客服接受）
            session = await ChatSession.create({
              session_id: sessionId,
              user_id: userId,
              customer_service_id: customerServiceId,
              status: 'waiting',  // 改为waiting，等待客服接受
              created_at: new Date(),
            });
            console.log('创建新会话（waiting状态）:', sessionId);
          }

          socket.sessionId = sessionId;
          socket.userId = userId;
          socket.userType = 'user';
          socket.join(`session_${sessionId}`);
          socket.join(`user_${userId}`);

          const sessionStatus = session.status || 'waiting';
          const sessionData = {
            sessionId: sessionId,
            session_id: sessionId, // 同时提供两种字段
            status: sessionStatus,
            userId,
            user_id: userId, // 同时提供两种字段
            customerServiceId,
            customer_service_id: customerServiceId, // 同时提供两种字段
            message: sessionStatus === 'active' ? '已连接到客服' : '等待客服接受',
          };
          
          console.log('📤 [后端] 发送session_started给用户:', sessionData);
          socket.emit('session_started', sessionData);

          // 通知指定客服有新的等待会话（需要客服接受，使用辅助函数，不在线则存储）
          if (sessionStatus === 'waiting') {
            const waitingUserData = {
              sessionId: sessionId,
              userId,
              user_id: userId, // 同时提供两种字段
              username: socket.username || `用户${userId}`,
              email: (socket as any).email || '',
              avatar: (socket as any).avatar || '',
              priority: 'normal',
              timestamp: new Date().toISOString(),
              customerServiceId: customerServiceId, // 添加客服ID，便于前端过滤
            };
            
            console.log('📤 [后端] 准备通知客服新的等待会话:', waitingUserData);
            await sendNotificationOrStore(io, 'new_waiting_user', 'customer_service', customerServiceId, waitingUserData);
            console.log(`✅ [后端] 已通知客服 ${customerServiceId} 有新的等待会话:`, sessionId);
          } else {
            // 如果是active状态，发送new_session事件
            io.to(`customer_service_${customerServiceId}`).emit('new_session', {
              sessionId: sessionId,
              userId,
              username: socket.username || `用户${userId}`,
              timestamp: new Date().toISOString(),
            });
            
            // 让客服加入会话房间
            const customerServiceSocket = Array.from(io.sockets.sockets.values())
              .find((s: any) => s.customerServiceId === customerServiceId);
            if (customerServiceSocket) {
              customerServiceSocket.join(`session_${sessionId}`);
              console.log(`客服 ${customerServiceId} 已加入会话房间: session_${sessionId}`);
            }
          }

          if (typeof ack === 'function') { try { ack({ ok: true, sessionId }); } catch {} }
          return;
        }

        // 1) 复用未完成会话（waiting/active）
        const existing = await ChatSession.findOne({
          where: { user_id: userId, status: ['waiting', 'active'] },
          order: [['created_at', 'DESC']],
        });
        if (existing) {
          const reuseId = existing.session_id;
          console.log('复用未完成会话:', reuseId);
          socket.sessionId = reuseId;
          socket.userId = userId;
          socket.userType = 'user';
          socket.join(`session_${reuseId}`);
          socket.join(`user_${userId}`);
          const payload = { sessionId: reuseId, status: existing.status, userId, message: existing.status === 'active' ? '会话已建立，等待客服响应' : '会话已开始，等待客服接入' };
          socket.emit('session_started', payload);
          if (existing.status === 'waiting') {
            const csId = existing.customer_service_id;
            const waitingPayload = { sessionId: reuseId, userId, username: socket.username, priority: 'normal', timestamp: new Date().toISOString() };
            csId ? io.to(`customer_service_${csId}`).emit('new_waiting_user', waitingPayload) : socket.to('customer_services').emit('new_waiting_user', waitingPayload);
          }
          if (typeof ack === 'function') { try { ack({ ok: true, sessionId: reuseId }); } catch {} }
          return;
        }

        // 2) 复用最近结束且有客服的会话：重置为waiting，仅通知该客服
        const lastEnded = await ChatSession.findOne({
          where: { user_id: userId, status: 'ended', customer_service_id: { [Op.ne]: null } },
          order: [['ended_at', 'DESC']],
        });
        if (lastEnded) {
          await ChatSession.update({ status: 'waiting', updated_at: new Date() }, { where: { id: lastEnded.id } });
          const sid = lastEnded.session_id;
          const csId = lastEnded.customer_service_id;
          socket.sessionId = sid;
          socket.userId = userId;
          socket.userType = 'user';
          socket.join(`session_${sid}`);
          socket.join(`user_${userId}`);
          socket.emit('session_started', { sessionId: sid, status: 'waiting', userId, message: '会话已开始，等待客服接入' });
          io.to(`customer_service_${csId}`).emit('new_waiting_user', { sessionId: sid, userId, username: socket.username, priority: 'normal', timestamp: new Date().toISOString() });
          if (typeof ack === 'function') { try { ack({ ok: true, sessionId: sid }); } catch {} }
          return;
        }

        // 3) 创建全新会话并广播（使用时间戳确保唯一性）
        const sessionId = `user_${userId}_${Date.now()}`;
        console.log('生成会话ID:', sessionId);
        const session = await ChatSession.create({ session_id: sessionId, user_id: userId, status: 'waiting', created_at: new Date() });
        console.log('创建会话成功:', session);
        socket.sessionId = sessionId;
        socket.userId = userId;
        socket.userType = 'user';
        socket.join(`session_${sessionId}`);
        socket.join(`user_${userId}`);
        const sessionData = { sessionId, status: 'waiting', userId, message: '会话已开始，等待客服接入' };
        socket.emit('session_started', sessionData);
        if (typeof ack === 'function') { try { ack({ ok: true, sessionId }); } catch {} }
        const waitingUserData = { sessionId, userId, username: socket.username, priority: 'normal', timestamp: new Date().toISOString() };
        socket.to('customer_services').emit('new_waiting_user', waitingUserData);
        console.log(`用户开始聊天: ${sessionId}`);
      } catch (error) {
        console.error('用户开始聊天错误:', data.userId, error);
        socket.emit('error', { message: '开始聊天失败', error: error instanceof Error ? error.message : String(error) });
        if (typeof ack === 'function') {
          try { ack({ ok: false, error: error instanceof Error ? error.message : String(error) }); } catch (e) {
            // 忽略错误
          }
        }
      }
    });

    // 用户/访客连接
    socket.on('user_connect', async data => {
      try {
        const { sessionId, userId, visitorId, visitorName, visitorEmail } = data;

        // 创建或获取聊天会话
        const ChatSession = (app.model as any).ChatSession;
        let session = await ChatSession.findOne({
          where: { session_id: sessionId },
        });

        if (!session) {
          session = await ChatSession.create({
            session_id: sessionId,
            user_id: userId,
            visitor_id: visitorId,
            visitor_name: visitorName,
            visitor_email: visitorEmail,
            status: 'waiting',
          });
        }

        socket.sessionId = sessionId;
        socket.userId = userId;
        socket.visitorId = visitorId;
        socket.userType = userId ? 'user' : 'visitor';

        socket.join(`session_${sessionId}`);

        socket.emit('connect_success', {
          message: '连接成功',
          sessionId,
          status: session.status,
        });

        // 如果有客服分配，通知客服
        if (session.customer_service_id) {
          socket.to(`customer_service_${session.customer_service_id}`).emit('user_connected', {
            sessionId,
            userId,
            visitorId,
            visitorName,
          });
        } else {
          // 通知所有在线客服有新用户等待
          socket.to('customer_services').emit('new_waiting_user', {
            sessionId,
            userId,
            visitorId,
            visitorName,
            priority: session.priority,
          });
        }

        console.log(`用户连接: ${sessionId}`);
      } catch (error) {
        socket.emit('connect_error', { message: '连接失败', error: error instanceof Error ? error.message : String(error) });
      }
    });

    // 客服接受会话
    socket.on('accept_session', async data => {
      try {
        console.log('📤 [后端] ========== 收到接受会话请求 ==========');
        console.log('📤 [后端] 请求数据:', JSON.stringify(data, null, 2));
        console.log('📤 [后端] Socket 信息:', {
          socketId: socket.id,
          customerServiceId: socket.customerServiceId,
          userType: socket.userType,
          username: socket.username,
          connected: socket.connected
        });
        
        const { sessionId } = data || {};
        
        if (!sessionId) {
          console.error('❌ [后端] sessionId 为空');
          socket.emit('error', { message: '会话ID不能为空' });
          return;
        }
        
        const customerServiceId = socket.customerServiceId;

        if (!customerServiceId) {
          console.error('❌ [后端] customerServiceId 为空，请先登录');
          socket.emit('error', { message: '请先登录' });
          return;
        }

        if (socket.userType !== 'customer_service') {
          console.error('❌ [后端] 用户类型不是客服:', socket.userType);
          socket.emit('error', { message: '只有客服可以接受会话' });
          return;
        }
        
        console.log('✅ [后端] 参数验证通过，开始处理接受会话请求');

        const ChatSession = (app.model as any).ChatSession;
        const CustomerService = (app.model as any).CustomerService;

        // 检查会话是否存在
        console.log('📋 [后端] 步骤1: 查询会话是否存在...');
        const session = await ChatSession.findOne({
          where: { session_id: sessionId },
        });

        if (!session) {
          console.error('❌ [后端] 会话不存在:', sessionId);
          socket.emit('error', { message: '会话不存在', sessionId });
          return;
        }
        console.log('✅ [后端] 会话存在:', {
          id: session.id,
          session_id: session.session_id,
          status: session.status,
          customer_service_id: session.customer_service_id,
          user_id: session.user_id
        });

        // 检查客服是否还能接受新会话
        console.log('📋 [后端] 步骤2: 检查客服并发数...');
        const customerService = await CustomerService.findByPk(customerServiceId);
        if (!customerService) {
          console.error('❌ [后端] 客服不存在:', customerServiceId);
          socket.emit('error', { message: '客服不存在', sessionId });
          return;
        }
        
        console.log('✅ [后端] 客服信息:', {
          id: customerService.id,
          username: customerService.username,
          current_chats: customerService.current_chats,
          max_concurrent_chats: customerService.max_concurrent_chats
        });
        
        if (customerService.current_chats >= customerService.max_concurrent_chats) {
          console.error('❌ [后端] 已达到最大并发聊天数:', {
            current: customerService.current_chats,
            max: customerService.max_concurrent_chats
          });
          socket.emit('error', { message: '已达到最大并发聊天数', sessionId });
          return;
        }
        console.log('✅ [后端] 客服可以接受新会话');

        // 检查会话是否已经有customer_service_id且状态为active（防止重复计算）
        const sessionBeforeUpdate = await ChatSession.findOne({
          where: { session_id: sessionId }
        });
        
        console.log('📋 [后端] 接受会话前，会话状态:', {
          sessionId,
          currentStatus: sessionBeforeUpdate?.status,
          currentCustomerServiceId: sessionBeforeUpdate?.customer_service_id,
          targetCustomerServiceId: customerServiceId
        });
        
        const wasAlreadyAssigned = sessionBeforeUpdate?.customer_service_id === customerServiceId && sessionBeforeUpdate?.status === 'active';
        
        // 更新会话状态（确保状态更新为active）
        // 优先使用 raw query 直接更新，更可靠
        console.log('📋 [后端] 步骤3: 开始更新会话状态为 active...');
        let updateSuccess = false;
        try {
          const sequelize = ChatSession.sequelize;
          if (!sequelize) {
            console.error('❌ [后端] Sequelize 实例不存在');
            throw new Error('Sequelize 实例不存在');
          }
          
          console.log('📋 [后端] 执行 SQL UPDATE 语句...');
          // 使用 raw query 直接更新，更可靠
          const rawResult: any = await sequelize.query(
            `UPDATE chat_sessions SET customer_service_id = :customerServiceId, status = 'active', started_at = COALESCE(started_at, NOW()), updated_at = NOW() WHERE session_id = :sessionId`,
            {
              replacements: { customerServiceId, sessionId },
              type: sequelize.QueryTypes.UPDATE
            }
          );
          
          console.log('📋 [后端] Raw query 返回结果:', { 
            sessionId, 
            rawResult,
            rawResultType: typeof rawResult,
            isArray: Array.isArray(rawResult),
            arrayLength: Array.isArray(rawResult) ? rawResult.length : 'N/A'
          });
          
          // MySQL2 的 UPDATE 返回格式可能是：
          // 1. [OkPacket] 
          // 2. [[OkPacket], null]
          // 3. [undefined, OkPacket] 或 [null, OkPacket] (Sequelize的格式) <- 这是关键！
          // 4. OkPacket 本身
          let okPacket: any;
          let affectedRows = 0;
          
          if (Array.isArray(rawResult)) {
            // 检查数组中的每个元素
            for (let i = 0; i < rawResult.length; i++) {
              const item = rawResult[i];
              
              // 跳过 undefined 和 null
              if (item == null) continue;
              
              // 如果是嵌套数组 [[OkPacket], null]
              if (Array.isArray(item)) {
                const nestedItem = item.find((x: any) => x && typeof x === 'object' && (x.affectedRows !== undefined || x.changedRows !== undefined));
                if (nestedItem) {
                  okPacket = nestedItem;
                  break;
                }
              }
              // 如果是对象且包含 affectedRows 或 changedRows
              else if (typeof item === 'object') {
                if (item.affectedRows !== undefined || item.changedRows !== undefined || item.serverStatus !== undefined) {
                  okPacket = item;
                  break;
                }
              }
              // 如果是数字，可能是 Sequelize 的特殊格式 [undefined, 1] 或 [null, number]
              // 这种情况表示更新成功，affectedRows 就是数字本身
              else if (typeof item === 'number' && item > 0) {
                console.log('📋 [后端] 检测到数字格式的返回值，可能表示受影响行数:', item);
                affectedRows = item;
                updateSuccess = true;
                console.log('✅ [后端] Raw query 更新成功（数字格式），受影响行数:', affectedRows);
                break;
              }
            }
          } else if (rawResult && typeof rawResult === 'object') {
            // 直接是 OkPacket
            okPacket = rawResult;
          }
          
          // 如果找到了 OkPacket，提取 affectedRows
          if (okPacket && !updateSuccess) {
            affectedRows = okPacket.affectedRows || okPacket.changedRows || 0;
            console.log('📋 [后端] 解析到的 OkPacket:', {
              affectedRows,
              changedRows: okPacket.changedRows,
              insertId: okPacket.insertId,
              serverStatus: okPacket.serverStatus
            });
          }
          
          // 如果还没确定成功，验证数据库状态（可能更新成功但返回格式特殊）
          if (!updateSuccess && affectedRows === 0) {
            console.warn('⚠️ [后端] 无法从返回结果中解析 OkPacket，立即验证数据库状态...');
            // 立即验证数据库（不等待后续流程）
          }
          
          // 检查是否有数字类型的返回值（可能是 [undefined, 1] 格式）
          if (!updateSuccess && Array.isArray(rawResult)) {
            const numberItem = rawResult.find((x: any) => typeof x === 'number' && x > 0);
            if (numberItem) {
              console.log('📋 [后端] 检测到数字格式的返回值（可能是受影响行数）:', numberItem);
              affectedRows = numberItem;
              updateSuccess = true;
            }
          }
          
          console.log('📋 [后端] Raw query 受影响的行数:', {
            affectedRows,
            updateSuccess,
            rawResultType: Array.isArray(rawResult) ? 'array' : typeof rawResult,
            rawResultLength: Array.isArray(rawResult) ? rawResult.length : 'N/A',
            okPacketKeys: okPacket ? Object.keys(okPacket) : 'null',
            okPacket,
            rawResultArray: Array.isArray(rawResult) ? rawResult.map((x: any) => ({ type: typeof x, value: x })) : 'N/A'
          });
          
          // 设置更新成功状态
          if (!updateSuccess) {
            updateSuccess = affectedRows > 0;
          }
          
          // 如果受影响行数大于0，直接认为成功
          if (updateSuccess) {
            console.log('✅ [后端] Raw query 更新成功，受影响行数:', affectedRows);
          } else {
            console.warn('⚠️ [后端] Raw query 返回的受影响行数为0，验证数据库状态...');
            
            // 立即验证数据库状态（可能更新成功但返回格式解析错误）
            const verifySession = await ChatSession.findOne({
              where: { session_id: sessionId },
              raw: true
            });
            
            if (verifySession && verifySession.status === 'active' && verifySession.customer_service_id === customerServiceId) {
              console.log('✅ [后端] 虽然返回 affectedRows=0，但数据库验证成功，状态已更新为 active');
              updateSuccess = true;
              affectedRows = 1; // 标记为成功，继续后续流程
            } else {
              // 如果验证失败，尝试使用 Sequelize update 作为备用
              console.warn('⚠️ [后端] 数据库验证失败，尝试使用 Sequelize update 作为备用');
              const updateResult = await ChatSession.update(
                {
                  customer_service_id: customerServiceId,
                  status: 'active',
                  started_at: sessionBeforeUpdate?.started_at || new Date(),
                  updated_at: new Date(),
                },
                { 
                  where: { session_id: sessionId }
                }
              );
              
              console.log('📋 [后端] 使用 Sequelize update 更新会话:', {
                sessionId,
                affectedRows: updateResult[0],
                success: updateResult[0] > 0
              });
              
              updateSuccess = updateResult[0] > 0;
              
              if (updateSuccess) {
                console.log('✅ [后端] Sequelize update 更新成功');
              }
              
              // 如果 Sequelize update 也失败，最后验证一次数据库
              if (!updateSuccess) {
                const finalVerify = await ChatSession.findOne({
                  where: { session_id: sessionId },
                  raw: true
                });
                
                if (finalVerify && finalVerify.status === 'active' && finalVerify.customer_service_id === customerServiceId) {
                  console.log('✅ [后端] 最终验证：数据库状态已更新为 active，继续执行');
                  updateSuccess = true;
                } else {
                  console.error('❌ [后端] 两种更新方法都失败，可能的原因：');
                  console.error('  - session_id 不存在:', sessionId);
                  console.error('  - 会话可能已经被其他进程修改');
                  console.error('  - 数据库连接问题');
                  console.error('  - 当前会话数据:', finalVerify);
                }
              }
            }
          }
        } catch (updateError) {
          console.error('❌ [后端] 更新会话状态时出错:', updateError);
          socket.emit('error', { message: '更新会话状态失败', error: updateError instanceof Error ? updateError.message : String(updateError) });
          return;
        }
        
        if (!updateSuccess) {
          console.error('❌ [后端] 会话状态更新失败：没有行被更新');
          socket.emit('error', { 
            message: '会话状态更新失败，请检查会话是否存在或联系管理员',
            sessionId 
          });
          return;
        }
        
        // 验证更新是否成功
        console.log('📋 [后端] 步骤4: 验证更新是否成功...');
        const sessionAfterUpdate = await ChatSession.findOne({
          where: { session_id: sessionId }
        });
        
        console.log('📋 [后端] 更新后的会话状态:', {
          sessionId,
          status: sessionAfterUpdate?.status,
          customer_service_id: sessionAfterUpdate?.customer_service_id,
          started_at: sessionAfterUpdate?.started_at,
          updated_at: sessionAfterUpdate?.updated_at
        });
        
        if (!sessionAfterUpdate) {
          console.error('❌ [后端] 更新后无法查询到会话，可能已删除');
          socket.emit('error', { 
            message: '会话不存在或已被删除',
            sessionId 
          });
          return;
        }
        
        if (sessionAfterUpdate.status !== 'active') {
          console.error('❌ [后端] 会话状态更新失败！', {
            sessionId,
            expectedStatus: 'active',
            actualStatus: sessionAfterUpdate?.status,
            customer_service_id: sessionAfterUpdate?.customer_service_id,
            expectedCustomerServiceId: customerServiceId
          });
          socket.emit('error', { 
            message: '会话状态更新失败，请重试',
            sessionId 
          });
          return;
        }
        
        console.log('✅ [后端] 会话状态验证通过，状态已更新为 active');

        // 更新客服当前聊天数（只有之前未分配给该客服或状态不是active时才增加）
        if (!wasAlreadyAssigned) {
          await CustomerService.update(
            { current_chats: customerService.current_chats + 1 },
            { where: { id: customerServiceId } }
          );
          console.log(`客服 ${customerServiceId} 当前聊天数已更新为: ${customerService.current_chats + 1}`);
        } else {
          console.log(`会话 ${sessionId} 已经由客服 ${customerServiceId} 处理，无需更新计数`);
        }

        // 获取用户ID（从更新后的会话数据中获取）- 必须先获取，后面要用
        const userId = sessionAfterUpdate?.user_id || sessionBeforeUpdate?.user_id || session?.user_id;
        
        console.log('📋 [后端] 获取到的用户ID:', {
          userId,
          sessionAfterUpdate_user_id: sessionAfterUpdate?.user_id,
          sessionBeforeUpdate_user_id: sessionBeforeUpdate?.user_id,
          session_user_id: session?.user_id
        });
        
        if (!userId) {
          console.error('❌ [后端] 无法获取用户ID，无法完成接受流程');
          socket.emit('error', { 
            message: '无法获取用户ID', 
            sessionId 
          });
          return;
        }
        
        // 加入会话房间
        socket.join(`session_${sessionId}`);
        socket.sessionId = sessionId;
        console.log(`✅ [后端] 客服 ${customerServiceId} 已加入会话房间: session_${sessionId}`);
        
        // 确保用户也在会话房间中（如果用户已连接）
        const userSockets = Array.from(io.sockets.sockets.values())
          .filter((s: any) => s.userId === userId && s.userType === 'user');
        
        console.log(`📋 [后端] 找到用户 ${userId} 的Socket连接数:`, userSockets.length);
        
        for (const userSocket of userSockets) {
          userSocket.join(`session_${sessionId}`);
          console.log(`✅ [后端] 用户 ${userId} (Socket ${userSocket.id}) 已加入会话房间: session_${sessionId}`);
        }

        // 重新查询会话和用户信息，确保数据完整准确
        console.log('📋 [后端] 重新查询会话和用户信息以构建广播数据...');
        const finalSession = await ChatSession.findOne({
          where: { session_id: sessionId }
        });
        
        if (!finalSession) {
          console.error('❌ [后端] 会话不存在，无法发送广播:', sessionId);
          socket.emit('error', { message: '会话不存在', sessionId });
          return;
        }
        
        // 获取用户详细信息
        const User = (app.model as any).User;
        const finalUserId = finalSession.user_id || userId;
        let userInfo: any = null;
        
        if (finalUserId) {
          userInfo = await User.findByPk(finalUserId, {
            attributes: ['id', 'username', 'email', 'avatar']
          });
          console.log('📋 [后端] 查询到的用户信息:', userInfo ? {
            id: userInfo.id,
            username: userInfo.username,
            email: userInfo.email
          } : '未找到');
        }
        
        // 创建系统消息记录会话接受
        const ChatMessage = (app.model as any).ChatMessage;
        const systemMessage = await ChatMessage.create({
          session_id: sessionId,
          sender_type: 'system',
          sender_name: '系统',
          message_type: 'system',
          content: `${ customerService?.username || '客服'} 于 ${new Date().toLocaleString('zh-CN')} 接受了您的会话，可以开始对话了`,
          is_read: false,
          created_at: new Date(),
        });
        
        // 构建完整的会话接受数据（从数据库查询确保准确）
        const sessionAcceptedData = {
          sessionId: sessionId,
          session_id: sessionId, // 同时提供两种字段
          userId: finalUserId,
          user_id: finalUserId, // 同时提供两种字段
          customerServiceId: customerServiceId,
          customer_service_id: customerServiceId, // 同时提供两种字段
          customerService: {
            id: customerServiceId,
            username: customerService?.username || socket.username || '客服',
          },
          customerServiceName: customerService?.username || '客服',
          username: userInfo?.username || `用户${finalUserId}`,
          email: userInfo?.email || '',
          avatar: userInfo?.avatar || '',
          message: '客服已接受您的会话',
          status: 'active', // 明确状态为 active
        };
        
        console.log('📋 [后端] 构建的完整广播数据:', JSON.stringify(sessionAcceptedData, null, 2));
        
        console.log('📢 [后端] ========== 准备发送session_accepted事件 ==========');
        console.log('📢 [后端] 事件数据:', JSON.stringify(sessionAcceptedData, null, 2));
        console.log('📢 [后端] 目标房间信息:', {
          sessionRoom: `session_${sessionId}`,
          userRoom: userId ? `user_${userId}` : '无用户ID',
          customerServiceRoom: `customer_service_${customerServiceId}`
        });
        
        // 检查所有相关房间的客户端数量
        const sessionRoom = `session_${sessionId}`;
        const sessionRoomClients = io.sockets.adapter.rooms.get(sessionRoom);
        const sessionRoomSize = sessionRoomClients?.size || 0;
        console.log(`📢 [后端] 会话房间 ${sessionRoom} 中的客户端数量:`, sessionRoomSize);
        if (sessionRoomSize > 0) {
          console.log(`📢 [后端] 会话房间中的客户端ID:`, Array.from(sessionRoomClients || []));
        }
        
        // 发送给会话房间中的所有客户端（包括用户和客服）
        socket.to(sessionRoom).emit('session_accepted', sessionAcceptedData);
        console.log(`📢 [后端] 已向会话房间 ${sessionRoom} 发送session_accepted（${sessionRoomSize} 个客户端）`);
        
        // 确保客服自己也收到（因为 socket.to 不包括自己）
        socket.emit('session_accepted', sessionAcceptedData);
        console.log('✅ [后端] 已直接发送session_accepted事件给客服端（当前Socket）');
        
        // 兜底：按用户房间再发一次，确保用户收到（即使没有加入会话房间）
        if (userId) {
          const userRoom = `user_${userId}`;
          const userRoomClients = io.sockets.adapter.rooms.get(userRoom);
          const userRoomSize = userRoomClients?.size || 0;
          console.log(`📢 [后端] 用户房间 ${userRoom} 中的客户端数量:`, userRoomSize);
          if (userRoomSize > 0) {
            console.log(`📢 [后端] 用户房间中的客户端ID:`, Array.from(userRoomClients || []));
          }
          
          // 使用 io.to 发送给用户房间的所有客户端
          io.to(userRoom).emit('session_accepted', sessionAcceptedData);
          console.log(`✅ [后端] 已向用户房间 ${userRoom} 发送session_accepted（${userRoomSize} 个客户端）`);
        } else {
          console.warn('⚠️  [后端] 无法获取用户ID，跳过用户房间广播');
          console.warn('⚠️  [后端] 会话数据:', {
            sessionAfterUpdate_user_id: sessionAfterUpdate?.user_id,
            sessionBeforeUpdate_user_id: sessionBeforeUpdate?.user_id,
            session_user_id: session?.user_id
          });
        }
        
        // 额外：也发送给客服房间（如果客服加入了客服房间）
        const customerServiceRoom = `customer_service_${customerServiceId}`;
        const csRoomClients = io.sockets.adapter.rooms.get(customerServiceRoom);
        const csRoomSize = csRoomClients?.size || 0;
        if (csRoomSize > 0) {
          console.log(`📢 [后端] 客服房间 ${customerServiceRoom} 中的客户端数量:`, csRoomSize);
          io.to(customerServiceRoom).emit('session_accepted', sessionAcceptedData);
          console.log(`✅ [后端] 已向客服房间 ${customerServiceRoom} 发送session_accepted`);
        }
        
        console.log('✅ [后端] ========== session_accepted事件发送完成 ==========');

        // 发送系统消息到聊天界面
        const messageData = {
          id: systemMessage.id,
          sessionId,
          senderType: 'system',
          senderName: '系统',
          messageType: 'system',
          content: systemMessage.content,
          timestamp: systemMessage.created_at.toISOString(),
        };
        socket.to(`session_${sessionId}`).emit('new_message', messageData);
        socket.emit('new_message', messageData); // 也发送给客服端

        // 通知用户会话已被接受（使用辅助函数，不在线则存储）
        // 使用之前获取的 userId，确保准确
        console.log('📢 [后端] 使用sendNotificationOrStore发送session_accepted给用户:', userId);
        await sendNotificationOrStore(io, 'session_accepted', 'user', userId, sessionAcceptedData);
        console.log('✅ [后端] sendNotificationOrStore调用完成');

        // 通知其他客服该会话已被接受（使用辅助函数，不在线则存储）
        const otherCustomerServices = await io.in('customer_services').fetchSockets();
        for (const otherSocket of otherCustomerServices) {
          const otherCsId = (otherSocket as any).customerServiceId;
          if (otherCsId && otherCsId !== customerServiceId) {
            await sendNotificationOrStore(io, 'session_taken', 'customer_service', otherCsId, {
              sessionId,
              customerServiceId,
            });
          }
        }

        console.log(`✅ [后端] 客服 ${customerServiceId} 成功接受会话 ${sessionId}`);
        console.log('✅ [后端] ========== 接受会话流程完成 ==========');
      } catch (error) {
        console.error('❌ [后端] ========== 接受会话错误 ==========');
        console.error('❌ [后端] 错误详情:', {
          errorType: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : 'N/A',
          sessionId: data?.sessionId,
          customerServiceId: socket.customerServiceId
        });
        socket.emit('error', { 
          message: '接受会话失败', 
          error: error instanceof Error ? error.message : String(error),
          sessionId: data?.sessionId
        });
      }
    });

    // 用户取消等待：删除waiting会话并通知对应客服
    socket.on('cancel_waiting', async data => {
      try {
        const { sessionId } = data || {};
        console.log('📤 用户取消等待，请求会话ID:', sessionId, 'socket.userId=', socket.userId);

        if (!sessionId) {
          socket.emit('error', { message: '会话ID不能为空' });
          return;
        }
        if (socket.userType !== 'user' || !socket.userId) {
          socket.emit('error', { message: '只有用户可以取消等待' });
          return;
        }

        const ChatSession = (app.model as any).ChatSession;

        const session = await ChatSession.findOne({ where: { session_id: sessionId } });
        if (!session) {
          // 会话已不存在，仍然广播取消以清理两端UI
          io.to('customer_services').emit('session_cancelled', { sessionId, message: '用户已取消等待' });
          return;
        }

        // 只能取消自己的 waiting 会话
        if (session.user_id !== socket.userId) {
          socket.emit('error', { message: '无权限取消该会话' });
          return;
        }
        if (session.status !== 'waiting') {
          socket.emit('error', { message: '只有等待中的会话可以取消' });
          return;
        }

        const csId = session.customer_service_id;

        // 直接删除会话记录
        await ChatSession.destroy({ where: { session_id: sessionId } });
        console.log('✅ 已删除等待会话:', sessionId);

        // 通知对应客服房间移除等待项（使用辅助函数，不在线则存储）
        if (csId) {
          await sendNotificationOrStore(io, 'session_cancelled', 'customer_service', csId, {
            sessionId,
            userId: socket.userId,
            message: '用户已取消等待',
          });
        } else {
          // 如果不知道客服ID，通知所有客服（使用辅助函数，不在线则存储）
          const allCustomerServices = await io.in('customer_services').fetchSockets();
          for (const otherSocket of allCustomerServices) {
            const otherCsId = (otherSocket as any).customerServiceId;
            if (otherCsId) {
              await sendNotificationOrStore(io, 'session_cancelled', 'customer_service', otherCsId, {
                sessionId,
                userId: socket.userId,
                message: '用户已取消等待',
              });
            }
          }
        }

        // 通知用户端取消成功（可选）
        socket.emit('cancel_waiting_success', { sessionId });
      } catch (error) {
        console.error('处理用户取消等待失败:', error);
        socket.emit('error', { message: '取消等待失败', error: error instanceof Error ? error.message : String(error) });
      }
    });

    // 客服拒绝会话
    socket.on('reject_session', async data => {
      try {
        console.log('📤 收到拒绝会话请求:', data);
        const { sessionId } = data;
        const customerServiceId = socket.customerServiceId;

        if (!customerServiceId) {
          socket.emit('error', { message: '请先登录' });
          return;
        }

        if (socket.userType !== 'customer_service') {
          socket.emit('error', { message: '只有客服可以拒绝会话' });
          return;
        }

        const ChatSession = (app.model as any).ChatSession;

        // 检查会话是否存在
        const session = await ChatSession.findOne({
          where: { session_id: sessionId },
        });

        if (!session) {
          socket.emit('error', { message: '会话不存在' });
          return;
        }

        // 从数据库中删除会话
        await ChatSession.destroy({
          where: { session_id: sessionId },
        });

        // 通知所有客服该会话已被拒绝（使用辅助函数，不在线则存储）
        const allCustomerServices = await io.in('customer_services').fetchSockets();
        for (const otherSocket of allCustomerServices) {
          const otherCsId = (otherSocket as any).customerServiceId;
          if (otherCsId) {
            await sendNotificationOrStore(io, 'session_rejected', 'customer_service', otherCsId, {
              sessionId,
              customerServiceId,
              message: '会话已被拒绝',
            });
          }
        }

        // 通知用户会话已被拒绝（使用辅助函数，不在线则存储）
        const userId = session.user_id;
        if (userId) {
          await sendNotificationOrStore(io, 'session_rejected', 'user', userId, {
            sessionId,
            message: '客服已拒绝您的会话',
          });
        }

        console.log(`客服 ${customerServiceId} 拒绝会话 ${sessionId}`);
      } catch (error) {
        console.error('拒绝会话错误:', error);
        socket.emit('error', { message: '拒绝会话失败', error: error instanceof Error ? error.message : String(error) });
      }
    });

    // 发送消息
    socket.on('send_message', async data => {
      try {
        console.log('📤 收到消息:', data);
        const { sessionId, content, messageType = 'text', fileData } = data;

        if (!sessionId) {
          socket.emit('error', { message: '会话ID不能为空' });
          return;
        }

        const ChatMessage = (app.model as any).ChatMessage;
        const ChatSession = (app.model as any).ChatSession;

        // 验证会话是否存在
        const session = await ChatSession.findOne({
          where: { session_id: sessionId },
        });

        if (!session) {
          socket.emit('error', { message: '会话不存在' });
          return;
        }

        const messageData: any = {
          session_id: sessionId,
          sender_type: socket.userType,
          sender_id: socket.userType === 'customer_service' ? socket.customerServiceId : socket.userId,
          sender_name: socket.userType === 'customer_service' ? '客服' : (socket.visitorId ? '访客' : '用户'),
          message_type: messageType,
          content,
        };

        // 处理文件消息
        if (messageType === 'image' || messageType === 'file') {
          messageData.file_url = fileData?.url;
          messageData.file_name = fileData?.name;
          messageData.file_size = fileData?.size;
          messageData.file_type = fileData?.type;
        }

        // 保存消息到数据库
        const message = await ChatMessage.create(messageData);

        // 广播消息到会话房间
        const messageResponse = {
          id: message.id,
          sessionId,
          senderType: socket.userType,
          senderId: socket.userType === 'customer_service' ? socket.customerServiceId : socket.userId,
          senderName: messageData.sender_name,
          messageType,
          content,
          fileData,
          timestamp: message.created_at,
        };

        // 广播消息到会话房间，但排除发送者
        socket.to(`session_${sessionId}`).emit('new_message', messageResponse);

        console.log(`消息已发送到会话 ${sessionId}:`, message.content);
      } catch (error) {
        console.error('发送消息错误:', error);
        socket.emit('error', { message: '发送消息失败', error: error instanceof Error ? error.message : String(error) });
      }
    });

    // 标记消息为已读
    socket.on('mark_read', async data => {
      try {
        const { messageId } = data;

        const ChatMessage = (app.model as any).ChatMessage;
        await ChatMessage.update(
          { is_read: true, read_at: new Date() },
          { where: { id: messageId } }
        );

        socket.emit('message_read', { messageId });
      } catch (error) {
        socket.emit('error', { message: '标记已读失败', error: error instanceof Error ? error.message : String(error) });
      }
    });

    // 获取历史消息
    socket.on('get_history', async data => {
      try {
        const { sessionId, page = 1, pageSize = 50 } = data;

        const ChatMessage = (app.model as any).ChatMessage;
        const messages = await ChatMessage.findAll({
          where: { session_id: sessionId },
          order: [ [ 'created_at', 'DESC' ] ],
          limit: pageSize,
          offset: (page - 1) * pageSize,
        });

        socket.emit('history_messages', {
          sessionId,
          messages: messages.reverse(),
          page,
          hasMore: messages.length === pageSize,
        });
      } catch (error) {
        socket.emit('error', { message: '获取历史消息失败', error: error instanceof Error ? error.message : String(error) });
      }
    });

    // 客服状态更新
    socket.on('update_status', async data => {
      try {
        const { status } = data;
        const customerServiceId = socket.customerServiceId;

        if (!customerServiceId) {
          socket.emit('error', { message: '请先登录' });
          return;
        }

        const CustomerService = (app.model as any).CustomerService;
        await CustomerService.update(
          { status },
          { where: { id: customerServiceId } }
        );

        // 通知其他客服状态更新
        socket.to('customer_services').emit('customer_service_status_update', {
          customerServiceId,
          status,
        });

        socket.emit('status_updated', { status });
      } catch (error) {
        socket.emit('error', { message: '更新状态失败', error: error instanceof Error ? error.message : String(error) });
      }
    });

    // 断开连接
    socket.on('disconnect', async reason => {
      try {
        console.log('用户断开连接:', socket.id, '原因:', reason);

        // 如果是客服断开连接
        if (socket.userType === 'customer_service' && socket.customerServiceId) {
          const CustomerService = (app.model as any).CustomerService;
          await CustomerService.update(
            { status: 'offline' },
            { where: { id: socket.customerServiceId } }
          );

          console.log(`客服 ${socket.customerServiceId} 断开连接，更新数据库状态为offline`);

          // 通知其他客服该客服离线
          socket.to('customer_services').emit('customer_service_offline', {
            customerServiceId: socket.customerServiceId,
            username: socket.username,
          });

          // 通知所有用户该客服离线（使用辅助函数，不在线则存储）
          const User = (app.model as any).User;
          const allUsers = await User.findAll({ attributes: ['id'] });
          for (const user of allUsers) {
            await sendNotificationOrStore(io, 'customer_service_offline', 'user', user.id, {
              customerServiceId: socket.customerServiceId,
              username: socket.username,
            });
          }

          // 通知其他客服该客服离线（使用辅助函数，不在线则存储）
          const otherCustomerServices = await io.in('customer_services').fetchSockets();
          for (const otherSocket of otherCustomerServices) {
            const otherCsId = (otherSocket as any).customerServiceId;
            if (otherCsId && otherCsId !== socket.customerServiceId) {
              await sendNotificationOrStore(io, 'customer_service_offline', 'customer_service', otherCsId, {
                customerServiceId: socket.customerServiceId,
                username: socket.username,
              });
            }
          }

          console.log(`已广播客服 ${socket.customerServiceId} 下线通知`);
        }

        // 如果是用户断开连接
        if (socket.sessionId) {
          socket.to(`session_${socket.sessionId}`).emit('user_disconnected', {
            sessionId: socket.sessionId,
          });
        }
      } catch (error) {
        console.error('断开连接处理错误:', error);
      }
    });

    // 错误处理
    socket.on('error', error => {
      console.error('Socket错误:', error);
    });
  });

  return io;
};
