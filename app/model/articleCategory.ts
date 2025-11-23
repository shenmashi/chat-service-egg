import { Application } from 'egg';

export default (app: Application) => {
  const { INTEGER, DATE } = app.Sequelize;

  const ArticleCategory = app.model.define('ArticleCategory', {
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
    categoryId: {
      type: INTEGER,
      allowNull: false,
      field: 'category_id',
      comment: '分类ID',
    },
  }, {
    tableName: 'article_categories',
    timestamps: true,
    underscored: true,
    comment: '文章分类关联表',
  });

  return ArticleCategory;
};
