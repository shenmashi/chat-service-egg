import { Application } from 'egg';

export default (app: Application) => {
  // 扩展Application对象
  app.utils = require('./app/utils/index');

  // 扩展Context对象
  app.context.utils = app.utils;

  // 扩展Helper对象
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
};
