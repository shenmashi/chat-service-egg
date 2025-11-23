// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportDebug from '../../../app/controller/debug';
import ExportHome from '../../../app/controller/home';
import ExportApiV1Article from '../../../app/controller/api/v1/article';
import ExportApiV1Cache from '../../../app/controller/api/v1/cache';
import ExportApiV1Chat from '../../../app/controller/api/v1/chat';
import ExportApiV1CustomerService from '../../../app/controller/api/v1/customerService';
import ExportApiV1File from '../../../app/controller/api/v1/file';
import ExportApiV1Permission from '../../../app/controller/api/v1/permission';
import ExportApiV1Sms from '../../../app/controller/api/v1/sms';
import ExportApiV1Statistics from '../../../app/controller/api/v1/statistics';
import ExportApiV1User from '../../../app/controller/api/v1/user';

declare module 'egg' {
  interface IController {
    debug: ExportDebug;
    home: ExportHome;
    api: {
      v1: {
        article: ExportApiV1Article;
        cache: ExportApiV1Cache;
        chat: ExportApiV1Chat;
        customerService: ExportApiV1CustomerService;
        file: ExportApiV1File;
        permission: ExportApiV1Permission;
        sms: ExportApiV1Sms;
        statistics: ExportApiV1Statistics;
        user: ExportApiV1User;
      }
    }
  }
}
