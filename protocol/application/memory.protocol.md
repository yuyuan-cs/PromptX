# memory 应用协议

> **TL;DR:** memory标签定义了AI系统的记忆管理框架，支持三种记忆类型(陈述性、程序性、情景记忆)和完整的记忆生命周期(评估、存储、调用)，使AI能够高效地创建和利用长期知识。

## 🔍 基本信息

**标签名:** `<memory>`
**版本:** 1.0.0
**类别:** 记忆
**状态:** 草稿

### 目的与功能

memory协议为AI系统提供完整的记忆能力框架，主要功能包括：
- 定义不同类型记忆的结构和语义
- 提供记忆评估、存储和检索的标准化机制
- 实现跨会话的信息持久化
- 支持复杂的记忆关联和检索模式

## 📝 语法定义

```ebnf
(* EBNF形式化定义 *)
memory_element ::= '<memory' attributes? '>' memory_content '</memory>'
attributes ::= (' ' attribute)+ | ''
attribute ::= name '="' value '"'
name ::= [a-zA-Z][a-zA-Z0-9_-]*
value ::= [^"]*

memory_content ::= (text | evaluate_element | store_element | recall_element)+

evaluate_element ::= '<evaluate:thought>' thought_content '</evaluate:thought>'
store_element ::= '<store:execution' attributes? '>' (text | execution_element)* '</store:execution>'
recall_element ::= '<recall:resource>' resource_reference '</recall:resource>'

thought_content ::= (* 符合thought协议的内容 *)
execution_element ::= (* 符合execution协议的元素 *)
resource_reference ::= (* 符合resource协议的引用 *)

text ::= (* 任何文本内容 *)
```

## 🧩 语义说明

memory标签表示AI系统的记忆管理单元，定义了记忆的结构和操作方式。它使用三层机制管理记忆的完整生命周期：

### 记忆操作

memory标签包含三个核心子标签，分别对应记忆的三个操作阶段：

1. **`<evaluate:thought>`**：评估信息是否值得记忆
   - 通过thought协议实现评估过程
   - 判断信息的价值、相关性和可信度
   - 决定是否将信息存入记忆系统

2. **`<store:execution>`**：将信息存入记忆系统
   - 通过execution协议实现存储操作
   - 定义存储过程、规则和约束
   - 管理记忆的添加、更新和组织

3. **`<recall:resource>`**：从记忆系统检索信息
   - 通过resource协议实现检索操作
   - 使用@memory://路径引用存储的记忆
   - 支持过滤、分页和条件检索

## 💡 最佳实践

### 记忆类型选择

协议实现可以根据需求采用不同的记忆类型分类方法，以下是基于认知心理学的常见分类：

1. **陈述性记忆(declarative)**：事实性知识，包括：
   - 语义记忆：通用事实，如"Python是编程语言"
   - 时态记忆：时间相关信息，如"上次会话在昨天"

2. **程序性记忆(procedural)**：过程和技能知识，如：
   - 操作步骤：如"解决环境配置问题的方法"
   - 行动模式：如"用户代码风格偏好"

3. **情景记忆(episodic)**：特定经历和场景，如：
   - 交互记录：如"用户之前遇到的报错"
   - 场景重建：如"项目开发历程"

不同类型记忆的选择建议：
- 存储事实性信息时，考虑使用陈述性记忆方式
- 存储方法和步骤时，考虑使用程序性记忆方式
- 存储具体交互经历时，考虑使用情景记忆方式

### 记忆操作使用

- **evaluate最佳实践**：
  - 明确设定评估标准
  - 综合考虑信息的稀有性、实用性和时效性
  - 避免过度记忆导致的信息冗余

- **store最佳实践**：
  - 为记忆提供足够的上下文
  - 建立适当的记忆关联
  - 设置合理的过期策略

- **recall最佳实践**：
  - 优先使用精确查询
  - 指定合理的置信度阈值
  - 处理记忆缺失的回退策略

## 📋 使用示例

### 基础使用示例

```html
<!-- 简单的记忆定义 -->
<memory id="os_preference">
  用户使用MacOS系统
</memory>

<!-- 带评估的记忆创建 -->
<memory id="code_style">
  <evaluate:thought>
    <reasoning>
      用户连续三次使用了相同的代码风格(缩进2空格、驼峰命名)，
      这是重要的个人偏好信息，应记住以提供一致的代码建议。
      评分：实用性=8，稳定性=9，总分8.5 > 阈值7.5
    </reasoning>
    <decision>store</decision>
  </evaluate:thought>
  
  <store:execution>
    {
      "indent": "2spaces",
      "naming": "camelCase",
      "brackets": "sameLine"
    }
  </store:execution>
</memory>
```

### 高级使用示例

```html
<!-- 完整的记忆生命周期示例 -->
<memory id="error_solution">
  <!-- 评估阶段：判断是否值得记忆 -->
  <evaluate:thought>
    <reasoning>
      分析用户遇到的依赖安装错误:
      
      1. 问题特点:
         - 特定版本冲突问题
         - 解决方法非官方文档所列
         - 多次在社区中被报告
      
      2. 记忆价值:
         - 解决方案不易找到
         - 可能重复出现
         - 节省未来排查时间
      
      记忆价值评分：9/10，超过阈值
      决策：应当记忆此解决方案
    </reasoning>
  </evaluate:thought>
  
  <!-- 存储阶段：通过execution实现 -->
  <store:execution>
    问题：TensorFlow 2.4安装与CUDA 11.2版本冲突
    解决方案：使用兼容性补丁并降级CUDA驱动
    
    <!-- 使用execution协议元素定义存储过程 -->
    <process>
      # 存储流程
      
      ```mermaid
      flowchart TD
        A[接收内容] --> B[验证格式]
        B --> C[分类标记]
        C --> D[构建索引]
        D --> E[写入持久存储]
      ```
    </process>
    
    <rule>
      1. 解决方案记忆优先级设为高
      2. 建立与相关技术的关联索引
      3. 保存完整的上下文信息
    </rule>
  </store:execution>
  
  <!-- 检索阶段：通过resource实现 -->
  <recall:resource>
    @memory://solutions/tensorflow?confidence=0.7
  </recall:resource>
</memory>
```

> **注意**：memory协议与thought(评估)、execution(存储)、resource(检索)协议紧密结合，形成完整的记忆系统。 