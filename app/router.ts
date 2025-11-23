import { Application } from 'egg';

export default (app: Application) => {
  const { router, controller } = app;

  // 欢迎页面
  router.get('/', controller.home.welcome);

  // 健康检查
  router.get('/health', controller.home.index);

  // 调试路由
  router.get('/debug/model-status', controller.debug.modelStatus);
  router.get('/debug/db-test', controller.debug.dbTest);

  // 缓存管理路由
  router.get('/api/v1/cache/stats', app.middleware.authJwt(), controller.api.v1.cache.stats);
  router.delete('/api/v1/cache/:key', app.middleware.authJwt(), controller.api.v1.cache.clear);
  router.delete('/api/v1/cache/all', app.middleware.authJwt(), controller.api.v1.cache.clearAll);
  router.post('/api/v1/cache/warmup', app.middleware.authJwt(), controller.api.v1.cache.warmup);

  // 数据统计路由
  router.get('/api/v1/statistics/overview', app.middleware.authJwt(), controller.api.v1.statistics.overview);
  router.get('/api/v1/statistics/users', app.middleware.authJwt(), controller.api.v1.statistics.users);
  router.get('/api/v1/statistics/articles', app.middleware.authJwt(), controller.api.v1.statistics.articles);

  // 权限管理路由
  router.get('/api/v1/permissions/check', app.middleware.authJwt(), controller.api.v1.permission.check);
  router.get('/api/v1/permissions/user', app.middleware.authJwt(), controller.api.v1.permission.getUserPermissions);
  router.get('/api/v1/permissions/roles', app.middleware.authJwt(), controller.api.v1.permission.getRoles);
  router.get('/api/v1/permissions/list', app.middleware.authJwt(), controller.api.v1.permission.getPermissions);
  router.post('/api/v1/permissions/assign-roles', app.middleware.authJwt(), controller.api.v1.permission.assignRoles);
  router.post('/api/v1/permissions/init', app.middleware.authJwt(), controller.api.v1.permission.init);

  // 短信验证路由
  router.post('/api/v1/sms/send', controller.api.v1.sms.send);
  router.post('/api/v1/sms/verify', controller.api.v1.sms.verify);
  router.post('/api/v1/sms/register', controller.api.v1.sms.register);
  router.post('/api/v1/sms/login', controller.api.v1.sms.login);

  // 文件管理路由 - 暂时注释掉，因为FileController没有这些方法
  // router.post('/api/v1/files/upload', app.middleware.authJwt(), controller.api.v1.file.upload);
  // router.get('/api/v1/files', app.middleware.authJwt(), controller.api.v1.file.index);
  // router.delete('/api/v1/files/:id', app.middleware.authJwt(), controller.api.v1.file.destroy);

  // API v1 路由
  router.resources('users', '/api/v1/users', controller.api.v1.user);
  router.post('/api/v1/users/register', controller.api.v1.user.register);
  router.post('/api/v1/users/login', controller.api.v1.user.login);
  router.get('/api/v1/users/profile', controller.api.v1.user.profile);
  router.put('/api/v1/users/profile', controller.api.v1.user.updateProfile);
  router.get('/api/v1/users/info/:userId', controller.api.v1.user.getUserInfo);
  router.get('/api/v1/users/sessions', controller.api.v1.user.getSessions);
  router.get('/api/v1/users/customer-services', controller.api.v1.user.getCustomerServices);

  router.resources('articles', '/api/v1/articles', controller.api.v1.article);

  // 客服相关路由
  router.post('/api/v1/customer-service/register', controller.api.v1.customerService.register);
  router.post('/api/v1/customer-service/login', controller.api.v1.customerService.login);
  router.get('/api/v1/customer-service/profile', controller.api.v1.customerService.profile);
  router.put('/api/v1/customer-service/profile', controller.api.v1.customerService.updateProfile);
  router.get('/api/v1/customer-service/online', controller.api.v1.customerService.getOnlineList);
  router.get('/api/v1/customer-service/waiting-sessions', controller.api.v1.customerService.getWaitingSessions);
  router.get('/api/v1/customer-service/statistics', controller.api.v1.customerService.getStatistics);
  router.post('/api/v1/customer-service/upload-avatar', controller.api.v1.file.uploadAvatar);

  // 聊天相关路由
  router.get('/api/v1/chat/sessions', controller.api.v1.chat.getSessions);
  router.get('/api/v1/chat/sessions/:sessionId', controller.api.v1.chat.getSessionDetail);
  router.get('/api/v1/chat/sessions/:sessionId/messages', controller.api.v1.chat.getSessionMessages);
  router.get('/api/v1/chat/messages/:sessionId', controller.api.v1.chat.getMessages);
  router.post('/api/v1/chat/sessions/:sessionId/end', controller.api.v1.chat.endSession);
  router.post('/api/v1/chat/sessions/:sessionId/transfer', controller.api.v1.chat.transferSession);
  router.get('/api/v1/chat/statistics', controller.api.v1.chat.getStatistics);
  router.post('/api/v1/chat/upload', controller.api.v1.file.uploadChatFile);
};