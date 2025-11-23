import { Application } from 'egg';
import { DataTypes, Model } from 'sequelize';

export interface FileAttributes {
  id?: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_type: 'image' | 'document' | 'video' | 'audio' | 'other';
  user_id: number;
  status?: 'active' | 'deleted';
  created_at?: Date;
  updated_at?: Date;
}

export interface FileInstance extends Model<FileAttributes>, FileAttributes {}

export default (app: Application) => {
  const { STRING, INTEGER, BIGINT, ENUM, DATE } = app.Sequelize;

  const File = app.model.define<FileInstance, FileAttributes>('File', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '文件ID',
    },
    filename: {
      type: STRING(255),
      allowNull: false,
      comment: '存储文件名',
    },
    original_name: {
      type: STRING(255),
      allowNull: false,
      comment: '原始文件名',
    },
    file_path: {
      type: STRING(500),
      allowNull: false,
      comment: '文件存储路径',
    },
    file_size: {
      type: BIGINT,
      allowNull: false,
      comment: '文件大小(字节)',
    },
    mime_type: {
      type: STRING(100),
      allowNull: false,
      comment: 'MIME类型',
    },
    file_type: {
      type: ENUM('image', 'document', 'video', 'audio', 'other'),
      allowNull: false,
      comment: '文件类型',
    },
    user_id: {
      type: INTEGER,
      allowNull: false,
      comment: '上传用户ID',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: ENUM('active', 'deleted'),
      defaultValue: 'active',
      comment: '文件状态',
    },
    created_at: {
      type: DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间',
    },
    updated_at: {
      type: DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间',
    },
  }, {
    tableName: 'files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  return File;
};
