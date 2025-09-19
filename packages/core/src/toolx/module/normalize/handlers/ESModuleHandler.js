/**
 * ESModuleHandler - ES Module 处理器
 *
 * 处理带有 __esModule 标记的模块
 * 优先返回 default 导出
 */

const ModuleHandler = require('../base/ModuleHandler');

class ESModuleHandler extends ModuleHandler {
  constructor() {
    super('ESModuleHandler', 30); // 优先级30
  }

  async process(module) {
    if (!module || typeof module !== 'object') {
      return { handled: false };
    }

    // 检查 ES Module 标记
    if (module.__esModule) {
      // 优先返回 default，但要确保它有实质内容
      if (module.default !== undefined) {
        return { handled: true, result: module.default };
      }
      // 没有 default 但是 ES Module，返回整个模块
      return { handled: true, result: module };
    }

    return { handled: false };
  }
}

module.exports = ESModuleHandler;