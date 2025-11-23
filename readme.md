# 客服聊天系统

一个基于 Egg.js + React + Socket.IO 的实时客服聊天系统，支持用户端和客服端的实时通信、文件上传、历史记录等功能。

## 🚀 技术栈

### 后端技术栈
- **框架**: [Egg.js](https://eggjs.org/) - 企业级 Node.js 框架
- **数据库**: MySQL 8.0+ - 关系型数据库
- **ORM**: [Sequelize](https://sequelize.org/) - 数据库 ORM 框架
- **实时通信**: [Socket.IO](https://socket.io/) - 实时双向通信
- **身份验证**: JWT (JSON Web Tokens) - 无状态身份验证
- **文件上传**: [Multer](https://github.com/expressjs/multer) - 文件上传中间件
- **图片处理**: [Sharp](https://sharp.pixelplumbing.com/) - 高性能图片处理
- **定时任务**: [egg-schedule](https://github.com/eggjs/egg-schedule) - 定时任务调度
- **API文档**: [Swagger](https://swagger.io/) - API 文档生成
- **缓存**: Redis (可选) - 数据缓存

### 前端技术栈

**前端项目地址**: [egg-chat-frontend](https://github.com/shenmashi/egg-chat-frontend)

- **框架**: [React 18](https://reactjs.org/) - 用户界面库
- **UI组件库**: [Ant Design](https://ant.design/) - 企业级 UI 设计语言
- **状态管理**: React Hooks (useState, useEffect, useCallback)
- **HTTP客户端**: [Axios](https://axios-http.com/) - Promise 基础 HTTP 客户端
- **实时通信**: [socket.io-client](https://socket.io/docs/v4/client-api/) - Socket.IO 客户端
- **路由**: [React Router](https://reactrouter.com/) - 声明式路由
- **构建工具**: [Vite](https://vitejs.dev/) - 下一代前端构建工具
- **TypeScript**: 类型安全的 JavaScript 超集
- **样式**: CSS-in-JS + Ant Design 主题定制

## 📁 项目目录结构

```
node-egg/
├── app/                          # 应用核心代码
│   ├── controller/               # 控制器层
│   │   └── api/                 # API 控制器
│   │       └── v1/              # API v1 版本
│   │           ├── user.ts      # 用户相关 API
│   │           ├── customerService.ts  # 客服相关 API
│   │           ├── chat.ts      # 聊天相关 API
│   │           └── file.ts      # 文件上传 API
│   ├── model/                   # 数据模型层
│   │   ├── user.ts             # 用户模型
│   │   ├── customerService.ts  # 客服模型
│   │   ├── chatSession.ts      # 聊天会话模型
│   │   └── chatMessage.ts      # 聊天消息模型
│   ├── service/                 # 业务逻辑层
│   │   ├── cache.ts            # 缓存服务
│   │   ├── permission.ts       # 权限服务
│   │   └── sms.ts              # 短信服务
│   ├── middleware/              # 中间件
│   │   ├── authJwt.ts          # JWT 认证中间件
│   │   ├── cache.ts            # 缓存中间件
│   │   └── checkPermission.ts  # 权限检查中间件
│   ├── extend/                  # 框架扩展
│   │   ├── socket.ts           # Socket.IO 扩展
│   │   ├── application.ts      # 应用扩展
│   │   ├── context.ts          # 上下文扩展
│   │   └── helper.ts           # 辅助函数扩展
│   ├── schedule/                # 定时任务
│   │   ├── cleanExpiredCache.ts    # 清理过期缓存
│   │   ├── cleanExpiredTokens.ts   # 清理过期令牌
│   │   └── generateStatsReport.ts  # 生成统计报告
│   ├── swagger/                 # API 文档
│   │   └── swagger.ts          # Swagger 配置
│   ├── utils/                   # 工具函数
│   │   └── index.ts            # 通用工具函数
│   ├── public/                  # 静态资源
│   │   ├── uploads/            # 上传文件存储
│   │   │   └── chat/           # 聊天文件
│   │   │       └── thumbnails/ # 缩略图
│   │   └── reset.css           # 重置样式
│   └── view/                    # 视图模板
│       └── home.tpl            # 首页模板
├── config/                      # 配置文件
│   ├── config.default.ts       # 默认配置
│   ├── config.local.ts         # 本地开发配置
│   ├── config.prod.ts          # 生产环境配置
│   ├── config.test.ts          # 测试环境配置
│   ├── config.unittest.ts      # 单元测试配置
│   ├── plugin.ts               # 插件配置
│   └── schedule.ts             # 定时任务配置
├── database/                    # 数据库相关
│   ├── config.js               # 数据库配置
│   ├── migrations/             # 数据库迁移
│   │   └── 20231201000001-create-tables.js
│   └── seeders/                # 数据库种子数据
│       └── 20231201000001-demo-data.js
├── frontend/                    # 前端项目
│   └── customer-service-chat/  # 客服聊天前端
│       ├── public/             # 静态资源
│       ├── src/                # 源代码
│       │   ├── components/     # React 组件
│       │   │   ├── Login.tsx   # 登录组件
│       │   │   ├── Dashboard.tsx      # 客服端仪表板
│       │   │   ├── UserDashboard.tsx  # 用户端仪表板
│       │   │   └── ChatInterface.tsx  # 聊天界面组件
│       │   ├── services/       # 服务层
│       │   │   ├── api.ts      # API 服务
│       │   │   └── socket.ts   # Socket.IO 服务
│       │   ├── types/          # TypeScript 类型定义
│       │   ├── App.tsx         # 应用根组件
│       │   └── main.tsx        # 应用入口
│       ├── package.json        # 前端依赖配置
│       └── vite.config.ts      # Vite 构建配置
├── logs/                        # 日志文件
├── test/                        # 测试文件
├── typings/                     # TypeScript 类型定义
├── dist/                        # 编译输出目录
├── node_modules/                # Node.js 依赖
├── package.json                 # 项目依赖配置
├── tsconfig.json               # TypeScript 配置
├── ecosystem.config.js         # PM2 进程管理配置
├── Dockerfile                  # Docker 镜像配置
├── docker-compose.yml          # Docker Compose 配置
└── nginx.conf                  # Nginx 配置
```

## 🛠️ 环境要求

### 系统要求
- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0
- **MySQL**: >= 8.0
- **Redis**: >= 6.0 (可选)

### 开发工具
- **IDE**: VS Code (推荐)
- **数据库管理**: MySQL Workbench 或 Navicat
- **API测试**: Postman 或 Insomnia

## ⚙️ 配置说明

### 1. 环境变量配置

创建 `.env` 文件在项目根目录：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=customer_service_chat
DB_USERNAME=root
DB_PASSWORD=your_password

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Redis 配置 (可选)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 文件上传配置
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf

# 服务器配置
PORT=7001
HOST=0.0.0.0

# 前端配置
FRONTEND_URL=http://localhost:3000
```

### 2. 数据库配置

#### 创建数据库
```sql
CREATE DATABASE customer_service_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 运行数据库迁移
```bash
npm run db:migrate
```

#### 运行数据库种子数据
```bash
npm run db:seed
```

### 3. 前端配置

前端项目独立仓库: [egg-chat-frontend](https://github.com/shenmashi/egg-chat-frontend)

前端项目位于 `frontend/customer-service-chat/` 目录，需要单独配置：

```bash
cd frontend/customer-service-chat
npm install
```

## 🚀 运行部署

### 开发环境

#### 1. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend/customer-service-chat
npm install
```

#### 2. 启动后端服务
```bash
# 开发模式启动
npm run dev

# 或者使用 PM2 启动
npm run start:pm2
```

#### 3. 启动前端服务
```bash
cd frontend/customer-service-chat
npm run dev
```

#### 4. 访问应用
- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:7001
- **API文档**: http://localhost:7001/swagger-ui.html

### 生产环境

#### 1. 构建前端
```bash
cd frontend/customer-service-chat
npm run build
```

#### 2. 构建后端
```bash
npm run build
```

#### 3. 使用 PM2 部署
```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart all
```

#### 4. 使用 Docker 部署
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:7001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.IO 代理
    location /socket.io {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📋 功能特性

### 用户端功能
- ✅ 用户注册/登录
- ✅ 实时聊天通信
- ✅ 文件/图片上传
- ✅ 历史聊天记录
- ✅ 客服状态查看
- ✅ 自动重连机制
- ✅ 消息已读状态

### 客服端功能
- ✅ 客服登录/登出
- ✅ 等待用户列表
- ✅ 会话管理 (接受/拒绝/转移)
- ✅ 实时消息收发
- ✅ 文件/图片上传
- ✅ 用户信息查看
- ✅ 聊天统计
- ✅ 多客服并发支持

### 系统功能
- ✅ JWT 身份验证
- ✅ 权限管理
- ✅ 数据缓存
- ✅ 定时任务
- ✅ 日志记录
- ✅ API 文档
- ✅ 数据库迁移

## 🔧 开发指南

### 添加新的 API 接口

1. 在 `app/controller/api/v1/` 下创建控制器
2. 在 `app/router.ts` 中注册路由
3. 在 `app/swagger/swagger.ts` 中添加文档

### 添加新的数据库模型

1. 在 `app/model/` 下创建模型文件
2. 在 `database/migrations/` 下创建迁移文件
3. 运行迁移: `npm run db:migrate`

### 添加新的前端组件

1. 在 `frontend/customer-service-chat/src/components/` 下创建组件
2. 在 `frontend/customer-service-chat/src/types/` 下添加类型定义
3. 在 `frontend/customer-service-chat/src/services/` 下添加 API 服务

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 MySQL 服务是否启动
   - 验证数据库配置信息
   - 确认数据库用户权限

2. **Socket.IO 连接失败**
   - 检查端口是否被占用
   - 验证 CORS 配置
   - 查看浏览器控制台错误

3. **文件上传失败**
   - 检查上传目录权限
   - 验证文件大小限制
   - 确认文件类型配置

4. **前端构建失败**
   - 清除 node_modules 重新安装
   - 检查 Node.js 版本
   - 验证 TypeScript 配置

### 日志查看

```bash
# 查看应用日志
tail -f logs/egg-agent.log
tail -f logs/egg-schedule.log
tail -f logs/common-error.log

# 查看 PM2 日志
pm2 logs

# 查看 Docker 日志
docker-compose logs -f
```

## 📄 许可证

MIT License


**注意**: 请确保在生产环境中修改默认的 JWT 密钥和数据库密码，并启用 HTTPS。
