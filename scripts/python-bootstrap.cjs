#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const repoRoot = process.cwd();
const backendDir = path.join(repoRoot, 'backend');
const venvDir = path.join(backendDir, '.venv');

function whichPython() {
  const candidates = isWin
    ? ['py', 'python', 'python3']
    : ['python3', 'python'];
  for (const cmd of candidates) {
    const res = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
    if (res.status === 0) return cmd;
  }
  throw new Error('No suitable Python interpreter found (tried py/python/python3).');
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

(function main() {
  const py = whichPython();

  // Create venv if missing
  if (!fileExists(venvDir)) {
    console.log('Creating virtual environment at', venvDir);
    run(py, ['-m', 'venv', venvDir]);
  } else {
    console.log('Virtual environment already exists at', venvDir);
  }

  const venvPython = isWin
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python');

  // Upgrade pip
  run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip']);

  // Install requirements
  const reqFiles = [
    path.join(backendDir, 'requirements.txt'),
    path.join(backendDir, 'requirements-dev.txt'),
    path.join(backendDir, 'requirements-optional.txt'),
  ];
  for (const req of reqFiles) {
    if (fileExists(req)) {
      console.log('Installing requirements from', req);
      run(venvPython, ['-m', 'pip', 'install', '-r', req]);
    }
  }

  console.log('Python bootstrap completed successfully.');
})();
