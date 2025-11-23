import { Application } from 'egg';

export default (app: Application) => {
  const { STRING, INTEGER, TEXT, DATE, ENUM } = app.Sequelize;

  const User = app.model.define('User', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名',
    },
    email: {
      type: STRING(100),
      allowNull: false,
      unique: true,
      comment: '邮箱',
    },
    password: {
      type: STRING(255),
      allowNull: false,
      comment: '密码',
    },
    phone: {
      type: STRING(20),
      allowNull: true,
      comment: '手机号',
    },
    avatar: {
      type: STRING(255),
      allowNull: true,
      comment: '头像',
    },
    role: {
      type: ENUM('admin', 'user', 'moderator'),
      defaultValue: 'user',
      comment: '角色',
    },
    status: {
      type: ENUM('active', 'inactive', 'banned'),
      defaultValue: 'active',
      comment: '状态',
    },
    last_login_at: {
      type: DATE,
      allowNull: true,
      comment: '最后登录时间',
    },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  // User.associate = function() {
  //   app.model.User.hasMany(app.model.Article, {
  //     foreignKey: 'user_id',
  //     as: 'articles',
  //   });
  // };

  return User;
};