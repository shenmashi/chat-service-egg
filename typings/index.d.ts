// 扩展 Egg.js 类型定义
import { Sequelize, Model, DefineOptions, ModelStatic, DataTypes, Op } from 'sequelize';
import 'egg';

declare module 'egg' {
  interface Application {
    utils: {
      generateUUID(): string;
      encryptPassword(password: string): string;
      comparePassword(password: string, hashedPassword: string): boolean;
      generateToken(payload: any): string;
      verifyToken(token: string): any;
      generateRandomString(length?: number): string;
      formatDate(date: Date, format?: string): string | null;
      calculatePagination(page: number, pageSize: number, total: number): any;
      isValidEmail(email: string): boolean;
      isValidPhone(phone: string): boolean;
      generateVerificationCode(length?: number): string;
      deepClone<T>(obj: T): T;
    };
    helper: any;
    model: IModel & {
      define: <M extends Model = Model, TAttributes = any>(
        name: string,
        attributes: any,
        options?: DefineOptions<M>
      ) => ModelStatic<M> & {
        associate?: () => void;
        sequelize?: Sequelize & {
          Op: typeof Op;
        };
      };
      sequelize: Sequelize & {
        Op: typeof Op;
      };
    };
    redis: any;
    jwt: any;
    Sequelize: typeof Sequelize & {
      STRING: typeof DataTypes.STRING;
      INTEGER: typeof DataTypes.INTEGER;
      TEXT: typeof DataTypes.TEXT;
      DATE: typeof DataTypes.DATE;
      ENUM: typeof DataTypes.ENUM;
      BOOLEAN: typeof DataTypes.BOOLEAN;
      BIGINT: typeof DataTypes.BIGINT;
      JSON: typeof DataTypes.JSON;
      NOW: typeof DataTypes.NOW;
      Op: typeof Op;
    };
    agent: any;
  }

  interface Context {
    utils: any;
    state: {
      user?: {
        id: number;
        username: string;
        role: string;
      };
      token?: string;
    };
  }

  interface Request {
    getClientIP(): string;
    getUserAgent(): string;
    isMobile(): boolean;
    getRequestId(): string;
  }

  interface Response {
    success(data?: any, message?: string, code?: number): void;
    error(message?: string, code?: number, data?: any): void;
    paginate(data: any[], total: number, page: number, pageSize: number, message?: string): void;
  }
}

// 扩展 Request 类型
declare module 'egg' {
  interface BaseRequest {
    getClientIP(): string;
    getUserAgent(): string;
    isMobile(): boolean;
    getRequestId(): string;
  }
}
