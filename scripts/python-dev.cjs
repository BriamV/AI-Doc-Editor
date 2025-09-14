#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const repoRoot = process.cwd();
const venvPython = isWin
  ? path.join(repoRoot, 'backend', '.venv', 'Scripts', 'python.exe')
  : path.join(repoRoot, 'backend', '.venv', 'bin', 'python');

function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

// Ensure virtualenv and deps are present (idempotent)
const boot = spawnSync('node', ['scripts/python-bootstrap.cjs'], { stdio: 'inherit' });
if (boot.status !== 0) {
  console.error('python-bootstrap failed. Aborting.');
  process.exit(boot.status || 1);
}

if (!fileExists(venvPython)) {
  console.error('Virtualenv python not found at', venvPython);
  process.exit(1);
}

const args = ['-m', 'uvicorn', 'app.main:app', '--reload', '--app-dir', 'backend'];
const child = spawn(venvPython, args, { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
