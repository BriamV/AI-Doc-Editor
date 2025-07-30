/**
 * Simulate PowerShell Environment for ToolChecker
 * Test why ToolChecker fails in PowerShell but works in Git Bash
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== SIMULATING POWERSHELL ENVIRONMENT ===');

// Simulate PowerShell environment by removing Git Bash specific variables
const powershellEnv = { ...process.env };
delete powershellEnv.MSYSTEM;
delete powershellEnv.SHELL;
delete powershellEnv.TERM;
powershellEnv.ComSpec = 'C:\\Windows\\System32\\cmd.exe';

console.log('Modified environment variables:');
console.log('  MSYSTEM:', powershellEnv.MSYSTEM || 'undefined');
console.log('  SHELL:', powershellEnv.SHELL || 'undefined');
console.log('  TERM:', powershellEnv.TERM || 'undefined');
console.log('  ComSpec:', powershellEnv.ComSpec);
console.log();

// Test the EXACT ToolChecker Python tools logic
console.log('=== SIMULATING TOOLCHECKER PYTHON LOGIC ===');

const pythonTools = ['black', 'pylint'];

for (const toolName of pythonTools) {
  console.log(`Testing ${toolName}:`);
  
  // Step 1: File existence (this should work)
  const windowsPath = `.venv/Scripts/${toolName}.exe`;
  const fileExists = fs.existsSync(windowsPath);
  console.log(`  1. File exists (${windowsPath}): ${fileExists}`);
  
  if (fileExists) {
    // Step 2: Command replacement (this should work)
    const originalCommand = `${toolName} --version`;
    const replacedCommand = originalCommand.replace(`${toolName} --version`, `${windowsPath} --version`);
    console.log(`  2. Command replacement: ${originalCommand} → ${replacedCommand}`);
    
    // Step 3: Test different execution environments
    const testConfigs = [
      {
        name: 'CURRENT FIX (minimal options)',
        options: {
          stdio: 'pipe',
          timeout: 8000,
          encoding: 'utf8',
          cwd: process.cwd()
          // NO custom env
        }
      },
      {
        name: 'POWERSHELL ENV SIMULATION',
        options: {
          stdio: 'pipe',
          timeout: 8000,
          encoding: 'utf8',
          cwd: process.cwd(),
          env: powershellEnv
        }
      },
      {
        name: 'WINDOWS CMD SHELL',
        options: {
          stdio: 'pipe',
          timeout: 8000,
          encoding: 'utf8',
          cwd: process.cwd(),
          shell: 'cmd.exe',
          env: powershellEnv
        }
      },
      {
        name: 'POWERSHELL SHELL',
        options: {
          stdio: 'pipe',
          timeout: 8000,
          encoding: 'utf8',
          cwd: process.cwd(),
          shell: 'powershell.exe',
          env: powershellEnv
        }
      }
    ];
    
    for (const config of testConfigs) {
      console.log(`  3.${config.name}:`);
      try {
        const output = execSync(replacedCommand, config.options);
        const version = output.toString().trim().split('\n')[0];
        console.log(`     ✅ SUCCESS: ${version}`);
      } catch (error) {
        console.log(`     ❌ FAILED: ${error.message}`);
        if (error.code) {
          console.log(`     Error code: ${error.code}`);
        }
        if (error.stderr) {
          console.log(`     Stderr: ${error.stderr.toString().trim()}`);
        }
      }
    }
  }
  console.log();
}

// Test actual ToolChecker class
console.log('=== TESTING ACTUAL TOOLCHECKER CLASS ===');
async function testToolChecker() {
  try {
    const ToolChecker = require('../core/environment/ToolChecker.cjs');
    
    const logger = {
      info: (msg) => console.log(`INFO: ${msg}`),
      warn: (msg) => console.log(`WARN: ${msg}`),
      debug: (msg) => console.log(`DEBUG: ${msg}`),
      level: 'debug'
    };
    
    const toolChecker = new ToolChecker(logger);
    
    // Test black detection
    console.log('Testing ToolChecker.checkTool for black:');
    const blackConfig = {
      command: 'black --version',
      description: 'Python formatter',
      critical: false
    };
    
    const blackResult = await toolChecker.checkTool('black', blackConfig);
    console.log('Result:', JSON.stringify(blackResult, null, 2));
    
  } catch (error) {
    console.log('ToolChecker test failed:', error.message);
  }
}

testToolChecker();

console.log('\n=== SIMULATION COMPLETE ===');