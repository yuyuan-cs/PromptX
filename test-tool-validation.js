const fs = require('fs');
const path = require('path');

// 测试工具文件验证
function testToolValidation() {
  const toolPath = path.join(process.cwd(), 'prompt/tool/calculator.tool.js');
  console.log(`🔍 Testing tool validation for: ${toolPath}`);
  
  try {
    const content = fs.readFileSync(toolPath, 'utf8');
    console.log('📄 File content loaded, length:', content.length);
    
    // 模拟我们的验证逻辑
    console.log('✅ Contains module.exports:', content.includes('module.exports'));
    console.log('✅ Contains getMetadata:', content.includes('getMetadata'));
    console.log('✅ Contains execute:', content.includes('execute'));
    
    // 尝试语法检查
    try {
      new Function(content);
      console.log('✅ JavaScript syntax is valid');
    } catch (syntaxError) {
      console.log('❌ JavaScript syntax error:', syntaxError.message);
    }
    
  } catch (error) {
    console.log('❌ Failed to read file:', error.message);
  }
}

testToolValidation();