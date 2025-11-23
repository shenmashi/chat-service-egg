const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function verifyUser() {
  try {
    // 尝试用不同的用户名登录，看看能获取到什么用户ID
    const usernames = ['testuser', 'admin', 'user1', 'test'];
    
    for (const username of usernames) {
      console.log(`\n尝试登录用户: ${username}`);
      const response = await makeRequest({
        hostname: 'localhost',
        port: 7001,
        path: '/api/v1/users/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { username, password: '123456' });
      
      if (response.data && response.data.data && response.data.data.user) {
        console.log(`✅ 用户 ${username} 存在:`, {
          id: response.data.data.user.id,
          username: response.data.data.user.username,
          email: response.data.data.user.email
        });
        
        // 使用这个用户ID测试创建会话
        const userId = response.data.data.user.id;
        console.log(`\n测试为用户 ${userId} 创建会话...`);
        
        // 模拟start_chat事件的数据
        const startChatData = { userId };
        console.log('start_chat 数据:', startChatData);
        
        // 这里我们无法直接测试数据库操作，但可以确认用户ID是有效的
        console.log(`✅ 用户ID ${userId} 有效，可以用于创建会话`);
        break;
      } else {
        console.log(`❌ 用户 ${username} 不存在或密码错误`);
      }
    }
    
  } catch (error) {
    console.error('验证用户失败:', error.message);
  }
}

verifyUser();
