/**
 * Post-install script to ensure Electron binary is properly installed
 * This solves the issue where Electron binary is not automatically downloaded
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find electron path in pnpm's node_modules
function findElectronPath() {
  const possiblePaths = [
    // Local node_modules
    path.join(__dirname, '..', 'node_modules', 'electron'),
    // Workspace root node_modules
    path.join(__dirname, '..', '..', '..', 'node_modules', 'electron'),
    // pnpm's .pnpm directory structure
    path.join(__dirname, '..', '..', '..', 'node_modules', '.pnpm', 'electron@28.3.3', 'node_modules', 'electron'),
  ];

  for (const electronPath of possiblePaths) {
    if (fs.existsSync(electronPath)) {
      return electronPath;
    }
  }

  console.log('❌ Electron package not found in expected locations');
  return null;
}

function installElectronBinary() {
  console.log('🔍 Checking Electron installation...');
  
  const electronPath = findElectronPath();
  if (!electronPath) {
    console.log('❌ Could not find Electron package. Please run pnpm install first.');
    return;
  }

  // Check if electron binary already exists
  try {
    const electronExe = require(electronPath);
    execSync(`"${electronExe}" --version`, { stdio: 'pipe' });
    console.log('✅ Electron binary is already installed');
    return;
  } catch (error) {
    console.log('📦 Installing Electron binary...');
  }

  // Run electron's install script
  const installScript = path.join(electronPath, 'install.js');
  if (!fs.existsSync(installScript)) {
    console.log('❌ Electron install script not found at:', installScript);
    return;
  }

  try {
    // Change to electron directory and run install
    const originalDir = process.cwd();
    process.chdir(electronPath);
    
    // Run the install script
    require(installScript);
    
    // Change back to original directory
    process.chdir(originalDir);
    
    console.log('✅ Electron binary installation initiated');
    console.log('ℹ️  The download may continue in the background');
  } catch (error) {
    console.error('❌ Failed to install Electron binary:', error.message);
    console.log('ℹ️  You may need to run: node', installScript);
  }
}

// Only run if this is the main module
if (require.main === module) {
  installElectronBinary();
}

module.exports = { installElectronBinary };