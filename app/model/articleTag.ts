import { Application } from 'egg';

export default (app: Application) => {
  const { INTEGER, DATE } = app.Sequelize;

  const ArticleTag = app.model.define('ArticleTag', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '关联ID',
    },
    articleId: {
      type: INTEGER,
      allowNull: false,
      field: 'article_id',
      comment: '文章ID',
    },
    tagId: {
      type: INTEGER,
      allowNull: false,
      field: 'tag_id',
      comment: '标签ID',
    },
  }, {
    tableName: 'article_tags',
    timestamps: true,
    underscored: true,
    comment: '文章标签关联表',
  });

  return ArticleTag;
};
