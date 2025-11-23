const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ROOT_DIR = path.join(__dirname, '..');

console.log('🚀 开始构建部署包（遵循 Egg.js 官方推荐方式）...\n');

// 参考：https://www.eggjs.org/zh-CN/core/deployment

// 1. 清理 dist 目录
console.log('📁 准备部署目录...');
if (fs.existsSync(DIST_DIR)) {
  // 保留 .env 和 logs 目录
  const items = fs.readdirSync(DIST_DIR);
  for (const item of items) {
    if (item !== '.env' && item !== 'logs' && item !== 'node_modules') {
      const itemPath = path.join(DIST_DIR, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
    }
  }
} else {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 2. 编译 TypeScript（官方文档中 TypeScript 项目需要先编译）
console.log('🔨 编译 TypeScript...');
try {
  execSync('npx tsc', { stdio: 'inherit', cwd: ROOT_DIR });
  console.log('✅ TypeScript 编译完成\n');
} catch (error) {
  console.error('❌ TypeScript 编译失败');
  process.exit(1);
}

// 3. 复制必要文件到 dist（官方推荐：打包整个项目目录）
console.log('📋 复制配置文件...');

// 复制完整的 package.json（官方推荐：需要包含 scripts 和依赖信息）
// 官方文档说明：package.json 需要包含 start/stop scripts 和 dependencies
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
const distPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  private: packageJson.private,
  engines: packageJson.engines,
  // 保留 scripts（官方推荐：npm start 需要调用 egg-scripts）
  scripts: {
    start: packageJson.scripts.start,
    stop: packageJson.scripts.stop,
  },
  // 保留所有 dependencies（生产环境需要）
  dependencies: packageJson.dependencies,
  // 不包含 devDependencies（生产环境不需要）
  // 保留 egg 配置（如果需要）
  ...(packageJson.egg ? { egg: packageJson.egg } : {}),
};
fs.writeFileSync(
  path.join(DIST_DIR, 'package.json'),
  JSON.stringify(distPackageJson, null, 2),
  'utf8'
);
console.log('  ✓ package.json (包含 scripts 和 dependencies，符合官方推荐)');

// 复制 package-lock.json（官方推荐：用于锁定版本）
const packageLockPath = path.join(ROOT_DIR, 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
  fs.copyFileSync(packageLockPath, path.join(DIST_DIR, 'package-lock.json'));
  console.log('  ✓ package-lock.json');
}

// 复制 ecosystem.config.js（PM2 配置，可选但推荐）
const ecosystemSrc = path.join(ROOT_DIR, 'ecosystem.config.js');
if (fs.existsSync(ecosystemSrc)) {
  fs.copyFileSync(ecosystemSrc, path.join(DIST_DIR, 'ecosystem.config.js'));
  console.log('  ✓ ecosystem.config.js');
}

// 复制 .env.example
const envExample = path.join(ROOT_DIR, 'env.example');
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, path.join(DIST_DIR, 'env.example'));
  console.log('  ✓ env.example');
}

console.log('✅ 配置文件复制完成\n');

// 4. 复制静态资源
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
console.log('✅ 静态资源复制完成\n');

// 5. 安装生产依赖（官方推荐：npm install --production）
console.log('📥 安装生产依赖（官方推荐方式）...');
try {
  // 官方推荐：使用 npm install --production
  // 这会根据 package.json 的 dependencies 安装，忽略 devDependencies
  // 参考：https://www.eggjs.org/zh-CN/core/deployment
  console.log('  📦 正在安装生产依赖（这可能需要几分钟）...');
  execSync('npm install --production', {
    stdio: 'inherit',
    cwd: DIST_DIR,
    env: {
      ...process.env,
      npm_config_progress: 'true',
      npm_config_loglevel: 'warn',
    },
  });
  console.log('✅ 生产依赖安装完成\n');
} catch (error) {
  console.error('\n❌ 依赖安装失败');
  console.error('   提示：可以在服务器上手动运行: npm install --production');
  console.error('   参考官方文档：https://www.eggjs.org/zh-CN/core/deployment');
  console.error('\n⚠️  继续构建，但部署时需要手动安装依赖\n');
}

// 6. 不生成启动脚本和文档（只复制必要的运行文件）

console.log('\n✅ 构建完成（遵循 Egg.js 官方推荐方式）！\n');
console.log('📦 部署包位置:', DIST_DIR);
console.log('\n📋 部署步骤:');
console.log('   1. 进入部署目录');
console.log('   2. 运行: npm install --production (如果构建时没安装依赖)');
console.log('   3. 运行: npm start (官方推荐，使用 egg-scripts)');
console.log('   或使用 PM2: pm2 start ecosystem.config.js --env production\n');
console.log('📚 参考官方文档: https://www.eggjs.org/zh-CN/core/deployment\n');

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

// 不再生成启动脚本和文档，只保留运行必需的文件

