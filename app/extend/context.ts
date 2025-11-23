import { Context } from 'egg';

export default {
  /**
   * 获取客户端IP地址
   */
  getClientIP(this: Context): string {
    const forwarded = this.request.header['x-forwarded-for'];
    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }
    return this.request.ip || this.ip;
  },

  /**
   * 获取用户代理信息
   */
  getUserAgent(this: Context): string {
    return this.request.header['user-agent'] || '';
  },

  /**
   * 检查是否为移动端
   */
  isMobile(this: Context): boolean {
    const userAgent = this.getUserAgent();
    return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  },

  /**
   * 获取请求ID
   */
  getRequestId(this: Context): string {
    const requestId = this.request.header['x-request-id'];
    return Array.isArray(requestId) ? requestId[0] : (requestId || this.app.utils.generateUUID());
  },

  /**
   * 记录API调用日志
   */
  logApiCall(this: Context, method: string, url: string, status: number, duration: number) {
    const logData = {
      requestId: this.getRequestId(),
      method,
      url,
      status,
      duration,
      ip: this.getClientIP(),
      userAgent: this.getUserAgent(),
      userId: this.state.user?.id || null,
      timestamp: new Date().toISOString(),
    };
    
    this.logger.info('API调用', logData);
  },
};
