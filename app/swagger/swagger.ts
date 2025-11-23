/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 用户ID
 *         username:
 *           type: string
 *           description: 用户名
 *         email:
 *           type: string
 *           format: email
 *           description: 邮箱
 *         nickname:
 *           type: string
 *           description: 昵称
 *         avatar:
 *           type: string
 *           description: 头像URL
 *         phone:
 *           type: string
 *           description: 手机号
 *         status:
 *           type: string
 *           enum: [active, inactive, banned]
 *           description: 状态
 *         role:
 *           type: string
 *           enum: [admin, user, guest]
 *           description: 角色
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           description: 最后登录时间
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *     
 *     Article:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 文章ID
 *         title:
 *           type: string
 *           description: 标题
 *         content:
 *           type: string
 *           description: 内容
 *         summary:
 *           type: string
 *           description: 摘要
 *         coverImage:
 *           type: string
 *           description: 封面图片
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           description: 状态
 *         viewCount:
 *           type: integer
 *           description: 浏览次数
 *         likeCount:
 *           type: integer
 *           description: 点赞数
 *         userId:
 *           type: integer
 *           description: 作者ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *     
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 分类ID
 *         name:
 *           type: string
 *           description: 分类名称
 *         description:
 *           type: string
 *           description: 描述
 *         parentId:
 *           type: integer
 *           description: 父分类ID
 *         sortOrder:
 *           type: integer
 *           description: 排序
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: 状态
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *     
 *     Tag:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 标签ID
 *         name:
 *           type: string
 *           description: 标签名称
 *         color:
 *           type: string
 *           description: 标签颜色
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *     
 *     ApiResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           description: 响应码
 *         message:
 *           type: string
 *           description: 响应消息
 *         data:
 *           type: object
 *           description: 响应数据
 *     
 *     PaginationResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             type: object
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               description: 当前页码
 *             pageSize:
 *               type: integer
 *               description: 每页数量
 *             total:
 *               type: integer
 *               description: 总数量
 *             totalPages:
 *               type: integer
 *               description: 总页数
 *             hasNext:
 *               type: boolean
 *               description: 是否有下一页
 *             hasPrev:
 *               type: boolean
 *               description: 是否有上一页
 *   
 *   parameters:
 *     PageParam:
 *       name: page
 *       in: query
 *       description: 页码
 *       required: false
 *       schema:
 *         type: integer
 *         default: 1
 *     
 *     PageSizeParam:
 *       name: pageSize
 *       in: query
 *       description: 每页数量
 *       required: false
 *       schema:
 *         type: integer
 *         default: 10
 *     
 *     KeywordParam:
 *       name: keyword
 *       in: query
 *       description: 搜索关键词
 *       required: false
 *       schema:
 *         type: string
 *     
 *     IdParam:
 *       name: id
 *       in: path
 *       description: ID
 *       required: true
 *       schema:
 *         type: integer
 *   
 *   requestBodies:
 *     registerRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *                 description: 密码
 *               nickname:
 *                 type: string
 *                 maxLength: 50
 *                 description: 昵称
 *               phone:
 *                 type: string
 *                 pattern: '^1[3-9]\d{9}$'
 *                 description: 手机号
 *     
 *     loginRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名或邮箱
 *               password:
 *                 type: string
 *                 description: 密码
 *     
 *     changePasswordRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: 旧密码
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *                 description: 新密码
 *     
 *     resetPasswordRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱
 *     
 *     confirmResetPasswordRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *                 description: 重置密码token
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *                 description: 新密码
 *     
 *     createUserRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *                 description: 密码
 *               nickname:
 *                 type: string
 *                 maxLength: 50
 *                 description: 昵称
 *               phone:
 *                 type: string
 *                 pattern: '^1[3-9]\d{9}$'
 *                 description: 手机号
 *               role:
 *                 type: string
 *                 enum: [admin, user, guest]
 *                 description: 角色
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *                 description: 状态
 *     
 *     updateUserRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 description: 用户名
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 邮箱
 *               nickname:
 *                 type: string
 *                 maxLength: 50
 *                 description: 昵称
 *               phone:
 *                 type: string
 *                 pattern: '^1[3-9]\d{9}$'
 *                 description: 手机号
 *               avatar:
 *                 type: string
 *                 description: 头像URL
 *               role:
 *                 type: string
 *                 enum: [admin, user, guest]
 *                 description: 角色
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *                 description: 状态
 *     
 *     updateAvatarRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 description: 头像URL
 *     
 *     batchDeleteRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 用户ID列表
 *   
 *   responses:
 *     registerResponse:
 *       description: 注册成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *                       token:
 *                         type: string
 *                         description: JWT Token
 *     
 *     loginResponse:
 *       description: 登录成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *                       token:
 *                         type: string
 *                         description: JWT Token
 *     
 *     refreshResponse:
 *       description: Token刷新成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       token:
 *                         type: string
 *                         description: 新的JWT Token
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *     
 *     logoutResponse:
 *       description: 登出成功
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiResponse'
 *     
 *     changePasswordResponse:
 *       description: 密码修改成功
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiResponse'
 *     
 *     resetPasswordResponse:
 *       description: 重置密码邮件已发送
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 *                         description: 提示信息
 *                       resetToken:
 *                         type: string
 *                         description: 重置密码token（仅开发环境）
 *     
 *     confirmResetPasswordResponse:
 *       description: 密码重置成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 *                         description: 提示信息
 *     
 *     profileResponse:
 *       description: 获取用户信息成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     $ref: '#/components/schemas/User'
 *     
 *     getUsersResponse:
 *       description: 获取用户列表成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     allOf:
 *                       - $ref: '#/components/schemas/PaginationResponse'
 *                       - type: object
 *                         properties:
 *                           data:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/User'
 *     
 *     getUserResponse:
 *       description: 获取用户详情成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     $ref: '#/components/schemas/User'
 *     
 *     createUserResponse:
 *       description: 创建用户成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     $ref: '#/components/schemas/User'
 *     
 *     updateUserResponse:
 *       description: 更新用户成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     $ref: '#/components/schemas/User'
 *     
 *     deleteUserResponse:
 *       description: 删除用户成功
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiResponse'
 *     
 *     batchDeleteResponse:
 *       description: 批量删除用户成功
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiResponse'
 *     
 *     updateAvatarResponse:
 *       description: 更新头像成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     $ref: '#/components/schemas/User'
 *     
 *     getUserStatsResponse:
 *       description: 获取用户统计成功
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   data:
 *                     type: object
 *                     properties:
 *                       total:
 *                         type: integer
 *                         description: 总用户数
 *                       active:
 *                         type: integer
 *                         description: 活跃用户数
 *                       inactive:
 *                         type: integer
 *                         description: 非活跃用户数
 *                       banned:
 *                         type: integer
 *                         description: 被禁用用户数
 *                       roleStats:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             role:
 *                               type: string
 *                               description: 角色
 *                             count:
 *                               type: integer
 *                               description: 数量
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
