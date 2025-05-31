const ResourceProtocolParser = require('../../../lib/core/resource/resourceProtocolParser');
const { 
  LoadingSemantics, 
  ParsedReference, 
  QueryParams 
} = require('../../../lib/core/resource/types');

describe('ResourceProtocolParser - Unit Tests', () => {
  let parser;

  beforeEach(() => {
    parser = new ResourceProtocolParser();
  });

  describe('基础语法解析', () => {
    test('应该解析基本的资源引用', () => {
      const result = parser.parse('@prompt://protocols');
      
      expect(result.protocol).toBe('prompt');
      expect(result.path).toBe('protocols');
      expect(result.loadingSemantics).toBe(LoadingSemantics.DEFAULT);
      expect(result.isNested).toBe(false);
    });

    test('应该解析带查询参数的资源引用', () => {
      const result = parser.parse('@file://test.md?line=5-10&cache=true');
      
      expect(result.protocol).toBe('file');
      expect(result.path).toBe('test.md');
      expect(result.queryParams.line).toBe('5-10');
      expect(result.queryParams.cache).toBe(true);
    });

    test('应该解析热加载语义', () => {
      const result = parser.parse('@!prompt://core');
      
      expect(result.protocol).toBe('prompt');
      expect(result.path).toBe('core');
      expect(result.loadingSemantics).toBe(LoadingSemantics.HOT_LOAD);
    });

    test('应该解析懒加载语义', () => {
      const result = parser.parse('@?file://lazy-resource.md');
      
      expect(result.protocol).toBe('file');
      expect(result.path).toBe('lazy-resource.md');
      expect(result.loadingSemantics).toBe(LoadingSemantics.LAZY_LOAD);
    });
  });

  describe('嵌套引用解析', () => {
    test('应该解析简单嵌套引用', () => {
      const result = parser.parse('@prompt://@file://nested.md');
      
      expect(result.protocol).toBe('prompt');
      expect(result.isNested).toBe(true);
      expect(result.nestedRef.inner.protocol).toBe('file');
      expect(result.nestedRef.inner.path).toBe('nested.md');
    });

    test('应该解析多层嵌套引用', () => {
      const result = parser.parse('@prompt://@memory://@file://deep.md');
      
      expect(result.protocol).toBe('prompt');
      expect(result.isNested).toBe(true);
      expect(result.nestedRef.inner.protocol).toBe('memory');
      expect(result.nestedRef.inner.isNested).toBe(true);
      expect(result.nestedRef.depth).toBe(2);
    });
  });

  describe('查询参数解析', () => {
    test('应该解析多个查询参数', () => {
      const params = parser.parseQueryParams('line=1-10&format=json&cache=true');
      
      expect(params.line).toBe('1-10');
      expect(params.format).toBe('json');
      expect(params.cache).toBe(true);
    });

    test('应该处理空查询参数', () => {
      const params = parser.parseQueryParams('');
      
      expect(params.getAll()).toEqual({});
    });

    test('应该处理URL编码的参数', () => {
      const params = parser.parseQueryParams('query=%E4%B8%AD%E6%96%87');
      
      expect(params.get('query')).toBe('中文');
    });
  });

  describe('语法验证', () => {
    test('应该验证有效的语法', () => {
      expect(parser.validateSyntax('@prompt://protocols')).toBe(true);
      expect(parser.validateSyntax('@!file://test.md')).toBe(true);
      expect(parser.validateSyntax('@?memory://declarative')).toBe(true);
    });

    test('应该拒绝无效的语法', () => {
      expect(parser.validateSyntax('prompt://protocols')).toBe(false); // 缺少@
      expect(parser.validateSyntax('@://test')).toBe(false); // 空协议
      expect(parser.validateSyntax('@123protocol://test')).toBe(false); // 协议名不能以数字开头
      expect(parser.validateSyntax('')).toBe(false); // 空字符串
    });
  });

  describe('错误处理', () => {
    test('应该抛出适当的错误信息', () => {
      expect(() => parser.parse('')).toThrow('Invalid resource reference');
      expect(() => parser.parse(null)).toThrow('Invalid resource reference');
      expect(() => parser.parse('invalid')).toThrow('Invalid resource reference syntax');
    });
  });

  describe('工具方法', () => {
    test('应该正确提取协议名', () => {
      expect(parser.extractProtocol('@prompt://protocols')).toBe('prompt');
      expect(parser.extractProtocol('@!file://test.md')).toBe('file');
    });

    test('应该正确提取路径', () => {
      expect(parser.extractPath('@prompt://protocols?format=json')).toBe('protocols');
      expect(parser.extractPath('@file://path/to/file.md')).toBe('path/to/file.md');
    });

    test('应该正确提取查询参数', () => {
      expect(parser.extractParams('@file://test.md?line=5-10')).toBe('line=5-10');
      expect(parser.extractParams('@file://test.md')).toBe('');
    });
  });
}); 