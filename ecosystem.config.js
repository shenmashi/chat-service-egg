const path = require('path');
const fs = require('fs');

// 智能检测项目结构和部署方式
// 支持场景：
// 1. 从项目根目录运行（ecosystem.config.js 在根目录）
// 2. 从 dist 目录运行（ecosystem.config.js 在 dist 目录）
// 3. 从其他目录运行（需要自动检测）

let projectRoot = __dirname;
let workingDir = __dirname; // 实际工作目录（用于 cwd）

// 判断 ecosystem.config.js 是否在 dist 目录
const isInDist = __dirname.includes(path.sep + 'dist' + path.sep) || 
                 __dirname.endsWith(path.sep + 'dist');

if (isInDist) {
  // 如果在 dist 目录，项目根目录是上一级
  projectRoot = path.join(__dirname, '..');
}

// 检查 node_modules 和 app.js 的位置
// 优先级：1. 当前目录（__dirname） 2. 项目根目录 3. dist 目录
let nodeModulesPath;
let hasNodeModules = false;
let appJsPath = null;

// 方案1：检查当前目录（适用于 dist 目录部署）
nodeModulesPath = path.join(__dirname, 'node_modules');
hasNodeModules = fs.existsSync(nodeModulesPath);
if (hasNodeModules) {
  // 同时检查 app.js 是否在当前目录
  const currentAppJs = path.join(__dirname, 'app.js');
  if (fs.existsSync(currentAppJs)) {
    appJsPath = currentAppJs;
    workingDir = __dirname; // 从当前目录运行
  }
}

// 方案2：检查项目根目录（适用于项目根目录部署）
if (!hasNodeModules || !appJsPath) {
  const rootNodeModules = path.join(projectRoot, 'node_modules');
  const rootHasNodeModules = fs.existsSync(rootNodeModules);
  const rootAppJs = path.join(projectRoot, 'app.js');
  const rootDistAppJs = path.join(projectRoot, 'dist', 'app.js');
  
  if (rootHasNodeModules && (fs.existsSync(rootAppJs) || fs.existsSync(rootDistAppJs))) {
    if (!hasNodeModules) {
      nodeModulesPath = rootNodeModules;
      hasNodeModules = true;
    }
    if (!appJsPath) {
      // 优先使用 dist/app.js（编译后的），否则使用根目录的 app.js
      appJsPath = fs.existsSync(rootDistAppJs) ? rootDistAppJs : rootAppJs;
      workingDir = projectRoot; // 从项目根目录运行
    }
  }
}

// 方案3：检查 dist 目录的 node_modules（适用于从项目根目录运行，但依赖在 dist）
if (!hasNodeModules && projectRoot !== __dirname) {
  const distNodeModulesPath = path.join(projectRoot, 'dist', 'node_modules');
  if (fs.existsSync(distNodeModulesPath)) {
    nodeModulesPath = distNodeModulesPath;
    hasNodeModules = true;
  }
}

// 方案4：检查 dist 目录的 app.js（如果还没找到）
if (!appJsPath) {
  const distAppJs = path.join(projectRoot, 'dist', 'app.js');
  const currentDistAppJs = path.join(__dirname, 'app.js');
  
  if (fs.existsSync(distAppJs)) {
    appJsPath = distAppJs;
    workingDir = projectRoot; // 从项目根目录运行，但使用 dist/app.js
  } else if (fs.existsSync(currentDistAppJs)) {
    appJsPath = currentDistAppJs;
    workingDir = __dirname; // 从当前目录运行
  }
}

// 根据是否有 node_modules 决定启动方式
// 参考 Egg.js 官方文档：https://www.eggjs.org/zh-CN/core/deployment
let script, args;
if (hasNodeModules) {
  // 有 node_modules：使用 egg-scripts 启动（官方推荐方式）
  // 方式1：使用 egg-scripts/lib/start-cluster（推荐，兼容性最好）
  const startClusterPath = path.join(nodeModulesPath, 'egg-scripts/lib/start-cluster');
  if (fs.existsSync(startClusterPath + '.js')) {
    script = startClusterPath;
    args = '--title=egg-server-node-egg-enterprise-api';
  } else {
    // 方式2：回退到 egg-scripts/bin/egg-scripts.js
    const eggScriptsPath = path.join(nodeModulesPath, 'egg-scripts/bin/egg-scripts.js');
    if (fs.existsSync(eggScriptsPath)) {
      script = eggScriptsPath;
      args = 'start --title=egg-server-node-egg-enterprise-api';
    } else {
      console.warn(`[PM2 Config] ⚠️  警告: egg-scripts 不存在于 ${nodeModulesPath}`);
      hasNodeModules = false;
    }
  }
}

if (!hasNodeModules) {
  // 没有 node_modules：直接使用 node 运行编译后的 app.js
  // ⚠️ 注意：应用运行时仍需要 node_modules 中的依赖（egg、sequelize、mysql2 等）
  // ⚠️ 生产环境必须执行：npm ci --only=production
  
  if (appJsPath && fs.existsSync(appJsPath)) {
    // 使用找到的 app.js
    script = 'node';
    args = appJsPath;
  } else {
    // 回退到 npx egg-scripts（可能失败，因为运行时需要依赖）
    console.warn('[PM2 Config] ⚠️  警告: 未找到 app.js，尝试使用 npx egg-scripts');
    script = 'npx';
    args = '--yes egg-scripts start --title=egg-server-node-egg-enterprise-api';
  }
}

// 确保日志目录存在（相对于工作目录）
const logsDir = path.join(workingDir, 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (err) {
    console.warn('[PM2 Config] ⚠️  无法创建 logs 目录:', err.message);
  }
}

// 调试信息（可选，生产环境可注释掉）
if (process.env.NODE_ENV !== 'production' || process.env.PM2_DEBUG) {
  console.log('[PM2 Config] 配置文件位置:', __dirname);
  console.log('[PM2 Config] 是否在 dist 目录:', isInDist);
  console.log('[PM2 Config] 项目根目录:', projectRoot);
  console.log('[PM2 Config] 工作目录 (cwd):', workingDir);
  console.log('[PM2 Config] node_modules 路径:', nodeModulesPath || '未找到');
  console.log('[PM2 Config] 是否有 node_modules:', hasNodeModules);
  console.log('[PM2 Config] app.js 路径:', appJsPath || '未找到');
  console.log('[PM2 Config] 启动脚本:', script, args || '');
  console.log('[PM2 Config] 日志目录:', path.join(workingDir, 'logs'));
}

module.exports = {
  apps: [{
    name: 'custom_service',
    script: script,
    args: args,
    instances: 1, // Egg.js 已经内置了集群模式，不需要 PM2 的 cluster 模式
    exec_mode: 'fork',
    cwd: workingDir, // 工作目录（自动检测，适配不同部署场景）
    env: {
      NODE_ENV: 'development', // 使用 local 环境（会加载 config.local.ts）
    },
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '2048M', // Windows Server 64位可以设置更高
    // Windows Server 64位 内存优化配置
    // 64位系统支持更大内存，但为稳定性考虑，设置为 2.5GB
    node_args: process.platform === 'win32' 
      ? '--max_old_space_size=2560 --optimize-for-size' // Windows 64位使用 2.5GB
      : '--max_old_space_size=2048', // Linux/Mac 使用 2GB
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist'],
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 3, // 进一步减少重启次数
    min_uptime: '30s', // 增加最小运行时间，避免频繁重启
    autorestart: true, // 明确启用自动重启
    stop_exit_codes: [0], // 只有退出码为 0 才不重启
    restart_delay: 5000, // 重启延迟 5 秒，给系统释放内存的时间
  }],
};
