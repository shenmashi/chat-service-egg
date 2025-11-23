import { Application } from 'egg';

export default (app: Application) => {
  const { STRING, INTEGER, TEXT, DATE, ENUM } = app.Sequelize;

  const Article = app.model.define('Article', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: STRING(200),
      allowNull: false,
      comment: '标题',
    },
    content: {
      type: TEXT,
      allowNull: false,
      comment: '内容',
    },
    summary: {
      type: TEXT,
      allowNull: true,
      comment: '摘要',
    },
    cover_image: {
      type: STRING(255),
      allowNull: true,
      comment: '封面图片',
    },
    status: {
      type: ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
      comment: '状态',
    },
    view_count: {
      type: INTEGER,
      defaultValue: 0,
      comment: '浏览次数',
    },
    like_count: {
      type: INTEGER,
      defaultValue: 0,
      comment: '点赞次数',
    },
    comment_count: {
      type: INTEGER,
      defaultValue: 0,
      comment: '评论次数',
    },
    user_id: {
      type: INTEGER,
      allowNull: false,
      comment: '用户ID',
    },
    published_at: {
      type: DATE,
      allowNull: true,
      comment: '发布时间',
    },
  }, {
    tableName: 'articles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  // Article.associate = function() {
  //   app.model.Article.belongsTo(app.model.User, {
  //     foreignKey: 'user_id',
  //     as: 'author',
  //   });
  // };

  return Article;
};