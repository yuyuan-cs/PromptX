/**
 * MCP 工具定义 - 共享配置
 * 统一管理所有MCP工具的描述和Schema定义，避免重复维护
 */

/**
 * 工具定义配置
 */
const TOOL_DEFINITIONS = [
  {
    name: 'promptx_init',
    description: '🎯 [AI专业能力启动器] ⚡ 让你瞬间拥有任何领域的专家级思维和技能 - 一键激活丰富的专业角色库(产品经理/开发者/设计师/营销专家等)，获得跨对话记忆能力，30秒内从普通AI变身行业专家。**多项目支持**：现在支持多个IDE/项目同时使用，项目间完全隔离。**必须使用场景**：1️⃣系统首次使用时；2️⃣创建新角色后刷新注册表；3️⃣角色激活(action)出错时重新发现角色；4️⃣查看当前版本号；5️⃣项目路径发生变化时。每次需要专业服务时都应该先用这个',
    inputSchema: {
      type: 'object',
      properties: {
        workingDirectory: {
          type: 'string',
          description: '当前项目的工作目录绝对路径。AI应该知道当前工作的项目路径，请提供此参数。'
        },
        ideType: {
          type: 'string',
          description: 'IDE或编辑器类型，如：cursor, vscode, claude等。完全可选，不提供则自动检测为unknown。'
        }
      },
      required: ['workingDirectory']
    },
    convertToCliArgs: (args) => {
      if (args && args.workingDirectory) {
        return [{ workingDirectory: args.workingDirectory, ideType: args.ideType }];
      }
      return [];
    }
  },
  {
    name: 'promptx_welcome',
    description: '🎭 [专业角色选择菜单] 🔥 当你需要专业能力时必须先看这个 - 展示大量可激活的专家身份清单：产品经理/Java开发者/UI设计师/文案策划师/数据分析师/项目经理等，每个角色都有完整的专业思维模式和工作技能。🛑 **多项目环境重要提醒**：使用此工具时必须首先关注并响应工具返回结果开头的项目环境验证提示。如检测到多项目绑定，请明确指定要查看的项目。确认项目路径正确后再处理角色列表内容，看完后选择最适合当前任务的专家身份',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    convertToCliArgs: () => []
  },
  {
    name: 'promptx_action',
    description: '⚡ [专家身份变身器] 🚀 让你瞬间获得指定专业角色的完整思维和技能包 - 输入角色ID立即获得该领域专家的思考方式/工作原则/专业知识，同时自动加载相关历史经验和最佳实践，3秒内完成专业化转换。🛑 **多项目环境重要提醒**：如果角色激活失败提示"不存在"，请先使用 init 工具刷新注册表，特别是在女娲等工具创建新角色后。使用此工具时必须首先关注并响应工具返回结果开头的项目环境验证提示。如检测到多项目绑定，请在对话中明确指定要操作的项目名称或路径。确认项目路径正确后再处理角色激活内容，每次需要专业服务时必须使用',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: '要激活的角色ID，如：copywriter, product-manager, java-backend-developer'
        }
      },
      required: ['role']
    },
    convertToCliArgs: (args) => args && args.role ? [args.role] : []
  },
  {
    name: 'promptx_learn',
    description: '🧠 [专业技能学习器] 💎 让你快速掌握特定专业技能和思维方式 - 学习创意思维/最佳实践/敏捷开发/产品设计等专业能力，支持thought://(思维模式) execution://(执行技能) knowledge://(专业知识)三种学习类型。🛑 **多项目环境重要提醒**：使用此工具时必须首先关注并响应工具返回结果开头的项目环境验证提示。如检测到多项目绑定，请明确指定要学习的项目上下文。确认项目路径正确后再处理学习内容，学会后立即可以运用到工作中，想要专业化成长时使用',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          description: '资源URL，支持格式：thought://creativity, execution://best-practice, knowledge://scrum'
        }
      },
      required: ['resource']
    },
    convertToCliArgs: (args) => args && args.resource ? [args.resource] : []
  },
  {
    name: 'promptx_recall',
    description: `🔍 [智能记忆检索器] PromptX专业AI记忆体系的核心检索工具
基于认知心理学检索线索理论，智能检索指定角色的专业经验和知识。

何时使用此工具:
- 处理涉及私有信息的任务（用户背景、项目细节、组织结构）
- 遇到预训练知识无法覆盖的专业领域问题
- 需要了解特定技术栈的历史决策和配置信息
- 感知到语义鸿沟需要外部专业知识补充
- 用户提及过往经验或类似问题的解决方案
- 当前任务上下文触发了相关记忆线索
- 需要避免重复已解决问题的错误路径
- 个性化服务需要了解用户偏好和工作习惯

核心检索能力:
- 基于三层检索策略：关键词精确匹配、语义相关分析、时空关联检索
- 支持XML技术记忆的转义字符还原和格式美化
- 智能相关性评估：直接相关、间接相关、背景相关、结构相关
- 渐进式信息呈现：摘要优先、结构化展示、按需详情展开
- 上下文驱动的记忆激活和关联分析
- 自动识别记忆时效性并提供更新建议
- 跨记忆关联发现和知识图谱构建

使用前置条件:
- 必须已通过promptx_action激活PromptX角色
- 激活后将自动切换到PromptX专业记忆体系
- 客户端原生记忆功能将被禁用以避免冲突
- 确保检索目标与当前激活角色匹配

检索策略说明:
- query参数：仅在确信能精确匹配时使用（如"女娲"、"PromptX"、"MCP"等专有名词）
- 语义搜索：不确定时留空query获取全量记忆进行语义匹配
- **强制补充检索**：如使用query参数检索无结果，必须立即无参数全量检索
- **检索优先级**：全量检索 > 部分匹配 > 空结果，宁可多检索也不遗漏
- **用户查询场景**：对于用户的自然语言查询（如"明天安排"、"项目进度"等），优先使用全量检索

你应该:
1. 感知到预训练知识不足时主动触发记忆检索
2. 优先检索与当前任务上下文最相关的专业记忆
3. 根据检索线索调整查询策略提升检索精度
4. 利用检索结果建立当前任务的知识上下文
5. 识别记忆时效性对过时信息进行标记提醒
6. 将检索到的经验应用到当前问题的解决方案中
7. **关键策略：如果使用query参数没有检索到结果，必须立即使用无参数方式全量检索**
8. 宁可多检索也不要遗漏重要的相关记忆信息`,
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: '要检索记忆的角色ID，如：java-developer, product-manager, copywriter'
        },
        query: {
          type: 'string',
          description: '检索关键词，仅在确信能精确匹配时使用（如"女娲"、"PromptX"等具体词汇）。语义搜索或不确定时请留空以获取全量记忆，如果使用关键字无结果建议重试无参数方式'
        },
        random_string: {
          type: 'string',
          description: 'Dummy parameter for no-parameter tools'
        }
      },
      required: ['role', 'random_string']
    },
    convertToCliArgs: (args) => {
      if (!args || !args.role) {
        throw new Error('role 参数是必需的');
      }
      const result = [];
      
      // role参数作为第一个位置参数
      result.push(args.role);
      
      // 处理query参数
      if (args && args.query && typeof args.query === 'string' && args.query.trim() !== '') {
        result.push(args.query);
      }
      
      return result;
    }
  },
  {
    name: 'promptx_remember',
    description: `💾 [智能记忆存储器] PromptX专业AI记忆体系的核心存储工具
将重要经验和知识智能处理后永久保存到指定角色的专业记忆库中。

何时使用此工具:
- 用户分享个人化信息：具体的计划、偏好、背景情况
- 用户提供项目特定信息：工作内容、进展、配置、决策
- 用户描述经验性信息：解决问题的方法、遇到的困难、得到的教训
- 用户进行纠错性信息：对AI回答的修正、补充、澄清
- 通过工具调用获得新的文件内容、数据查询结果
- 从互联网获取了训练截止后的最新技术信息
- 每轮对话结束时识别到有价值的用户特定信息

核心处理能力:
- 自动识别信息类型并应用对应的奥卡姆剃刀压缩策略
- 智能生成3-5个语义相关的分类标签避免重复
- 基于价值评估机制筛选高价值信息存储
- 支持XML技术内容的转义处理和格式优化
- 实现角色隔离存储确保专业记忆的独立性
- 自动去重检测避免冗余记忆的累积
- 提取最小完整信息保持记忆库的简洁高效

使用前置条件:
- 必须已通过promptx_action激活PromptX角色
- 激活后将自动切换到PromptX专业记忆体系
- 客户端原生记忆功能将被禁用以避免冲突
- 确保当前角色与要存储的记忆内容匹配

参数详细说明:
- role: 目标角色ID，记忆将绑定到此专业角色的知识库
- content: 原始信息内容，工具将自动进行智能优化处理  
- tags: 可选自定义标签，工具会基于内容自动生成补充标签

🧠 智能记忆判断策略:
当用户分享以下类型信息时，立即评估记忆价值：

📍 个人化信息：用户的具体计划、偏好、背景情况
📍 项目特定信息：具体的工作内容、进展、配置、决策
📍 经验性信息：解决问题的方法、遇到的困难、得到的教训
📍 纠错性信息：对AI回答的修正、补充、澄清

记忆决策原则:
- 这是通用知识还是用户特定信息？
- 这对提升后续服务质量有帮助吗？
- 不确定时，倾向于记忆而不是遗漏

你应该:
1. 每轮对话结束时主动评估是否有值得记忆的新信息
2. 基于语义理解而非关键词匹配来判断记忆价值
3. 优先记忆大模型训练数据中不存在的私有专业信息
4. 保持记忆内容的简洁性，核心价值信息优于详细描述
5. 当不确定是否值得记忆时，倾向于记忆而不是遗漏`,
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: '要保存记忆的角色ID，如：java-developer, product-manager, copywriter'
        },
        content: {
          type: 'string',
          description: '要保存的重要信息或经验'
        },
        tags: {
          type: 'string',
          description: '自定义标签，用空格分隔，可选'
        }
      },
      required: ['role', 'content']
    },
    convertToCliArgs: (args) => {
      if (!args || !args.role) {
        throw new Error('role 参数是必需的');
      }
      if (!args || !args.content) {
        throw new Error('content 参数是必需的');
      }
      const result = [];
      
      // role参数作为第一个位置参数
      result.push(args.role);
      
      // 然后是内容
      result.push(args.content);
      
      // 处理tags参数
      if (args.tags) {
        result.push('--tags', args.tags);
      }
      
      return result;
    }
  },
  {
    name: 'promptx_tool',
    description: `🔧 [工具执行器] 执行通过@tool协议声明的JavaScript功能工具
⚠️ **使用前提**：必须先阅读并理解工具说明书，禁止盲目调用！

🚫 **严格禁止**：
- 在不了解工具功能的情况下调用
- 未阅读说明书就尝试使用
- 猜测工具用途和参数
- 用于任何角色管理操作

✅ **使用前必须**：
1. 已通过@manual://tool-name查看并理解工具说明书
2. 明确知道工具的功能、参数和返回值
3. 理解工具的使用场景和限制
4. 确认这是解决当前问题的正确工具

何时可以使用:
- 已阅读工具说明书(@manual://协议)，明确知道其功能
- 用户明确要求使用某个已知的@tool工具
- 解决的问题正好匹配工具的设计用途
- 所有必需参数都已准备就绪

如何确认已"阅读说明书":
- 通过@manual://tool-name协议查看了工具手册
- 理解了<manual>标签中的五个组件内容
- 明确知道每个参数的含义和类型
- 了解工具可能的错误情况

错误使用示例:
❌ "我猜这个工具可能是用来..."
❌ "试试看这个工具能不能..."
❌ "可能需要先用tool看看有什么..."
❌ "用tool激活一下角色..."

正确使用示例:
✅ "根据@manual://calculator的说明，这个工具可以进行数学计算"
✅ "用户要求使用@tool://email-sender，我已通过manual了解其参数格式"

记住：不了解就不要用！如有疑问，请先查看@manual://协议的工具文档。`,
    inputSchema: {
      type: 'object',
      properties: {
        tool_resource: {
          type: 'string',
          description: '工具资源引用，格式：@tool://tool-name，如@tool://calculator',
          pattern: '^@tool://.+'
        },
        parameters: {
          type: 'object',
          description: '传递给工具的参数对象'
        },
        rebuild: {
          type: 'boolean',
          description: '是否强制重建沙箱（默认false）。用于处理异常情况如node_modules损坏、权限问题等。正常情况下会自动检测依赖变化',
          default: false
        },
        timeout: {
          type: 'number',
          description: '工具执行超时时间（毫秒），默认30000ms',
          default: 30000
        }
      },
      required: ['tool_resource', 'parameters']
    },
    convertToCliArgs: (args) => {
      if (!args || !args.tool_resource || !args.parameters) {
        throw new Error('tool_resource 和 parameters 参数是必需的');
      }
      const result = [args.tool_resource, args.parameters];
      
      if (args.rebuild) {
        result.push('--rebuild');
      }
      
      if (args.timeout) {
        result.push('--timeout', args.timeout);
      }
      
      return result;
    }
  }
];

/**
 * 获取所有工具定义 - 用于MCP Server
 */
function getToolDefinitions() {
  return TOOL_DEFINITIONS.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }));
}

/**
 * 获取指定工具的定义
 */
function getToolDefinition(toolName) {
  return TOOL_DEFINITIONS.find(tool => tool.name === toolName);
}

/**
 * 获取指定工具的参数转换函数
 */
function getToolCliConverter(toolName) {
  const tool = getToolDefinition(toolName);
  return tool ? tool.convertToCliArgs : null;
}

/**
 * 获取所有工具名称
 */
function getToolNames() {
  return TOOL_DEFINITIONS.map(tool => tool.name);
}

module.exports = {
  TOOL_DEFINITIONS,
  getToolDefinitions,
  getToolDefinition,
  getToolCliConverter,
  getToolNames
}; 