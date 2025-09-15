#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const repoRoot = process.cwd();
const backendDir = path.join(repoRoot, 'backend');
const venvDir = path.join(backendDir, '.venv');

function getVenvPython() {
  return isWin
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python');
}

function getVenvTool(toolName) {
  const executable = isWin ? `${toolName}.exe` : toolName;
  return isWin
    ? path.join(venvDir, 'Scripts', executable)
    : path.join(venvDir, 'bin', executable);
}

function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function runCommand(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: repoRoot,
    env: { ...process.env, PYTHONPATH: backendDir },
    ...options
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  return result;
}

// Parse command line arguments
const [,, command, ...extraArgs] = process.argv;

if (!command) {
  console.error('Usage: node python-tools.cjs <command> [args...]');
  console.error('Commands: install, format, format:check, lint, lint:fix, complexity, semgrep');
  process.exit(1);
}

const venvPython = getVenvPython();

// Ensure virtualenv exists
if (!fileExists(venvPython)) {
  console.log('Virtual environment not found. Running bootstrap...');
  const bootstrap = spawnSync('node', ['scripts/python-bootstrap.cjs'], { stdio: 'inherit' });
  if (bootstrap.status !== 0) {
    console.error('Python bootstrap failed');
    process.exit(bootstrap.status || 1);
  }
}

// Execute the requested command
switch (command) {
  case 'install':
    console.log('Installing Python dependencies...');
    runCommand(venvPython, ['-m', 'pip', 'install', '-r', 'backend/requirements.txt', '-r', 'backend/requirements-dev.txt', ...extraArgs]);
    break;

  case 'format':
    console.log('Formatting Python code with Black...');
    runCommand(venvPython, ['-m', 'black', 'backend', '--line-length=100', ...extraArgs]);
    break;

  case 'format:check':
    console.log('Checking Python code formatting...');
    runCommand(venvPython, ['-m', 'black', '--check', '--diff', '--line-length=100', 'backend', ...extraArgs]);
    break;

  case 'lint':
    console.log('Linting Python code with Ruff...');
    runCommand(venvPython, ['-m', 'ruff', 'check', 'backend', '--output-format=github', ...extraArgs]);
    break;

  case 'lint:fix':
    console.log('Fixing Python code with Ruff...');
    runCommand(venvPython, ['-m', 'ruff', 'check', 'backend', '--fix', ...extraArgs]);
    break;

  case 'complexity':
    console.log('Analyzing Python code complexity with Radon...');
    runCommand(venvPython, ['-m', 'radon', 'cc', 'backend', '--min=B', ...extraArgs]);
    break;

  case 'semgrep':
    console.log('Running Semgrep security analysis...');
    const semgrepTool = getVenvTool('semgrep');

    // Try direct semgrep executable first, fallback to python -m
    if (fileExists(semgrepTool)) {
      runCommand(semgrepTool, ['--config=auto', '.', '--severity=ERROR', ...extraArgs]);
    } else {
      runCommand(venvPython, ['-m', 'semgrep', '--config=auto', '.', '--severity=ERROR', ...extraArgs]);
    }
    break;

  case 'semgrep:full':
    console.log('Running full Semgrep security analysis...');
    const semgrepFullTool = getVenvTool('semgrep');

    if (fileExists(semgrepFullTool)) {
      runCommand(semgrepFullTool, ['--config=auto', '.', ...extraArgs]);
    } else {
      runCommand(venvPython, ['-m', 'semgrep', '--config=auto', '.', ...extraArgs]);
    }
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Available commands: install, format, format:check, lint, lint:fix, complexity, semgrep, semgrep:full');
    process.exit(1);
}