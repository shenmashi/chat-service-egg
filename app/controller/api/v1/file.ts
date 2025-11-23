import { Controller } from 'egg';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

export default class FileController extends Controller {
  /**
   * @Summary 上传聊天文件
   * @Description 上传聊天中的图片或文件
   * @Router POST /api/v1/chat/upload
   * @Request header Authorization
   * @Request formData file file 文件
   * @Response 200 uploadFileResponse
   */
  public async uploadChatFile() {
    const { ctx, app } = this;

    try {
      // 从JWT token中获取用户信息
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        ctx.body = {
          code: 401,
          message: '未提供Token',
        };
        return;
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, app.config.jwt.secret);

      // 配置multer
      const storage = multer.diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const uploadDir = path.join(app.baseDir, 'app/public/uploads/chat');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req: any, file: any, cb: any) => {
          const ext = path.extname(file.originalname);
          const filename = `${uuidv4()}${ext}`;
          cb(null, filename);
        }
      });

      const upload = multer({
        storage: storage,
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB
        },
        fileFilter: (req: any, file: any, cb: any) => {
          // 允许的文件类型
          const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
          ];
          
          if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('不支持的文件类型'));
          }
        }
      });

      // 处理文件上传
      await new Promise((resolve, reject) => {
        upload.single('file')(ctx.req as any, ctx.res as any, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });

      const file = (ctx.req as any).file;
      if (!file) {
        ctx.body = {
          code: 400,
          message: '没有上传文件',
        };
        return;
      }

      let fileData: any = {
        originalName: file.originalname,
        filename: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileType: this.getFileType(file.mimetype)
      };

      // 如果是图片，生成缩略图
      if (fileData.fileType === 'image') {
        try {
          const thumbnailPath = path.join(
            path.dirname(file.path),
            'thumbnails',
            `thumb_${file.filename}`
          );
          
          // 确保缩略图目录存在
          const thumbnailDir = path.dirname(thumbnailPath);
          if (!fs.existsSync(thumbnailDir)) {
            fs.mkdirSync(thumbnailDir, { recursive: true });
          }

          // 生成缩略图
          await sharp(file.path)
            .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

          fileData.thumbnailPath = thumbnailPath;
          fileData.thumbnailUrl = `/public/uploads/chat/thumbnails/thumb_${file.filename}`;
        } catch (error) {
          ctx.logger.warn('生成缩略图失败:', error);
        }
      }

      // 生成文件URL
      fileData.fileUrl = `/public/uploads/chat/${file.filename}`;

      // 保存文件信息到数据库
      const ChatFile = (app.model as any).ChatFile;
      if (ChatFile) {
        const chatFile = await ChatFile.create({
          original_name: fileData.originalName,
          file_name: fileData.filename,
          file_path: fileData.filePath,
          file_url: fileData.fileUrl,
          file_size: fileData.fileSize,
          mime_type: fileData.mimeType,
          file_type: fileData.fileType,
          uploader_id: decoded.id,
          uploader_type: decoded.role === 'customer_service' ? 'customer_service' : 'user'
        });
        fileData.id = chatFile.id;
      }

      ctx.body = {
        code: 200,
        message: '文件上传成功',
        data: fileData
      };
    } catch (error) {
      ctx.logger.error('文件上传失败:', error);
      ctx.body = {
        code: 500,
        message: '文件上传失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 上传头像
   * @Description 上传客服头像
   * @Router POST /api/v1/customer-service/upload-avatar
   * @Request header Authorization
   * @Request formData file avatar 头像文件
   * @Response 200 uploadAvatarResponse
   */
  public async uploadAvatar() {
    const { ctx, app } = this;

    try {
      // 从JWT token中获取客服ID
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        ctx.body = {
          code: 401,
          message: '未提供Token',
        };
        return;
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, app.config.jwt.secret);

      // 配置multer
      const storage = multer.diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const uploadDir = path.join(app.baseDir, 'app/public/uploads/avatars');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req: any, file: any, cb: any) => {
          const ext = path.extname(file.originalname);
          const filename = `avatar_${decoded.id}_${uuidv4()}${ext}`;
          cb(null, filename);
        }
      });

      const upload = multer({
        storage: storage,
        limits: {
          fileSize: 2 * 1024 * 1024, // 2MB
        },
        fileFilter: (req: any, file: any, cb: any) => {
          // 只允许图片
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('只允许上传图片文件'));
          }
        }
      });

      // 处理文件上传
      await new Promise((resolve, reject) => {
        upload.single('avatar')(ctx.req as any, ctx.res as any, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });

      const file = (ctx.req as any).file;
      if (!file) {
        ctx.body = {
          code: 400,
          message: '没有上传文件',
        };
        return;
      }

      // 处理图片
      const processedPath = path.join(
        path.dirname(file.path),
        `processed_${file.filename}`
      );

      await sharp(file.path)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 90 })
        .toFile(processedPath);

      // 删除原文件
      fs.unlinkSync(file.path);

      const avatarUrl = `/public/uploads/avatars/processed_${file.filename}`;

      // 更新客服头像
      const CustomerService = (app.model as any).CustomerService;
      await CustomerService.update(
        { avatar: avatarUrl },
        { where: { id: decoded.id } }
      );

      ctx.body = {
        code: 200,
        message: '头像上传成功',
        data: {
          avatarUrl: avatarUrl
        }
      };
    } catch (error) {
      ctx.logger.error('头像上传失败:', error);
      ctx.body = {
        code: 500,
        message: '头像上传失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取文件类型
   * @param mimeType MIME类型
   */
  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return 'document';
    }
    return 'other';
  }
}