import { Application } from 'egg';

export default (app: Application) => {
  // 扩展 Helper 对象
  app.helper.formatDate = (date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss') => {
    const moment = require('moment');
    return moment(date).format(format);
  };

  app.helper.formatPagination = (data: any[], total: number, page: number, pageSize: number) => {
    return {
      list: data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  };

  app.helper.successResponse = (data: any = null, message: string = '操作成功') => {
    return {
      code: 200,
      message,
      data,
    };
  };

  app.helper.errorResponse = (code: number = 500, message: string = '操作失败', data: any = null) => {
    return {
      code,
      message,
      data,
    };
  };

  app.helper.generateUUID = () => {
    return app.utils.generateUUID();
  };

  app.helper.isValidEmail = (email: string) => {
    return app.utils.isValidEmail(email);
  };

  app.helper.isValidPhone = (phone: string) => {
    return app.utils.isValidPhone(phone);
  };
};
