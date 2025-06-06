const { MCPOutputAdapter } = require('../../lib/adapters/MCPOutputAdapter');

describe('MCPOutputAdapter 单元测试', () => {
  let adapter;
  
  beforeEach(() => {
    adapter = new MCPOutputAdapter();
  });

  describe('基础功能测试', () => {
    test('MCPOutputAdapter类应该能创建', () => {
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(MCPOutputAdapter);
    });
    
    test('应该有convertToMCPFormat方法', () => {
      expect(typeof adapter.convertToMCPFormat).toBe('function');
    });
    
    test('应该有sanitizeText方法', () => {
      expect(typeof adapter.sanitizeText).toBe('function');
    });
    
    test('应该有handleError方法', () => {
      expect(typeof adapter.handleError).toBe('function');
    });
  });

  describe('文本转换测试', () => {
    test('应该保留emoji和中文字符', () => {
      const input = '🎯 PromptX 系统初始化完成！';
      const result = adapter.convertToMCPFormat(input);
      
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('🎯');
      expect(result.content[0].text).toContain('PromptX');
    });
    
    test('应该保留markdown格式', () => {
      const input = '## 🎯 角色激活总结\n✅ **assistant 角色已完全激活！**';
      const result = adapter.convertToMCPFormat(input);
      
      expect(result.content[0].text).toContain('##');
      expect(result.content[0].text).toContain('**');
      expect(result.content[0].text).toContain('✅');
    });
    
    test('应该处理复杂的PromptX输出格式', () => {
      const input = `============================================================
🎯 锦囊目的：激活特定AI角色，分析并生成具体的思维模式、行为模式和知识学习计划
============================================================

📜 锦囊内容：
🎭 **角色激活完成：assistant** - 所有技能已自动加载`;
      
      const result = adapter.convertToMCPFormat(input);
      
      expect(result.content[0].text).toContain('🎯');
      expect(result.content[0].text).toContain('📜');
      expect(result.content[0].text).toContain('🎭');
      expect(result.content[0].text).toContain('====');
    });
    
    test('应该处理多行内容', () => {
      const input = `行1\n行2\n行3`;
      const result = adapter.convertToMCPFormat(input);
      
      expect(result.content[0].text).toContain('行1');
      expect(result.content[0].text).toContain('行2');
      expect(result.content[0].text).toContain('行3');
    });
  });

  describe('对象输入处理测试', () => {
    test('应该处理PouchOutput对象', () => {
      const mockPouchOutput = {
        toString: () => '🎯 模拟的PouchOutput输出'
      };
      
      const result = adapter.convertToMCPFormat(mockPouchOutput);
      expect(result.content[0].text).toBe('🎯 模拟的PouchOutput输出');
    });
    
    test('应该处理普通对象', () => {
      const input = { message: '测试消息', status: 'success' };
      const result = adapter.convertToMCPFormat(input);
      
      expect(result.content[0].text).toContain('message');
      expect(result.content[0].text).toContain('测试消息');
    });
    
    test('应该处理null和undefined', () => {
      const nullResult = adapter.convertToMCPFormat(null);
      const undefinedResult = adapter.convertToMCPFormat(undefined);
      
      expect(nullResult.content[0].text).toBe('null');
      expect(undefinedResult.content[0].text).toBe('undefined');
    });
  });

  describe('错误处理测试', () => {
    test('应该处理转换错误', () => {
      const result = adapter.handleError(new Error('测试错误'));
      
      expect(result.content[0].text).toContain('❌');
      expect(result.content[0].text).toContain('测试错误');
      expect(result.isError).toBe(true);
    });
    
    test('应该处理未知错误', () => {
      const result = adapter.handleError('字符串错误');
      
      expect(result.content[0].text).toContain('❌');
      expect(result.content[0].text).toContain('字符串错误');
      expect(result.isError).toBe(true);
    });
    
    test('错误输出应该符合MCP格式', () => {
      const result = adapter.handleError(new Error('测试'));
      
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0].type).toBe('text');
      expect(typeof result.content[0].text).toBe('string');
    });
  });

  describe('边界情况测试', () => {
    test('应该处理空字符串', () => {
      const result = adapter.convertToMCPFormat('');
      expect(result.content[0].text).toBe('');
    });
    
    test('应该处理非常长的文本', () => {
      const longText = 'a'.repeat(10000);
      const result = adapter.convertToMCPFormat(longText);
      expect(result.content[0].text).toBe(longText);
    });
    
    test('应该处理特殊字符', () => {
      const specialChars = '\\n\\r\\t"\'{|}[]()';
      const result = adapter.convertToMCPFormat(specialChars);
      expect(result.content[0].text).toContain(specialChars);
    });
  });

  describe('输出格式验证测试', () => {
    test('输出应该始终符合MCP content格式', () => {
      const inputs = [
        'simple text',
        '🎯 emoji text',
        { object: 'data' },
        ['array', 'data'],
        null,
        undefined
      ];
      
      inputs.forEach(input => {
        const result = adapter.convertToMCPFormat(input);
        
        // 验证MCP标准格式
        expect(result).toHaveProperty('content');
        expect(Array.isArray(result.content)).toBe(true);
        expect(result.content).toHaveLength(1);
        expect(result.content[0]).toHaveProperty('type', 'text');
        expect(result.content[0]).toHaveProperty('text');
        expect(typeof result.content[0].text).toBe('string');
      });
    });
  });
}); 