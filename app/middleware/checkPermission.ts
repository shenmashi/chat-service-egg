import { Context, Application } from 'egg';

export default (resource: string, action: string) => {
  return async function checkPermission(ctx: Context, next: () => Promise<any>) {
    const { service } = ctx;

    try {
      // 检查用户是否有指定权限
      const hasPermission = await service.permission.hasPermission(
        ctx.state.user!.id,
        resource,
        action
      );

      if (!hasPermission) {
        ctx.body = {
          code: 403,
          message: '权限不足，无法执行此操作',
        };
        return;
      }

      await next();
    } catch (error) {
      ctx.logger.error('权限检查失败:', error);
      ctx.body = {
        code: 500,
        message: '权限检查失败',
        error: (error as Error).message,
      };
      return;
    }
  };
};
