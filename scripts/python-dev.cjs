#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

const repoRoot = process.cwd();
const backendDir = path.join(repoRoot, 'backend');
const venvDir = path.join(backendDir, '.venv');

function getVenvPython() {
  return isWin
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python');
}

function getVenvUvicorn() {
  return isWin
    ? path.join(venvDir, 'Scripts', 'uvicorn.exe')
    : path.join(venvDir, 'bin', 'uvicorn');
}

function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function printEnvironmentInfo() {
  console.log('=== Python Development Environment ===');
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('Node.js:', process.version);
  console.log('Working Directory:', repoRoot);
  console.log('Backend Directory:', backendDir);
  console.log('Virtual Environment:', venvDir);
  console.log('=======================================');
}

// Print environment information
printEnvironmentInfo();

// Ensure virtualenv and deps are present (idempotent)
console.log('Running Python bootstrap...');
const boot = spawnSync('node', ['scripts/python-bootstrap.cjs'], { stdio: 'inherit' });
if (boot.status !== 0) {
  console.error('python-bootstrap failed. Aborting.');
  process.exit(boot.status || 1);
}

const venvPython = getVenvPython();
const venvUvicorn = getVenvUvicorn();

if (!fileExists(venvPython)) {
  console.error('Virtualenv python not found at', venvPython);
  process.exit(1);
}

// Try uvicorn directly first, fallback to python -m uvicorn
console.log('Starting FastAPI development server...');
console.log('Python executable:', venvPython);

let serverCommand, serverArgs;

if (fileExists(venvUvicorn)) {
  console.log('Using uvicorn executable:', venvUvicorn);
  serverCommand = venvUvicorn;
  serverArgs = ['app.main:app', '--reload', '--app-dir', 'backend', '--host', '127.0.0.1', '--port', '8000'];
} else {
  console.log('Using python -m uvicorn');
  serverCommand = venvPython;
  serverArgs = ['-m', 'uvicorn', 'app.main:app', '--reload', '--app-dir', 'backend', '--host', '127.0.0.1', '--port', '8000'];
}

console.log('Command:', serverCommand);
console.log('Args:', serverArgs.join(' '));
console.log('Server will be available at: http://127.0.0.1:8000');
console.log('API docs will be available at: http://127.0.0.1:8000/docs');
console.log('Press Ctrl+C to stop the server');
console.log('=======================================');

const child = spawn(serverCommand, serverArgs, {
  stdio: 'inherit',
  cwd: repoRoot,
  env: { ...process.env, PYTHONPATH: backendDir }
});

child.on('exit', (code) => {
  console.log(`\nDevelopment server exited with code: ${code ?? 0}`);
  process.exit(code ?? 0);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down development server...');
  child.kill('SIGTERM');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down development server...');
  child.kill('SIGTERM');
});
