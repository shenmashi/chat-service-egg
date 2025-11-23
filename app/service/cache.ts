import { Service } from 'egg';

export default class CacheService extends Service {
  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒）
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const { app } = this;

    // 如果 Redis 不可用，静默跳过缓存设置
    if (!app.redis || !app.redis.setex) {
      this.ctx.logger.debug(`Redis不可用，跳过缓存设置: ${key}`);
      return;
    }

    try {
      const cacheKey = `cache:${key}`;
      const serializedValue = JSON.stringify(value);
      
      await app.redis.setex(cacheKey, ttl, serializedValue);
      this.ctx.logger.debug(`Cache set: ${key}, TTL: ${ttl}s`);
    } catch (error) {
      this.ctx.logger.error('设置缓存失败:', error);
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   */
  async get(key: string): Promise<any> {
    const { app } = this;

    // 如果 Redis 不可用，返回 null（缓存未命中）
    if (!app.redis || !app.redis.get) {
      this.ctx.logger.debug(`Redis不可用，缓存未命中: ${key}`);
      return null;
    }

    try {
      const cacheKey = `cache:${key}`;
      const value = await app.redis.get(cacheKey);
      
      if (value) {
        this.ctx.logger.debug(`Cache hit: ${key}`);
        return JSON.parse(value);
      }
      
      this.ctx.logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      this.ctx.logger.error('获取缓存失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  async del(key: string): Promise<void> {
    const { app } = this;

    // 如果 Redis 不可用，静默跳过
    if (!app.redis || !app.redis.del) {
      this.ctx.logger.debug(`Redis不可用，跳过缓存删除: ${key}`);
      return;
    }

    try {
      const cacheKey = `cache:${key}`;
      await app.redis.del(cacheKey);
      this.ctx.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.ctx.logger.error('删除缓存失败:', error);
    }
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   */
  async exists(key: string): Promise<boolean> {
    const { app } = this;

    // 如果 Redis 不可用，返回 false（不存在）
    if (!app.redis || !app.redis.exists) {
      return false;
    }

    try {
      const cacheKey = `cache:${key}`;
      const exists = await app.redis.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      this.ctx.logger.error('检查缓存失败:', error);
      return false;
    }
  }

  /**
   * 设置用户信息缓存
   * @param userId 用户ID
   * @param userInfo 用户信息
   */
  async setUserInfo(userId: number, userInfo: any): Promise<void> {
    await this.set(`user:${userId}`, userInfo, 1800); // 30分钟
  }

  /**
   * 获取用户信息缓存
   * @param userId 用户ID
   */
  async getUserInfo(userId: number): Promise<any> {
    return await this.get(`user:${userId}`);
  }

  /**
   * 删除用户信息缓存
   * @param userId 用户ID
   */
  async delUserInfo(userId: number): Promise<void> {
    await this.del(`user:${userId}`);
  }

  /**
   * 设置文章信息缓存
   * @param articleId 文章ID
   * @param articleInfo 文章信息
   */
  async setArticleInfo(articleId: number, articleInfo: any): Promise<void> {
    await this.set(`article:${articleId}`, articleInfo, 3600); // 1小时
  }

  /**
   * 获取文章信息缓存
   * @param articleId 文章ID
   */
  async getArticleInfo(articleId: number): Promise<any> {
    return await this.get(`article:${articleId}`);
  }

  /**
   * 删除文章信息缓存
   * @param articleId 文章ID
   */
  async delArticleInfo(articleId: number): Promise<void> {
    await this.del(`article:${articleId}`);
  }

  /**
   * 设置文章列表缓存
   * @param params 查询参数
   * @param articles 文章列表
   */
  async setArticleList(params: any, articles: any): Promise<void> {
    const key = `article_list:${JSON.stringify(params)}`;
    await this.set(key, articles, 600); // 10分钟
  }

  /**
   * 获取文章列表缓存
   * @param params 查询参数
   */
  async getArticleList(params: any): Promise<any> {
    const key = `article_list:${JSON.stringify(params)}`;
    return await this.get(key);
  }

  /**
   * 删除文章列表缓存
   */
  async delArticleList(): Promise<void> {
    const { app } = this;

    // 如果 Redis 不可用，静默跳过
    if (!app.redis || !app.redis.keys || !app.redis.del) {
      this.ctx.logger.debug('Redis不可用，跳过删除文章列表缓存');
      return;
    }

    try {
      const keys = await app.redis.keys('cache:article_list:*');
      if (keys.length > 0) {
        await app.redis.del(...keys);
      }
    } catch (error) {
      this.ctx.logger.error('删除文章列表缓存失败:', error);
    }
  }

  /**
   * 设置统计信息缓存
   * @param type 统计类型
   * @param data 统计数据
   */
  async setStatistics(type: string, data: any): Promise<void> {
    await this.set(`statistics:${type}`, data, 300); // 5分钟
  }

  /**
   * 获取统计信息缓存
   * @param type 统计类型
   */
  async getStatistics(type: string): Promise<any> {
    return await this.get(`statistics:${type}`);
  }

  /**
   * 设置API响应缓存
   * @param endpoint API端点
   * @param params 请求参数
   * @param response 响应数据
   * @param ttl 过期时间
   */
  async setApiResponse(endpoint: string, params: any, response: any, ttl: number = 300): Promise<void> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    await this.set(key, response, ttl);
  }

  /**
   * 获取API响应缓存
   * @param endpoint API端点
   * @param params 请求参数
   */
  async getApiResponse(endpoint: string, params: any): Promise<any> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return await this.get(key);
  }

  /**
   * 清除所有缓存
   */
  async clearAll(): Promise<void> {
    const { app } = this;

    // 如果 Redis 不可用，静默跳过
    if (!app.redis || !app.redis.keys || !app.redis.del) {
      this.ctx.logger.warn('Redis不可用，无法清除缓存');
      return;
    }

    try {
      const keys = await app.redis.keys('cache:*');
      if (keys.length > 0) {
        await app.redis.del(...keys);
      }
      this.ctx.logger.info('所有缓存已清除');
    } catch (error) {
      this.ctx.logger.error('清除所有缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<any> {
    const { app } = this;

    // 如果 Redis 不可用，返回空的统计信息
    if (!app.redis || !app.redis.info || !app.redis.keys) {
      return {
        totalKeys: 0,
        memoryInfo: 'Redis不可用',
        cacheTypes: {
          user: 0,
          article: 0,
          statistics: 0,
          api: 0,
        },
        redisAvailable: false,
      };
    }

    try {
      const info = await app.redis.info('memory');
      const keys = await app.redis.keys('cache:*');
      
      return {
        totalKeys: keys.length,
        memoryInfo: info,
        cacheTypes: {
          user: keys.filter((key: string) => key.includes('user:')).length,
          article: keys.filter((key: string) => key.includes('article:')).length,
          statistics: keys.filter((key: string) => key.includes('statistics:')).length,
          api: keys.filter((key: string) => key.includes('api:')).length,
        },
        redisAvailable: true,
      };
    } catch (error) {
      this.ctx.logger.error('获取缓存统计失败:', error);
      return {
        totalKeys: 0,
        memoryInfo: '获取失败',
        cacheTypes: {
          user: 0,
          article: 0,
          statistics: 0,
          api: 0,
        },
        redisAvailable: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * 缓存装饰器 - 用于方法缓存
   * @param key 缓存键
   * @param ttl 过期时间
   */
  cache(key: string, ttl: number = 3600) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;

      descriptor.value = async function(this: any, ...args: any[]) {
        const cacheKey = `${key}:${JSON.stringify(args)}`;
        
        // 尝试从缓存获取
        let result = await this.service.cache.get(cacheKey);
        if (result !== null) {
          return result;
        }

        // 执行原方法
        result = await method.apply(this, args);
        
        // 设置缓存
        await this.service.cache.set(cacheKey, result, ttl);
        
        return result;
      };
    };
  }
}
