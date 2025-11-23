import { Context, Application } from 'egg';

export default () => {
  return async function authJwt(ctx: Context, next: () => Promise<any>) {
    const { app } = ctx;
    const token = ctx.request.header.authorization;

    if (!token) {
      ctx.body = {
        code: 401,
        message: '未授权，请提供Token',
      };
      return;
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token.split(' ')[1], app.config.jwt.secret);
      ctx.state.user = decoded; // 将解码后的用户信息存储在ctx.state.user中
      ctx.state.token = token; // 存储原始token
      await next();
    } catch (error) {
      ctx.body = {
        code: 401,
        message: 'Token无效或已过期',
        error: (error as Error).message,
      };
      return;
    }
  };
};