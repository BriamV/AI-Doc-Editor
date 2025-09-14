#!/usr/bin/env node
const concurrently = require('concurrently');
const { spawnSync } = require('child_process');

const isWin = process.platform === 'win32';
const pythonPath = isWin
  ? '.\\backend\\.venv\\Scripts\\python.exe'
  : 'backend/.venv/bin/python';

const backendCmd = `${pythonPath} -m uvicorn app.main:app --reload --app-dir backend`;

// Ensure Python venv and deps are present before starting
const boot = spawnSync('node', ['scripts/python-bootstrap.cjs'], { stdio: 'inherit' });
if (boot.status !== 0) {
  console.error('Python bootstrap failed. Aborting dev startup.');
  process.exit(boot.status || 1);
}

const { result } = concurrently(
  [
    { command: 'vite', name: 'vite' },
    { command: backendCmd, name: 'backend' },
  ],
  {
    prefix: '{name}',
  }
);

result
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
