/**
 * Debug script to test wrapper result directly
 */

const PrettierWrapper = require('../../../scripts/qa/core/wrappers/PrettierWrapper.cjs');
const path = require('path');

// Create simple services
const logger = {
  info: console.log,
  debug: console.log,
  warn: console.warn,
  error: console.error
};

const processService = {
  async execute(command, args) {
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      console.log(`Executing: ${command} ${args.join(' ')}`);
      
      const child = spawn('node', ['node_modules/prettier/bin/prettier.cjs', ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => stdout += data.toString());
      child.stderr.on('data', (data) => stderr += data.toString());
      
      child.on('close', (code) => {
        console.log(`Exit code: ${code}`);
        console.log(`Stdout: "${stdout}"`);
        console.log(`Stderr: "${stderr}"`);
        
        resolve({
          success: code === 0,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
    });
  }
};

const fileService = {
  exists: (path) => require('fs').existsSync(path)
};

async function test() {
  const wrapper = new PrettierWrapper({}, logger, processService, fileService);
  
  // Test with modified files
  const files = ['docs/PRD-QA CLI v2.0.md'];
  console.log('Testing prettier wrapper with files:', files);
  
  const result = await wrapper.execute(files);
  console.log('Wrapper result:');
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);