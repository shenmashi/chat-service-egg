import { Application } from 'egg';

export default (app: Application) => {
  const { STRING, INTEGER, DATE } = app.Sequelize;

  const Tag = app.model.define('Tag', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '标签ID',
    },
    name: {
      type: STRING(30),
      allowNull: false,
      unique: true,
      comment: '标签名称',
    },
    color: {
      type: STRING(7),
      allowNull: true,
      comment: '标签颜色',
    },
  }, {
    tableName: 'tags',
    timestamps: true,
    underscored: true,
    comment: '标签表',
  });

  // 定义关联关系
  Tag.associate = function() {
    app.model.Tag.belongsToMany(app.model.Article, {
      through: app.model.ArticleTag,
      foreignKey: 'tag_id',
      otherKey: 'article_id',
      as: 'articles',
    });
  };

  return Tag;
};
