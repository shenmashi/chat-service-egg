import { Service } from 'egg';

export default class PermissionService extends Service {
  /**
   * 检查用户是否有指定权限
   * @param userId 用户ID
   * @param resource 资源名称
   * @param action 操作类型
   */
  async hasPermission(userId: number, resource: string, action: string): Promise<boolean> {
    const { app } = this;

    try {
      // 直接使用Sequelize创建模型
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);
      
      const UserRole = sequelize.define('UserRole', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        role_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      }, {
        tableName: 'user_roles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      const RolePermission = sequelize.define('RolePermission', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        role_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        permission_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      }, {
        tableName: 'role_permissions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      const Permission = sequelize.define('Permission', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        display_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        resource: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        action: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active',
        },
      }, {
        tableName: 'permissions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 查询用户权限
      const result = await sequelize.query(`
        SELECT p.name, p.resource, p.action
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = :userId 
        AND p.resource = :resource 
        AND p.action = :action
        AND p.status = 'active'
      `, {
        replacements: { userId, resource, action },
        type: Sequelize.QueryTypes.SELECT,
      });

      return result.length > 0;
    } catch (error) {
      this.ctx.logger.error('检查权限失败:', error);
      return false;
    }
  }

  /**
   * 获取用户所有权限
   * @param userId 用户ID
   */
  async getUserPermissions(userId: number): Promise<any[]> {
    const { app } = this;

    try {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);

      const result = await sequelize.query(`
        SELECT DISTINCT p.name, p.display_name, p.resource, p.action, p.description
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = :userId 
        AND p.status = 'active'
        ORDER BY p.resource, p.action
      `, {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT,
      });

      return result;
    } catch (error) {
      this.ctx.logger.error('获取用户权限失败:', error);
      return [];
    }
  }

  /**
   * 获取用户角色
   * @param userId 用户ID
   */
  async getUserRoles(userId: number): Promise<any[]> {
    const { app } = this;

    try {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);

      const result = await sequelize.query(`
        SELECT r.id, r.name, r.display_name, r.description
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = :userId 
        AND r.status = 'active'
      `, {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT,
      });

      return result;
    } catch (error) {
      this.ctx.logger.error('获取用户角色失败:', error);
      return [];
    }
  }

  /**
   * 为用户分配角色
   * @param userId 用户ID
   * @param roleIds 角色ID数组
   */
  async assignRoles(userId: number, roleIds: number[]): Promise<boolean> {
    const { app } = this;

    try {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);
      
      const UserRole = sequelize.define('UserRole', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        role_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      }, {
        tableName: 'user_roles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 删除现有角色
      await UserRole.destroy({
        where: { user_id: userId },
      });

      // 添加新角色
      const userRoles = roleIds.map(roleId => ({
        user_id: userId,
        role_id: roleId,
      }));

      await UserRole.bulkCreate(userRoles);

      return true;
    } catch (error) {
      this.ctx.logger.error('分配角色失败:', error);
      return false;
    }
  }

  /**
   * 为角色分配权限
   * @param roleId 角色ID
   * @param permissionIds 权限ID数组
   */
  async assignPermissions(roleId: number, permissionIds: number[]): Promise<boolean> {
    const { app } = this;

    try {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);
      
      const RolePermission = sequelize.define('RolePermission', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        role_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        permission_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      }, {
        tableName: 'role_permissions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 删除现有权限
      await RolePermission.destroy({
        where: { role_id: roleId },
      });

      // 添加新权限
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      await RolePermission.bulkCreate(rolePermissions);

      return true;
    } catch (error) {
      this.ctx.logger.error('分配权限失败:', error);
      return false;
    }
  }

  /**
   * 初始化默认权限数据
   */
  async initDefaultPermissions(): Promise<void> {
    const { app } = this;

    try {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);
      
      const Role = sequelize.define('Role', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        display_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active',
        },
      }, {
        tableName: 'roles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      const Permission = sequelize.define('Permission', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        display_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        resource: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        action: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active',
        },
      }, {
        tableName: 'permissions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      });

      // 创建默认角色
      const roles = [
        { name: 'admin', display_name: '管理员', description: '系统管理员，拥有所有权限' },
        { name: 'moderator', display_name: '版主', description: '版主，拥有部分管理权限' },
        { name: 'user', display_name: '普通用户', description: '普通用户，拥有基本权限' },
      ];

      for (const roleData of roles) {
        await Role.findOrCreate({
          where: { name: roleData.name },
          defaults: roleData,
        });
      }

      // 创建默认权限
      const permissions = [
        // 用户管理权限
        { name: 'user.create', display_name: '创建用户', resource: 'user', action: 'create', description: '创建新用户' },
        { name: 'user.read', display_name: '查看用户', resource: 'user', action: 'read', description: '查看用户信息' },
        { name: 'user.update', display_name: '更新用户', resource: 'user', action: 'update', description: '更新用户信息' },
        { name: 'user.delete', display_name: '删除用户', resource: 'user', action: 'delete', description: '删除用户' },
        
        // 文章管理权限
        { name: 'article.create', display_name: '创建文章', resource: 'article', action: 'create', description: '创建新文章' },
        { name: 'article.read', display_name: '查看文章', resource: 'article', action: 'read', description: '查看文章' },
        { name: 'article.update', display_name: '更新文章', resource: 'article', action: 'update', description: '更新文章' },
        { name: 'article.delete', display_name: '删除文章', resource: 'article', action: 'delete', description: '删除文章' },
        
        // 文件管理权限
        { name: 'file.upload', display_name: '上传文件', resource: 'file', action: 'upload', description: '上传文件' },
        { name: 'file.read', display_name: '查看文件', resource: 'file', action: 'read', description: '查看文件' },
        { name: 'file.delete', display_name: '删除文件', resource: 'file', action: 'delete', description: '删除文件' },
        
        // 权限管理权限
        { name: 'permission.manage', display_name: '管理权限', resource: 'permission', action: 'manage', description: '管理用户权限' },
        { name: 'role.manage', display_name: '管理角色', resource: 'role', action: 'manage', description: '管理角色' },
      ];

      for (const permissionData of permissions) {
        await Permission.findOrCreate({
          where: { name: permissionData.name },
          defaults: permissionData,
        });
      }

      this.ctx.logger.info('默认权限数据初始化完成');
    } catch (error) {
      this.ctx.logger.error('初始化默认权限数据失败:', error);
    }
  }
}
