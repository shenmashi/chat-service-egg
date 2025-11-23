import { Context, Application } from 'egg';

export default (ttl: number = 300) => {
  return async function cacheMiddleware(this: any, ctx: Context, next: () => Promise<any>) {
    const { service } = this;

    // 只缓存GET请求
    if (ctx.method !== 'GET') {
      await next();
      return;
    }

    // 生成缓存键
    const cacheKey = `api:${ctx.path}:${JSON.stringify(ctx.query)}`;

    try {
      // 尝试从缓存获取
      const cachedResponse = await service.cache.get(cacheKey);
      if (cachedResponse) {
        ctx.logger.debug(`Cache hit for: ${ctx.path}`);
        ctx.body = cachedResponse;
        return;
      }

      // 执行下一个中间件
      await next();

      // 如果响应成功，设置缓存
      if (ctx.status === 200 && ctx.body) {
        await service.cache.set(cacheKey, ctx.body, ttl);
        ctx.logger.debug(`Cache set for: ${ctx.path}`);
      }
    } catch (error) {
      ctx.logger.error('缓存中间件错误:', error);
      await next();
    }
  };
};
