#!/bin/bash

# 企业级 Node.js + Egg.js API 框架启动脚本

echo "🚀 启动企业级 Node.js + Egg.js API 框架..."

# 检查 Node.js 版本
NODE_VERSION=$(node -v)
echo "📦 Node.js 版本: $NODE_VERSION"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖包..."
    npm install
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，请复制 env.example 并配置环境变量"
    echo "   cp env.example .env"
    echo "   然后编辑 .env 文件配置数据库和Redis连接信息"
    exit 1
fi

# 加载环境变量
export $(cat .env | grep -v '^#' | xargs)

# 检查数据库连接
echo "🔍 检查数据库连接..."
mysql -h${DB_HOST:-localhost} -P${DB_PORT:-3306} -u${DB_USERNAME:-root} -p${DB_PASSWORD} -e "SELECT 1;" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 数据库连接失败，请检查数据库配置"
    exit 1
fi
echo "✅ 数据库连接正常"

# 检查Redis连接
echo "🔍 检查Redis连接..."
redis-cli -h ${REDIS_HOST:-localhost} -p ${REDIS_PORT:-6379} ping 2>/dev/null | grep -q PONG
if [ $? -ne 0 ]; then
    echo "❌ Redis连接失败，请检查Redis配置"
    exit 1
fi
echo "✅ Redis连接正常"

# 运行数据库迁移
echo "🗄️  运行数据库迁移..."
npx sequelize-cli db:migrate
if [ $? -ne 0 ]; then
    echo "❌ 数据库迁移失败"
    exit 1
fi
echo "✅ 数据库迁移完成"

# 填充初始数据（如果数据库为空）
USER_COUNT=$(mysql -h${DB_HOST:-localhost} -P${DB_PORT:-3306} -u${DB_USERNAME:-root} -p${DB_PASSWORD} -D${DB_DATABASE} -e "SELECT COUNT(*) as count FROM users;" 2>/dev/null | tail -n 1)
if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 填充初始数据..."
    npx sequelize-cli db:seed:all
    echo "✅ 初始数据填充完成"
fi

# 构建TypeScript
echo "🔨 构建TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ TypeScript构建失败"
    exit 1
fi
echo "✅ TypeScript构建完成"

# 启动应用
echo "🎯 启动应用..."
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 生产环境启动"
    npm start
else
    echo "🛠️  开发环境启动"
    npm run dev
fi
