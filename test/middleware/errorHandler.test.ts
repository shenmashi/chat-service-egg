import { app } from 'egg-mock';
import { expect } from 'chai';

describe('test/app/middleware/errorHandler.test.ts', () => {
  it('should handle validation error', async () => {
    const app = mock.app();
    await app.ready();
    
    // 模拟验证错误
    const result = await app.httpRequest()
      .post('/api/auth/register')
      .send({
        username: 'a', // 用户名太短
        email: 'invalid-email', // 无效邮箱
        password: '123', // 密码太短
      })
      .expect(400);
    
    expect(result.body.code).to.equal(400);
    expect(result.body.message).to.equal('参数验证失败');
  });

  it('should handle not found error', async () => {
    const app = mock.app();
    await app.ready();
    
    const result = await app.httpRequest()
      .get('/api/users/999999')
      .expect(404);
    
    expect(result.body.code).to.equal(404);
    expect(result.body.message).to.equal('用户不存在');
  });
});
