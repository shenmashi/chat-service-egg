const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ROOT_DIR = path.join(__dirname, '..');

console.log('🚀 开始构建独立部署包...\n');

// 1. 清理 dist 目录（保留 node_modules 如果存在）
console.log('📁 准备部署目录...');
if (fs.existsSync(DIST_DIR)) {
  // 备份 node_modules（如果存在）
  const nodeModulesPath = path.join(DIST_DIR, 'node_modules');
  const nodeModulesBackup = path.join(DIST_DIR, 'node_modules.backup');
  
  if (fs.existsSync(nodeModulesPath)) {
    if (fs.existsSync(nodeModulesBackup)) {
      fs.rmSync(nodeModulesBackup, { recursive: true, force: true });
    }
    fs.renameSync(nodeModulesPath, nodeModulesBackup);
  }
  
  // 清理其他文件（保留 .env 和 logs）
  const items = fs.readdirSync(DIST_DIR);
  for (const item of items) {
    if (item !== 'node_modules.backup' && item !== '.env' && item !== 'logs') {
      const itemPath = path.join(DIST_DIR, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
    }
  }
  
  // 恢复 node_modules
  if (fs.existsSync(nodeModulesBackup)) {
    fs.renameSync(nodeModulesBackup, nodeModulesPath);
  }
} else {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 2. 编译 TypeScript
console.log('🔨 编译 TypeScript...');
try {
  execSync('npx tsc', { stdio: 'inherit', cwd: ROOT_DIR });
  console.log('✅ TypeScript 编译完成\n');
} catch (error) {
  console.error('❌ TypeScript 编译失败');
  process.exit(1);
}

// 3. 复制必要文件
console.log('📋 复制配置文件...');

// 复制 ecosystem.config.js
const ecosystemSrc = path.join(ROOT_DIR, 'ecosystem.config.js');
const ecosystemDst = path.join(DIST_DIR, 'ecosystem.config.js');
if (fs.existsSync(ecosystemSrc)) {
  fs.copyFileSync(ecosystemSrc, ecosystemDst);
  console.log('  ✓ ecosystem.config.js');
}

// 创建最小化 package.json（只包含必要信息，不包含依赖列表）
console.log('  ✓ package.json (最小化版本)');
createMinimalPackageJson(DIST_DIR);

// 复制其他文件
const filesToCopy = [
  'README.md',
  'WINDOWS-SERVER-DEPLOY.md',
  'BUILD-DEPLOY.md',
];

for (const file of filesToCopy) {
  const src = path.join(ROOT_DIR, file);
  const dst = path.join(DIST_DIR, file);
  
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dst);
      console.log(`  ✓ ${file}`);
    } catch (error) {
      console.warn(`  ⚠️  复制 ${file} 失败: ${error.message}`);
    }
  }
}

// 不复制 package-lock.json（因为依赖已安装，不需要）

// 复制 .env.example（如果存在）
const envExample = path.join(ROOT_DIR, 'env.example');
const envExampleDist = path.join(DIST_DIR, 'env.example');
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envExampleDist);
  console.log('  ✓ env.example');
}

console.log('✅ 配置文件复制完成\n');

// 4. 复制必要的静态资源
console.log('📦 复制静态资源...');
const staticDirs = ['app/public'];
for (const dir of staticDirs) {
  const srcDir = path.join(ROOT_DIR, dir);
  const dstDir = path.join(DIST_DIR, dir);
  
  if (fs.existsSync(srcDir)) {
    copyDir(srcDir, dstDir);
    console.log(`  ✓ ${dir}`);
  }
}

// 5. 安装生产依赖到 dist
console.log('\n📥 安装生产依赖到部署包...');
const distPackageJson = path.join(DIST_DIR, 'package.json');
if (!fs.existsSync(distPackageJson)) {
  console.error('❌ dist/package.json 不存在');
  process.exit(1);
}

try {
  // 检查是否已安装依赖
  const nodeModulesPath = path.join(DIST_DIR, 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    // 检查 node_modules 是否为空或损坏
    const nodeModulesItems = fs.readdirSync(nodeModulesPath);
    if (nodeModulesItems.length > 0) {
      console.log('  ℹ️  node_modules 已存在，跳过安装');
      console.log('  💡 如需重新安装，请删除 dist/node_modules 目录');
    } else {
      // node_modules 为空，需要安装
      installDependencies();
    }
  } else {
    // node_modules 不存在，需要安装
    installDependencies();
  }
} catch (error) {
  console.error('\n❌ 依赖安装失败');
  console.error('   提示：可以在服务器上手动运行: npm ci --only=production');
  console.error('\n⚠️  继续构建，但部署时需要手动安装依赖\n');
}

// 安装依赖函数
function installDependencies() {
  console.log('  📦 正在安装生产依赖（这可能需要几分钟）...');
  execSync('npm ci --only=production', {
    stdio: 'inherit',
    cwd: DIST_DIR,
    env: {
      ...process.env,
      npm_config_progress: 'false',
      npm_config_loglevel: 'error',
    },
  });
  console.log('✅ 生产依赖安装完成\n');
}

// 6. 创建启动脚本
console.log('📝 创建启动脚本...');
createStartScripts(DIST_DIR);

// 7. 生成部署说明
console.log('\n📄 生成部署说明...');
createDeployReadme(DIST_DIR);

console.log('\n✅ 独立部署包构建完成！\n');
console.log('📦 部署包位置:', DIST_DIR);
console.log('📋 部署包内容:');
console.log('   - 编译后的代码 (app.js, app/, config/)');
console.log('   - 生产依赖 (node_modules/)');
console.log('   - 配置文件 (ecosystem.config.js, package.json[最小化])');
console.log('   - 启动脚本 (start.bat, start.sh)');
console.log('\n💡 说明:');
console.log('   - package.json 已优化为最小化版本（不包含依赖列表）');
console.log('   - 所有依赖已打包到 node_modules/，无需运行 npm install');
console.log('   - 可以完全删除 package.json（如果不需要）');
console.log('\n🚀 部署步骤:');
console.log('   1. 将 dist 目录内容上传到服务器');
console.log('   2. 配置 .env 文件');
console.log('   3. 运行 start.bat (Windows) 或 start.sh (Linux/Mac)');
console.log('   或使用 PM2: pm2 start ecosystem.config.js --env production\n');

// 创建最小化 package.json
function createMinimalPackageJson(distDir) {
  const rootPackageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  
  // 创建最小化版本：只保留必要的元数据
  const minimalPackageJson = {
    name: rootPackageJson.name,
    version: rootPackageJson.version,
    description: rootPackageJson.description,
    private: rootPackageJson.private,
    // 保留 engines 以标识 Node.js 版本要求
    engines: rootPackageJson.engines || {},
    // 不包含 dependencies、devDependencies（因为依赖已在 node_modules）
    // 不包含 scripts（因为使用 PM2 启动，不通过 npm scripts）
  };
  
  // 如果有 egg 配置，也保留（Egg.js 可能读取）
  if (rootPackageJson.egg) {
    minimalPackageJson.egg = rootPackageJson.egg;
  }
  
  const distPackageJsonPath = path.join(distDir, 'package.json');
  fs.writeFileSync(distPackageJsonPath, JSON.stringify(minimalPackageJson, null, 2), 'utf8');
}

// 辅助函数：复制目录
function copyDir(src, dst) {
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const dstPath = path.join(dst, item);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

// 创建启动脚本
function createStartScripts(distDir) {
  // Windows 启动脚本
  const startBat = `@echo off
chcp 65001 >nul
echo 启动应用...
cd /d "%~dp0"
if not exist "node_modules" (
    echo [错误] node_modules 不存在，请先安装依赖
    echo 执行: npm ci --only=production
    pause
    exit /b 1
)
pm2 start ecosystem.config.js --env production
echo.
echo 应用已启动！
echo 查看状态: pm2 list
echo 查看日志: pm2 logs custom_service
pause
`;
  fs.writeFileSync(path.join(distDir, 'start.bat'), startBat, 'utf8');
  console.log('  ✓ start.bat');

  // Linux/Mac 启动脚本
  const startSh = `#!/bin/bash
echo "启动应用..."
cd "$(dirname "$0")"
if [ ! -d "node_modules" ]; then
    echo "[错误] node_modules 不存在，请先安装依赖"
    echo "执行: npm ci --only=production"
    exit 1
fi
pm2 start ecosystem.config.js --env production
echo ""
echo "应用已启动！"
echo "查看状态: pm2 list"
echo "查看日志: pm2 logs custom_service"
`;
  fs.writeFileSync(path.join(distDir, 'start.sh'), startSh, 'utf8');
  // 设置执行权限（在 Windows 上会被忽略）
  try {
    fs.chmodSync(path.join(distDir, 'start.sh'), 0o755);
  } catch (e) {
    // Windows 上忽略错误
  }
  console.log('  ✓ start.sh');
}

// 创建部署说明
function createDeployReadme(distDir) {
  const readme = `# 独立部署包

此目录包含完整的应用部署包，**已包含所有生产依赖**，可以直接部署到服务器。

## 📦 部署包内容

- ✅ **编译后的代码** - app.js, app/, config/, agent.js
- ✅ **生产依赖** - node_modules/ (已安装)
- ✅ **配置文件** - ecosystem.config.js, package.json
- ✅ **启动脚本** - start.bat (Windows), start.sh (Linux/Mac)

## 🚀 快速部署

### Windows 服务器

1. 将整个目录上传到服务器，例如: \`C:\\www\\custom_service\\\`

2. 配置环境变量（创建 \`.env\` 文件）:
   \`\`\`
   copy env.example .env
   notepad .env
   \`\`\`

3. 启动应用:
   \`\`\`
   start.bat
   \`\`\`
   
   或使用 PM2:
   \`\`\`
   pm2 start ecosystem.config.js --env production
   \`\`\`

### Linux/Mac 服务器

1. 将整个目录上传到服务器

2. 配置环境变量:
   \`\`\`
   cp env.example .env
   nano .env
   \`\`\`

3. 设置执行权限并启动:
   \`\`\`
   chmod +x start.sh
   ./start.sh
   \`\`\`

## ⚠️ 重要提示

1. **依赖已包含**：此部署包已包含所有生产依赖，无需运行 \`npm install\`

2. **环境变量**：必须配置 \`.env\` 文件，包含数据库和 Redis 连接信息

3. **PM2**：如果使用 PM2，请确保已全局安装: \`npm install pm2 -g\`

4. **端口**：默认端口 7001，确保防火墙允许访问

## 🔄 更新部署

如需更新应用：

1. 停止应用: \`pm2 stop custom_service\`
2. 备份当前版本（可选）
3. 替换文件（保留 \`.env\` 和 \`logs\` 目录）
4. 如果依赖有更新，删除 \`node_modules\` 并重新运行构建脚本
5. 重启应用: \`pm2 restart custom_service\`

## 📝 更多信息

详细部署文档请参考:
- \`WINDOWS-SERVER-DEPLOY.md\` - Windows Server 部署指南
- \`DEPLOY.md\` - 通用部署指南
`;

  fs.writeFileSync(path.join(distDir, 'DEPLOY-README.md'), readme, 'utf8');
  console.log('  ✓ DEPLOY-README.md');
}

