import { Controller } from 'egg';

export default class PermissionController extends Controller {
  /**
   * @Summary 检查用户权限
   * @Description 检查当前用户是否有指定权限
   * @Router GET /api/v1/permissions/check
   * @Request header Authorization
   * @Request query string resource 资源名称
   * @Request query string action 操作类型
   * @Response 200 checkPermissionResponse
   */
  public async check() {
    const { ctx, service } = this;
    const { resource, action } = ctx.query;

    try {
      if (!resource || !action) {
        ctx.body = {
          code: 400,
          message: '资源名称和操作类型不能为空',
        };
        return;
      }

      const hasPermission = await service.permission.hasPermission(
        ctx.state.user!.id,
        resource as string,
        action as string
      );

      ctx.body = {
        code: 200,
        message: '权限检查完成',
        data: {
          hasPermission,
          resource,
          action,
        },
      };
    } catch (error) {
      ctx.logger.error('权限检查失败:', error);
      ctx.body = {
        code: 500,
        message: '权限检查失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取用户权限列表
   * @Description 获取当前用户的所有权限
   * @Router GET /api/v1/permissions/user
   * @Request header Authorization
   * @Response 200 userPermissionsResponse
   */
  public async getUserPermissions() {
    const { ctx, service } = this;

    try {
      const permissions = await service.permission.getUserPermissions(ctx.state.user!.id);
      const roles = await service.permission.getUserRoles(ctx.state.user!.id);

      ctx.body = {
        code: 200,
        message: '获取用户权限成功',
        data: {
          permissions,
          roles,
        },
      };
    } catch (error) {
      ctx.logger.error('获取用户权限失败:', error);
      ctx.body = {
        code: 500,
        message: '获取用户权限失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取所有角色
   * @Description 获取系统中所有角色
   * @Router GET /api/v1/permissions/roles
   * @Request header Authorization
   * @Response 200 rolesResponse
   */
  public async getRoles() {
    const { ctx, app } = this;

    try {
      // 直接使用Sequelize创建模型
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

      const roles = await Role.findAll({
        where: { status: 'active' },
        order: [['created_at', 'ASC']],
      });

      ctx.body = {
        code: 200,
        message: '获取角色列表成功',
        data: roles,
      };
    } catch (error) {
      ctx.logger.error('获取角色列表失败:', error);
      ctx.body = {
        code: 500,
        message: '获取角色列表失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 获取所有权限
   * @Description 获取系统中所有权限
   * @Router GET /api/v1/permissions/list
   * @Request header Authorization
   * @Response 200 permissionsResponse
   */
  public async getPermissions() {
    const { ctx, app } = this;

    try {
      // 直接使用Sequelize创建模型
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(app.config.sequelize);
      
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

      const permissions = await Permission.findAll({
        where: { status: 'active' },
        order: [['resource', 'ASC'], ['action', 'ASC']],
      });

      // 按资源分组
      const groupedPermissions = permissions.reduce((acc: any, permission: any) => {
        const resource = permission.resource;
        if (!acc[resource]) {
          acc[resource] = [];
        }
        acc[resource].push(permission);
        return acc;
      }, {});

      ctx.body = {
        code: 200,
        message: '获取权限列表成功',
        data: {
          permissions,
          groupedPermissions,
        },
      };
    } catch (error) {
      ctx.logger.error('获取权限列表失败:', error);
      ctx.body = {
        code: 500,
        message: '获取权限列表失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 为用户分配角色
   * @Description 为指定用户分配角色
   * @Router POST /api/v1/permissions/assign-roles
   * @Request header Authorization
   * @Request body assignRolesRequest
   * @Response 200 assignRolesResponse
   */
  public async assignRoles() {
    const { ctx, service } = this;
    const { userId, roleIds } = ctx.request.body;

    try {
      if (!userId || !roleIds || !Array.isArray(roleIds)) {
        ctx.body = {
          code: 400,
          message: '用户ID和角色ID数组不能为空',
        };
        return;
      }

      const success = await service.permission.assignRoles(userId, roleIds);

      if (success) {
        ctx.body = {
          code: 200,
          message: '角色分配成功',
        };
      } else {
        ctx.body = {
          code: 500,
          message: '角色分配失败',
        };
      }
    } catch (error) {
      ctx.logger.error('分配角色失败:', error);
      ctx.body = {
        code: 500,
        message: '分配角色失败',
        error: (error as Error).message,
      };
    }
  }

  /**
   * @Summary 初始化权限数据
   * @Description 初始化默认的角色和权限数据
   * @Router POST /api/v1/permissions/init
   * @Request header Authorization
   * @Response 200 initPermissionsResponse
   */
  public async init() {
    const { ctx, service } = this;

    try {
      await service.permission.initDefaultPermissions();

      ctx.body = {
        code: 200,
        message: '权限数据初始化成功',
      };
    } catch (error) {
      ctx.logger.error('初始化权限数据失败:', error);
      ctx.body = {
        code: 500,
        message: '初始化权限数据失败',
        error: (error as Error).message,
      };
    }
  }
}
