const { getGlobalResourceManager } = require('./src/lib/core/resource');

async function testToolResource() {
  try {
    const rm = getGlobalResourceManager();
    if (!rm.initialized) {
      await rm.initializeWithNewArchitecture();
    }
    
    console.log('🔍 Testing tool resource loading...');
    const result = await rm.loadResource('@tool://calculator');
    console.log('✅ Tool resource loaded successfully:', result);
  } catch (error) {
    console.log('❌ Tool resource loading failed:', error.message);
    console.log('Error details:', error);
  }
}

testToolResource();