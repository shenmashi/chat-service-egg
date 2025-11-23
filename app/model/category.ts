import { Application } from 'egg';

export default (app: Application) => {
  const { STRING, INTEGER, DATE, ENUM } = app.Sequelize;

  const Category = app.model.define('Category', {
    id: {
      type: INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '分类ID',
    },
    name: {
      type: STRING(50),
      allowNull: false,
      comment: '分类名称',
    },
    description: {
      type: STRING(200),
      allowNull: true,
      comment: '描述',
    },
    parentId: {
      type: INTEGER,
      allowNull: true,
      field: 'parent_id',
      comment: '父分类ID',
    },
    sortOrder: {
      type: INTEGER,
      defaultValue: 0,
      field: 'sort_order',
      comment: '排序',
    },
    status: {
      type: ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态',
    },
  }, {
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    comment: '分类表',
  });

  // 定义关联关系
  Category.associate = function() {
    app.model.Category.hasMany(app.model.Category, {
      foreignKey: 'parent_id',
      as: 'children',
    });
    
    app.model.Category.belongsTo(app.model.Category, {
      foreignKey: 'parent_id',
      as: 'parent',
    });
    
    app.model.Category.belongsToMany(app.model.Article, {
      through: app.model.ArticleCategory,
      foreignKey: 'category_id',
      otherKey: 'article_id',
      as: 'articles',
    });
  };

  return Category;
};
