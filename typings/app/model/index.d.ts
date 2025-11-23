// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportArticle from '../../../app/model/article';
import ExportArticleCategory from '../../../app/model/articleCategory';
import ExportArticleTag from '../../../app/model/articleTag';
import ExportCategory from '../../../app/model/category';
import ExportChatMessage from '../../../app/model/chatMessage';
import ExportChatSession from '../../../app/model/chatSession';
import ExportCustomerService from '../../../app/model/customerService';
import ExportFile from '../../../app/model/file';
import ExportPendingNotification from '../../../app/model/pendingNotification';
import ExportTag from '../../../app/model/tag';
import ExportUser from '../../../app/model/user';

declare module 'egg' {
  interface IModel {
    Article: ReturnType<typeof ExportArticle>;
    ArticleCategory: ReturnType<typeof ExportArticleCategory>;
    ArticleTag: ReturnType<typeof ExportArticleTag>;
    Category: ReturnType<typeof ExportCategory>;
    ChatMessage: ReturnType<typeof ExportChatMessage>;
    ChatSession: ReturnType<typeof ExportChatSession>;
    CustomerService: ReturnType<typeof ExportCustomerService>;
    File: ReturnType<typeof ExportFile>;
    PendingNotification: ReturnType<typeof ExportPendingNotification>;
    Tag: ReturnType<typeof ExportTag>;
    User: ReturnType<typeof ExportUser>;
  }
}
