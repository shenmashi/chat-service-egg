<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>企业级 Node.js + Egg.js API 框架</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 600px;
            width: 90%;
        }
        
        .logo {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        h1 {
            color: #2c3e50;
            margin-bottom: 1rem;
            font-size: 2rem;
        }
        
        .subtitle {
            color: #7f8c8d;
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }
        
        .status {
            background: #27ae60;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            display: inline-block;
            margin-bottom: 2rem;
            font-weight: 500;
        }
        
        .links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        
        .link {
            display: block;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 10px;
            text-decoration: none;
            color: #495057;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .link:hover {
            background: #e9ecef;
            border-color: #667eea;
            transform: translateY(-2px);
        }
        
        .link-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #2c3e50;
        }
        
        .link-desc {
            font-size: 0.9rem;
            color: #6c757d;
        }
        
        .footer {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1>企业级 Node.js + Egg.js API 框架</h1>
        <p class="subtitle">基于 TypeScript 的高性能 RESTful API 服务</p>
        
        <div class="status">✅ 系统运行正常</div>
        
        <div class="links">
            <a href="/swagger-ui.html" class="link">
                <div class="link-title">📚 API 文档</div>
                <div class="link-desc">Swagger 在线文档</div>
            </a>
            
            <a href="/health" class="link">
                <div class="link-title">💚 健康检查</div>
                <div class="link-desc">系统状态监控</div>
            </a>
            
            <a href="/api/users" class="link">
                <div class="link-title">👥 用户管理</div>
                <div class="link-desc">用户相关 API</div>
            </a>
            
            <a href="/api/articles" class="link">
                <div class="link-title">📝 文章管理</div>
                <div class="link-desc">文章相关 API</div>
            </a>
        </div>
        
        <div class="footer">
            <p>技术栈: Egg.js + TypeScript + MySQL + Redis + JWT</p>
            <p>版本: 1.0.0 | 环境: {{ env }}</p>
        </div>
    </div>
</body>
</html>
