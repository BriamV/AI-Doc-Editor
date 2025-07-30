/**
 * Diagnosis Tool for ToolChecker Windows PATH Resolution Issues
 * Investigates why Python tools exist physically but aren't detected
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== DIAGNOSIS: Windows Python Tools Detection ===');
console.log('Working Directory:', process.cwd());
console.log('Node.js Version:', process.version);
console.log('Platform:', process.platform);
console.log('Environment Variables:');
console.log('  MSYSTEM:', process.env.MSYSTEM || 'undefined');
console.log('  TERM:', process.env.TERM || 'undefined');
console.log('  OS:', process.env.OS || 'undefined');
console.log();

// Check physical files
console.log('=== PHYSICAL FILE VERIFICATION ===');
const toolsToCheck = ['black', 'pylint', 'pip'];

for (const toolName of toolsToCheck) {
  console.log(`${toolName}:`);
  
  // Windows paths
  const windowsPath = `.venv/Scripts/${toolName}.exe`;
  const windowsPathResolved = path.resolve(windowsPath);
  console.log(`  Windows path (relative): ${windowsPath}`);
  console.log(`  Windows path (resolved): ${windowsPathResolved}`);
  console.log(`  Windows exists (relative): ${fs.existsSync(windowsPath)}`);
  console.log(`  Windows exists (resolved): ${fs.existsSync(windowsPathResolved)}`);
  
  // Unix paths  
  const unixPath = `.venv/bin/${toolName}`;
  const unixPathResolved = path.resolve(unixPath);
  console.log(`  Unix path (relative): ${unixPath}`);
  console.log(`  Unix path (resolved): ${unixPathResolved}`);
  console.log(`  Unix exists (relative): ${fs.existsSync(unixPath)}`);
  console.log(`  Unix exists (resolved): ${fs.existsSync(unixPathResolved)}`);
  console.log();
}

// Check PATH environment
console.log('=== PATH ENVIRONMENT ANALYSIS ===');
const currentPath = process.env.PATH || '';
console.log('PATH length:', currentPath.length);
console.log('PATH includes .venv:', currentPath.includes('.venv'));
console.log('PATH includes Scripts:', currentPath.includes('Scripts'));
console.log('PATH includes bin:', currentPath.includes('bin'));

// Check PATH entries related to project
const pathEntries = currentPath.split(path.delimiter);
const projectVenvEntries = pathEntries.filter(entry => 
  entry.includes('.venv') || 
  entry.includes(process.cwd())
);
console.log('Project-related PATH entries:', projectVenvEntries);
console.log();

// Test actual command execution
console.log('=== COMMAND EXECUTION TESTS ===');
const commandTests = [
  'black --version',
  '.venv/Scripts/black.exe --version',
  'pylint --version', 
  '.venv/Scripts/pylint.exe --version'
];

for (const cmd of commandTests) {
  try {
    console.log(`Testing: ${cmd}`);
    const output = execSync(cmd, { 
      stdio: 'pipe', 
      timeout: 5000,
      encoding: 'utf8'
    });
    console.log(`  ✅ SUCCESS: ${output.trim().split('\n')[0]}`);
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}`);
  }
  console.log();
}

// Simulate ToolChecker._checkToolWithFallbacks logic
console.log('=== TOOLCHECKER LOGIC SIMULATION ===');
const pythonTools = ['black', 'pylint'];

for (const toolName of pythonTools) {
  console.log(`Simulating ToolChecker for ${toolName}:`);
  
  let venvExecutable = null;
  
  // Check Windows-style venv structure first  
  const windowsPath = `.venv/Scripts/${toolName}.exe`;
  if (fs.existsSync(windowsPath)) {
    venvExecutable = windowsPath;
    console.log(`  ✅ Found Windows executable: ${windowsPath}`);
  } else {
    console.log(`  ❌ Windows executable not found: ${windowsPath}`);
    
    // Check Unix-style venv structure
    const unixPath = `.venv/bin/${toolName}`;
    if (fs.existsSync(unixPath)) {
      venvExecutable = unixPath; 
      console.log(`  ✅ Found Unix executable: ${unixPath}`);
    } else {
      console.log(`  ❌ Unix executable not found: ${unixPath}`);
    }
  }
  
  if (venvExecutable) {
    // Test command replacement logic
    const originalCommand = `${toolName} --version`;
    const replacedCommand = originalCommand.replace(`${toolName} --version`, `${venvExecutable} --version`);
    console.log(`  Original command: ${originalCommand}`);
    console.log(`  Replaced command: ${replacedCommand}`);
    
    try {
      const output = execSync(replacedCommand, { 
        stdio: 'pipe', 
        timeout: 5000,
        encoding: 'utf8'
      });
      console.log(`  ✅ Command execution success: ${output.trim().split('\n')[0]}`);
    } catch (error) {
      console.log(`  ❌ Command execution failed: ${error.message}`);
    }
  } else {
    console.log(`  ❌ No executable found for ${toolName}`);
  }
  console.log();
}

console.log('=== DIAGNOSIS COMPLETE ===');