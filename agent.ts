import { Application } from 'egg';

export default class AgentBootHook {
  private readonly app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  configWillLoad() {
    // 此时 config 文件已经被读取并合并，但是还并未生效
    // 这是应用层修改配置的最后时机
    // 注意：此函数只支持同步调用
  }

  configDidLoad() {
    // 配置加载完成
    this.app.logger.info('Agent 配置加载完成');
  }

  async didLoad() {
    // 文件加载完成
    this.app.logger.info('Agent 文件加载完成');
  }

  async willReady() {
    // 插件启动完毕
    this.app.logger.info('Agent 插件启动完毕');
  }

  async didReady() {
    // Agent 准备就绪
    this.app.logger.info('Agent 准备就绪');
  }

  async serverDidReady() {
    // Agent 启动完成
    this.app.logger.info('Agent 启动完成');
  }

  async beforeClose() {
    // Agent 即将关闭
    this.app.logger.info('Agent 即将关闭');
  }
}
