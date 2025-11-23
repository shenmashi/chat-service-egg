import { app } from 'egg-mock';
import { expect } from 'chai';

describe('test/app/controller/home.test.ts', () => {
  it('should GET /', async () => {
    // 创建 app 实例
    const app = mock.app();
    await app.ready();
    
    // 发起请求
    const result = await app.httpRequest()
      .get('/health')
      .expect(200);
    
    expect(result.body.code).to.equal(200);
    expect(result.body.message).to.equal('系统运行正常');
    expect(result.body.data.status).to.equal('healthy');
  });
});
