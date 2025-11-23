import { Application } from 'egg';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

export default (app: Application) => {
  return {
    // 生成UUID
    generateUUID(): string {
      return crypto.randomUUID();
    },

    // 加密密码
    encryptPassword(password: string): string {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return `${salt}:${hash}`;
    },

    // 比较密码
    comparePassword(password: string, hashedPassword: string): boolean {
      const [salt, hash] = hashedPassword.split(':');
      const hashToVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return hash === hashToVerify;
    },

    // 生成JWT token
    generateToken(payload: any): string {
      return jwt.sign(payload, app.config.jwt.secret, {
        expiresIn: app.config.jwt.expiresIn,
      });
    },

    // 验证JWT token
    verifyToken(token: string): any {
      try {
        return jwt.verify(token, app.config.jwt.secret);
      } catch (error) {
        return null;
      }
    },

    // 生成随机字符串
    generateRandomString(length: number = 32): string {
      return crypto.randomBytes(length).toString('hex');
    },

    // 格式化日期
    formatDate(date: Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string | null {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      
      return format
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    },

    // 分页计算
    calculatePagination(page: number, pageSize: number, total: number) {
      const currentPage = parseInt(page.toString()) || 1;
      const limit = parseInt(pageSize.toString()) || 10;
      const offset = (currentPage - 1) * limit;
      const totalPages = Math.ceil(total / limit);

      return {
        page: currentPage,
        pageSize: limit,
        offset,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      };
    },

    // 验证邮箱格式
    isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    // 验证手机号格式
    isValidPhone(phone: string): boolean {
      const phoneRegex = /^1[3-9]\d{9}$/;
      return phoneRegex.test(phone);
    },

    // 生成验证码
    generateVerificationCode(length: number = 6): string {
      return Math.random().toString().substr(2, length);
    },

    // 深度克隆对象
    deepClone<T>(obj: T): T {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj.getTime()) as any;
      if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as any;
      if (typeof obj === 'object') {
        const clonedObj = {} as any;
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            clonedObj[key] = this.deepClone(obj[key]);
          }
        }
        return clonedObj;
      }
      return obj;
    },
  };
};