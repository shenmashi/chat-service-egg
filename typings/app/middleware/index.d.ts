// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportAuthJwt from '../../../app/middleware/authJwt';
import ExportCache from '../../../app/middleware/cache';
import ExportCheckPermission from '../../../app/middleware/checkPermission';

declare module 'egg' {
  interface IMiddleware {
    authJwt: typeof ExportAuthJwt;
    cache: typeof ExportCache;
    checkPermission: typeof ExportCheckPermission;
  }
}
