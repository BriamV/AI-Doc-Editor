/**
 * Debug ToolChecker Environment Differences
 * Investigates why ToolChecker funciona en Git Bash pero no en PowerShell/CMD
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== TOOLCHECKER ENVIRONMENT DEBUG ===');
console.log('Working Directory:', process.cwd());
console.log('Platform:', process.platform);
console.log('Environment Variables:');
console.log('  MSYSTEM:', process.env.MSYSTEM || 'undefined');
console.log('  SHELL:', process.env.SHELL || 'undefined');
console.log('  TERM:', process.env.TERM || 'undefined');
console.log('  ComSpec:', process.env.ComSpec || 'undefined');
console.log();

// Test the EXACT ToolChecker logic with different execOptions
console.log('=== TESTING DIFFERENT EXECOPTIONS ===');

const testCommands = [
  '.venv/Scripts/black.exe --version',
  '.venv/Scripts/pylint.exe --version'
];

const testConfigs = [
  {
    name: 'DEFAULT (what ToolChecker would use)',
    options: {
      stdio: 'pipe',
      timeout: 8000,
      encoding: 'utf8',
      cwd: process.cwd()
      // NO custom env.PATH
    }
  },
  {
    name: 'WITH PROCESS ENV',
    options: {
      stdio: 'pipe', 
      timeout: 8000,
      encoding: 'utf8',
      cwd: process.cwd(),
      env: process.env
    }
  },
  {
    name: 'MINIMAL OPTIONS',
    options: {
      encoding: 'utf8'
    }
  }
];

for (const cmd of testCommands) {
  console.log(`\nTesting command: ${cmd}`);
  console.log('-'.repeat(50));
  
  for (const config of testConfigs) {
    console.log(`  Config: ${config.name}`);
    try {
      const output = execSync(cmd, config.options);
      console.log(`    ✅ SUCCESS: ${output.toString().trim().split('\n')[0]}`);
    } catch (error) {
      console.log(`    ❌ FAILED: ${error.message}`);
      console.log(`    Error code: ${error.status}`);
      console.log(`    Signal: ${error.signal}`);
      if (error.stderr) {
        console.log(`    Stderr: ${error.stderr.toString()}`);
      }
    }
  }
}

// Test PATH differences
console.log('\n=== PATH ANALYSIS ===');
console.log('Current PATH entries (first 10):');
const pathEntries = (process.env.PATH || '').split(';');
pathEntries.slice(0, 10).forEach((entry, i) => {
  console.log(`  ${i}: ${entry}`);
});

// Check if .venv Scripts is in PATH
const venvScriptsPath = 'D:\\DELL_\\Documents\\GitHub\\AI-Doc-Editor\\.venv\\Scripts';
const isVenvInPath = pathEntries.some(entry => entry.includes('.venv'));
console.log(`\n.venv in PATH: ${isVenvInPath}`);
console.log(`Expected venv path: ${venvScriptsPath}`);
console.log(`Exact match in PATH: ${pathEntries.includes(venvScriptsPath)}`);

// Test file existence checks
console.log('\n=== FILE EXISTENCE VERIFICATION ===');
const toolsToCheck = ['black', 'pylint'];
for (const tool of toolsToCheck) {
  const windowsPath = `.venv/Scripts/${tool}.exe`;
  const absolutePath = `D:\\DELL_\\Documents\\GitHub\\AI-Doc-Editor\\.venv\\Scripts\\${tool}.exe`;
  
  console.log(`${tool}:`);
  console.log(`  Relative path (${windowsPath}): ${fs.existsSync(windowsPath)}`);
  console.log(`  Absolute path (${absolutePath}): ${fs.existsSync(absolutePath)}`);
}

console.log('\n=== DEBUG COMPLETE ===');
console.log('Key findings to look for:');
console.log('1. Which execOptions configuration works?');
console.log('2. Are there PATH differences between environments?');
console.log('3. Does file existence detection work consistently?');