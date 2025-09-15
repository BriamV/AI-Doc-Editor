#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const repoRoot = process.cwd();
const backendDir = path.join(repoRoot, 'backend');
const venvDir = path.join(backendDir, '.venv');

function findSystemPython() {
  // Try to find system Python (not venv)
  const candidates = isWin
    ? ['py', 'python', 'python3']
    : ['python3', 'python'];
  for (const cmd of candidates) {
    const res = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
    if (res.status === 0) return cmd;
  }

  // Check common Python installation paths as fallback
  const fallbackPaths = isWin
    ? [
        'C:\\Python\\python.exe',
        'C:\\Python3\\python.exe',
        'D:\\Programs\\Python\\Python313\\python.exe',
        '%LOCALAPPDATA%\\Programs\\Python\\Python*\\python.exe'
      ]
    : [
        '/usr/bin/python3',
        '/usr/bin/python',
        '/usr/local/bin/python3',
        '/opt/python/bin/python3'
      ];

  for (const pythonPath of fallbackPaths) {
    if (pythonPath.includes('*')) continue; // Skip wildcard paths for now
    if (fileExists(pythonPath)) {
      const res = spawnSync(pythonPath, ['--version'], { stdio: 'ignore' });
      if (res.status === 0) {
        console.log('Found Python at fallback path:', pythonPath);
        return pythonPath;
      }
    }
  }

  throw new Error('No suitable Python interpreter found. Please ensure Python 3.8+ is installed and accessible.');
}

function getVenvPython() {
  return isWin
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python');
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
  const venvPython = getVenvPython();

  // Check if venv already exists and is functional
  if (fileExists(venvDir) && fileExists(venvPython)) {
    console.log('Virtual environment already exists at', venvDir);

    // Verify the venv Python works
    try {
      const res = spawnSync(venvPython, ['--version'], { stdio: 'pipe' });
      if (res.status === 0) {
        console.log('Existing virtual environment is functional');
        // Skip to dependency installation
      } else {
        throw new Error('Existing virtual environment is corrupted');
      }
    } catch (error) {
      console.warn('Existing virtual environment seems corrupted, will recreate');
      // Remove corrupted venv and continue to create new one
      if (fs.existsSync(venvDir)) {
        fs.rmSync(venvDir, { recursive: true, force: true });
      }
    }
  }

  // Create venv if missing or was corrupted
  if (!fileExists(venvDir) || !fileExists(venvPython)) {
    const systemPython = findSystemPython();
    console.log('Creating virtual environment at', venvDir);
    console.log('Using system Python:', systemPython);

    run(systemPython, ['-m', 'venv', venvDir]);
    console.log('Virtual environment created successfully');
  }

  // Ensure we have the venv python path after creation
  if (!fileExists(venvPython)) {
    throw new Error(`Virtual environment Python not found at: ${venvPython}`);
  }

  // Upgrade pip
  console.log('Upgrading pip...');
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
    } else {
      console.log('Requirements file not found, skipping:', req);
    }
  }

  console.log('Python bootstrap completed successfully.');
  console.log('Virtual environment ready at:', venvDir);
  console.log('Python executable:', venvPython);
})();
