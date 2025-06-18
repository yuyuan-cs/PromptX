/**
 * Document Action Module for DACP PromptX Service
 * 提供文档创建和管理功能
 */

// Create document action
async function create_document(parameters) {
  const { user_request, context = {} } = parameters;
  
  if (!user_request) {
    throw new Error('user_request is required for create_document action');
  }

  // 解析文档请求
  const docData = parseDocumentRequest(user_request, context);
  
  // 验证文档数据
  validateDocumentData(docData);
  
  // 执行文档创建（Demo模式）
  const result = await executeCreateDocument(docData, context);
  
  return result;
}

// 解析文档请求
function parseDocumentRequest(userRequest, context) {
  // 分析文档类型
  let docType = '通用文档';
  let format = 'markdown';
  let template = 'default';
  
  if (userRequest.includes('报告')) {
    docType = '工作报告';
    template = 'report';
  } else if (userRequest.includes('方案')) {
    docType = '技术方案';
    template = 'proposal';
  } else if (userRequest.includes('需求')) {
    docType = '需求文档';
    template = 'requirement';
  } else if (userRequest.includes('总结')) {
    docType = '项目总结';
    template = 'summary';
  } else if (userRequest.includes('计划')) {
    docType = '工作计划';
    template = 'plan';
  }
  
  // 提取关键信息
  const title = extractTitle(userRequest, docType);
  const content = generateDocumentContent(userRequest, docType, template, context);
  
  return {
    title: title,
    type: docType,
    format: format,
    template: template,
    content: content,
    metadata: {
      author: context.author || 'DACP User',
      created_at: new Date().toISOString(),
      version: '1.0.0',
      tags: extractTags(userRequest, docType)
    },
    originalRequest: userRequest
  };
}

// 提取文档标题
function extractTitle(userRequest, docType) {
  // 尝试从请求中提取明确的标题
  const titleMatch = userRequest.match(/《(.+?)》|"(.+?)"|'(.+?)'/);
  if (titleMatch) {
    return titleMatch[1] || titleMatch[2] || titleMatch[3];
  }
  
  // 根据文档类型生成默认标题
  const date = new Date().toLocaleDateString('zh-CN');
  return `${docType} - ${date}`;
}

// 提取标签
function extractTags(userRequest, docType) {
  const tags = [docType];
  
  // 根据关键词添加标签
  if (userRequest.includes('紧急')) tags.push('紧急');
  if (userRequest.includes('重要')) tags.push('重要');
  if (userRequest.includes('项目')) tags.push('项目管理');
  if (userRequest.includes('技术')) tags.push('技术文档');
  
  return tags;
}

// 生成文档内容
function generateDocumentContent(userRequest, docType, template, context) {
  let content = '';
  
  switch (template) {
    case 'report':
      content = generateReportTemplate(userRequest, context);
      break;
    case 'proposal':
      content = generateProposalTemplate(userRequest, context);
      break;
    case 'requirement':
      content = generateRequirementTemplate(userRequest, context);
      break;
    case 'summary':
      content = generateSummaryTemplate(userRequest, context);
      break;
    case 'plan':
      content = generatePlanTemplate(userRequest, context);
      break;
    default:
      content = generateDefaultTemplate(userRequest, context);
  }
  
  return content;
}

// 生成报告模板
function generateReportTemplate(userRequest, context) {
  const date = new Date().toLocaleDateString('zh-CN');
  return `# 工作报告

## 报告信息
- 日期：${date}
- 作者：${context.author || 'DACP User'}
- 部门：${context.department || '技术部'}

## 概述
${userRequest}

## 工作内容
### 本期完成工作
1. [待填写]
2. [待填写]
3. [待填写]

### 关键成果
- [待填写]

## 问题与风险
1. **问题**：[待填写]
   - **影响**：[待填写]
   - **解决方案**：[待填写]

## 下期计划
1. [待填写]
2. [待填写]

## 资源需求
- [待填写]

---
*本文档由 DACP Document Service 自动生成*`;
}

// 生成方案模板
function generateProposalTemplate(userRequest, context) {
  return `# 技术方案

## 方案概述
${userRequest}

## 背景与目标
### 项目背景
[待填写]

### 预期目标
1. [待填写]
2. [待填写]

## 技术架构
### 整体架构
[待填写架构说明]

### 技术选型
| 技术栈 | 选择 | 理由 |
|--------|------|------|
| 前端 | [待填写] | [待填写] |
| 后端 | [待填写] | [待填写] |
| 数据库 | [待填写] | [待填写] |

## 实施计划
### 第一阶段（时间）
- [待填写]

### 第二阶段（时间）
- [待填写]

## 风险评估
| 风险项 | 影响程度 | 应对措施 |
|--------|----------|----------|
| [待填写] | 高/中/低 | [待填写] |

---
*本文档由 DACP Document Service 自动生成*`;
}

// 生成默认模板
function generateDefaultTemplate(userRequest, context) {
  const date = new Date().toLocaleDateString('zh-CN');
  return `# 文档标题

## 文档信息
- 创建日期：${date}
- 作者：${context.author || 'DACP User'}
- 版本：1.0.0

## 内容
${userRequest}

## 详细说明
[请在此处添加详细内容]

## 附录
[如有附加信息，请在此处添加]

---
*本文档由 DACP Document Service 自动生成*`;
}

// 其他模板函数省略，保持代码简洁...

// 验证文档数据
function validateDocumentData(docData) {
  const errors = [];
  
  if (!docData.title || docData.title.trim().length === 0) {
    errors.push('Document title cannot be empty');
  }
  
  if (!docData.content || docData.content.trim().length === 0) {
    errors.push('Document content cannot be empty');
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
}

// 执行文档创建
async function executeCreateDocument(docData, context) {
  // Demo模式：模拟文档创建
  console.log('📄 [DACP Demo] Simulating document creation:');
  console.log(`   Title: ${docData.title}`);
  console.log(`   Type: ${docData.type}`);
  console.log(`   Format: ${docData.format}`);
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 生成文档ID
  const docId = `doc_${Date.now()}`;
  
  return {
    document_id: docId,
    status: 'created',
    title: docData.title,
    type: docData.type,
    format: docData.format,
    content: docData.content,
    metadata: docData.metadata,
    file_path: `/documents/${docId}.${docData.format}`,
    preview_url: `https://docs.example.com/preview/${docId}`,
    created_at: docData.metadata.created_at,
    demo_mode: true,
    execution_metrics: {
      parsing_time: '20ms',
      template_generation: '50ms',
      validation_time: '5ms',
      creation_time: '200ms'
    }
  };
}

// 简化的其他模板生成函数
function generateRequirementTemplate(userRequest, context) {
  return generateDefaultTemplate(userRequest, context);
}

function generateSummaryTemplate(userRequest, context) {
  return generateDefaultTemplate(userRequest, context);
}

function generatePlanTemplate(userRequest, context) {
  return generateDefaultTemplate(userRequest, context);
}

// 导出所有document相关的actions
module.exports = {
  create_document
};