#!/usr/bin/env node
/**
 * Unified Multiplatform Validator and Executor
 *
 * Consolidates all cross-platform detection and path resolution logic
 * from existing scripts into a single, unified multiplatform validator.
 *
 * Usage:
 *   node scripts/multiplatform.cjs python [args]        - Run Python commands
 *   node scripts/multiplatform.cjs tool <name> [args]   - Run Python tools
 *   node scripts/multiplatform.cjs bootstrap            - Bootstrap environment
 *   node scripts/multiplatform.cjs dev                  - Start dev server
 *   node scripts/multiplatform.cjs validate             - Validate environment
 *
 * Features:
 * - Unified cross-platform detection (Windows/macOS/Linux)
 * - Virtual environment path resolution
 * - Python and tool executable detection
 * - Environment validation and diagnostics
 * - Consistent error handling and logging
 */

const { spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class MultiPlatformValidator {
  constructor() {
    // Platform detection
    this.isWin = process.platform === 'win32';
    this.isMac = process.platform === 'darwin';
    this.isLinux = process.platform === 'linux';
    this.isWSL = this.detectWSL();

    // Path configuration
    this.repoRoot = process.cwd();
    this.backendDir = path.join(this.repoRoot, 'backend');
    this.venvDir = path.join(this.backendDir, '.venv');

    // Cache for executable paths
    this._executableCache = new Map();

    // Logging configuration
    this.verbose = process.env.VERBOSE === '1' || process.argv.includes('--verbose');
  }

  /**
   * Detect if running under WSL
   */
  detectWSL() {
    if (this.isWin) return false;
    try {
      const release = fs.readFileSync('/proc/version', 'utf8');
      return release.toLowerCase().includes('microsoft') ||
             release.toLowerCase().includes('wsl');
    } catch {
      return false;
    }
  }

  /**
   * Enhanced logging with consistent formatting
   */
  log(level, message, ...args) {
    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`, ...args);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, ...args);
        break;
      case 'info':
        console.log(`${prefix} ${message}`, ...args);
        break;
      case 'debug':
        if (this.verbose) {
          console.log(`${prefix} ${message}`, ...args);
        }
        break;
      default:
        console.log(`${prefix} ${message}`, ...args);
    }
  }

  /**
   * Check if file exists with proper error handling
   */
  fileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      this.log('debug', `Error checking file existence: ${filePath}`, error.message);
      return false;
    }
  }

  /**
   * Get virtual environment Python executable path
   */
  getVenvPython() {
    return this.isWin
      ? path.join(this.venvDir, 'Scripts', 'python.exe')
      : path.join(this.venvDir, 'bin', 'python');
  }

  /**
   * Get virtual environment tool executable path
   */
  getVenvTool(toolName) {
    const executable = this.isWin ? `${toolName}.exe` : toolName;
    return this.isWin
      ? path.join(this.venvDir, 'Scripts', executable)
      : path.join(this.venvDir, 'bin', executable);
  }

  /**
   * Find system Python interpreter with enhanced fallback paths
   */
  findSystemPython() {
    const cacheKey = 'system_python';
    if (this._executableCache.has(cacheKey)) {
      return this._executableCache.get(cacheKey);
    }

    this.log('debug', 'Searching for system Python interpreter...');

    // Try common Python commands first
    const candidates = this.isWin
      ? ['py', 'python', 'python3']
      : ['python3', 'python'];

    for (const cmd of candidates) {
      this.log('debug', `Testing Python command: ${cmd}`);
      const result = spawnSync(cmd, ['--version'], { stdio: 'pipe' });
      if (result.status === 0) {
        this.log('debug', `Found Python: ${cmd} - ${result.stdout.toString().trim()}`);
        this._executableCache.set(cacheKey, cmd);
        return cmd;
      }
    }

    // Enhanced fallback paths with better Windows support
    const fallbackPaths = this.isWin
      ? [
          'C:\\Python\\python.exe',
          'C:\\Python3\\python.exe',
          'C:\\Python311\\python.exe',
          'C:\\Python312\\python.exe',
          'C:\\Python313\\python.exe',
          'D:\\Programs\\Python\\Python313\\python.exe',
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311', 'python.exe'),
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe'),
          path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python313', 'python.exe'),
          path.join(process.env.APPDATA || '', 'Python', 'Python311', 'python.exe'),
          'C:\\msys64\\mingw64\\bin\\python.exe',
        ]
      : [
          '/usr/bin/python3',
          '/usr/bin/python',
          '/usr/local/bin/python3',
          '/usr/local/bin/python',
          '/opt/python/bin/python3',
          '/opt/homebrew/bin/python3', // macOS Homebrew
          '/usr/local/opt/python/bin/python3', // macOS Homebrew old location
          ...(this.isWSL ? ['/mnt/c/Python/python.exe', '/mnt/c/Python3/python.exe'] : [])
        ];

    for (const pythonPath of fallbackPaths) {
      if (this.fileExists(pythonPath)) {
        this.log('debug', `Testing fallback Python path: ${pythonPath}`);
        const result = spawnSync(pythonPath, ['--version'], { stdio: 'pipe' });
        if (result.status === 0) {
          this.log('info', `Found Python at fallback path: ${pythonPath}`);
          this.log('debug', `Python version: ${result.stdout.toString().trim()}`);
          this._executableCache.set(cacheKey, pythonPath);
          return pythonPath;
        }
      }
    }

    throw new Error(
      'No suitable Python interpreter found. Please ensure Python 3.8+ is installed and accessible.\n' +
      'Visit: https://python.org/downloads/ for installation instructions.'
    );
  }

  /**
   * Validate Python version meets requirements
   */
  validatePythonVersion(pythonCmd) {
    try {
      const result = spawnSync(pythonCmd, ['-c', 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")'],
        { stdio: 'pipe', encoding: 'utf8' });

      if (result.status !== 0) {
        throw new Error('Failed to get Python version');
      }

      const version = result.stdout.trim();
      const [major, minor] = version.split('.').map(Number);

      if (major < 3 || (major === 3 && minor < 8)) {
        throw new Error(`Python ${version} found, but Python 3.8+ is required`);
      }

      this.log('debug', `Python version ${version} meets requirements`);
      return version;
    } catch (error) {
      throw new Error(`Python version validation failed: ${error.message}`);
    }
  }

  /**
   * Enhanced command execution with better error handling
   */
  runCommand(cmd, args, options = {}) {
    const defaultOptions = {
      stdio: 'inherit',
      cwd: this.repoRoot,
      env: { ...process.env, PYTHONPATH: this.backendDir },
      ...options
    };

    this.log('debug', `Executing: ${cmd} ${args.join(' ')}`);
    this.log('debug', `Working directory: ${defaultOptions.cwd}`);

    const result = spawnSync(cmd, args, defaultOptions);

    if (result.error) {
      throw new Error(`Failed to execute command: ${result.error.message}`);
    }

    if (result.status !== 0) {
      const errorMsg = `Command failed with exit code ${result.status}: ${cmd} ${args.join(' ')}`;
      throw new Error(errorMsg);
    }

    return result;
  }

  /**
   * Enhanced environment validation with detailed diagnostics
   */
  validateEnvironment() {
    this.log('info', 'Starting environment validation...');

    const diagnostics = {
      platform: {
        os: process.platform,
        arch: process.arch,
        isWSL: this.isWSL,
        nodeVersion: process.version,
        workingDir: this.repoRoot
      },
      directories: {},
      python: {},
      virtualenv: {},
      tools: {},
      issues: []
    };

    try {
      // Directory validation
      diagnostics.directories.backend = {
        exists: this.fileExists(this.backendDir),
        path: this.backendDir
      };

      diagnostics.directories.venv = {
        exists: this.fileExists(this.venvDir),
        path: this.venvDir
      };

      // Python validation
      try {
        const systemPython = this.findSystemPython();
        const pythonVersion = this.validatePythonVersion(systemPython);
        diagnostics.python = {
          found: true,
          path: systemPython,
          version: pythonVersion
        };
      } catch (error) {
        diagnostics.python = {
          found: false,
          error: error.message
        };
        diagnostics.issues.push(`Python: ${error.message}`);
      }

      // Virtual environment validation
      const venvPython = this.getVenvPython();
      diagnostics.virtualenv.path = venvPython;
      diagnostics.virtualenv.exists = this.fileExists(venvPython);

      if (diagnostics.virtualenv.exists) {
        try {
          const result = spawnSync(venvPython, ['--version'], { stdio: 'pipe', encoding: 'utf8' });
          diagnostics.virtualenv.functional = result.status === 0;
          if (result.status === 0) {
            diagnostics.virtualenv.version = result.stdout.trim();
          } else {
            diagnostics.issues.push('Virtual environment Python is not functional');
          }
        } catch (error) {
          diagnostics.virtualenv.functional = false;
          diagnostics.issues.push(`Virtual environment validation failed: ${error.message}`);
        }
      } else {
        diagnostics.issues.push('Virtual environment not found');
      }

      // Tool validation
      const tools = ['pip', 'black', 'ruff', 'radon', 'uvicorn', 'semgrep'];
      for (const tool of tools) {
        const toolPath = this.getVenvTool(tool);
        const exists = this.fileExists(toolPath);
        diagnostics.tools[tool] = {
          path: toolPath,
          available: exists
        };

        if (!exists && diagnostics.virtualenv.functional) {
          // Try as Python module
          try {
            const result = spawnSync(venvPython, ['-c', `import ${tool}`],
              { stdio: 'pipe', timeout: 5000 });
            diagnostics.tools[tool].moduleAvailable = result.status === 0;
          } catch {
            diagnostics.tools[tool].moduleAvailable = false;
          }
        }
      }

      // Requirements files validation
      const reqFiles = [
        'requirements.txt',
        'requirements-dev.txt',
        'requirements-optional.txt'
      ];

      diagnostics.requirements = {};
      for (const reqFile of reqFiles) {
        const reqPath = path.join(this.backendDir, reqFile);
        diagnostics.requirements[reqFile] = {
          exists: this.fileExists(reqPath),
          path: reqPath
        };
      }

      return diagnostics;

    } catch (error) {
      diagnostics.issues.push(`Environment validation failed: ${error.message}`);
      return diagnostics;
    }
  }

  /**
   * Print comprehensive environment information
   */
  printEnvironmentInfo() {
    console.log('=== Unified Multiplatform Environment ===');
    console.log('Platform:', process.platform, this.isWSL ? '(WSL)' : '');
    console.log('Architecture:', process.arch);
    console.log('Node.js:', process.version);
    console.log('Working Directory:', this.repoRoot);
    console.log('Backend Directory:', this.backendDir);
    console.log('Virtual Environment:', this.venvDir);
    console.log('========================================');
  }

  /**
   * Bootstrap Python environment with enhanced validation
   */
  async bootstrap() {
    this.log('info', 'Starting Python environment bootstrap...');

    const venvPython = this.getVenvPython();

    // Check if venv already exists and is functional
    if (this.fileExists(this.venvDir) && this.fileExists(venvPython)) {
      this.log('info', 'Virtual environment already exists, validating...');

      try {
        const result = spawnSync(venvPython, ['--version'], { stdio: 'pipe' });
        if (result.status === 0) {
          this.log('info', 'Existing virtual environment is functional');
          // Continue to dependency installation
        } else {
          throw new Error('Existing virtual environment is corrupted');
        }
      } catch (error) {
        this.log('warn', 'Existing virtual environment seems corrupted, recreating...');
        if (this.fileExists(this.venvDir)) {
          fs.rmSync(this.venvDir, { recursive: true, force: true });
        }
      }
    }

    // Create venv if missing or was corrupted
    if (!this.fileExists(this.venvDir) || !this.fileExists(venvPython)) {
      const systemPython = this.findSystemPython();
      const pythonVersion = this.validatePythonVersion(systemPython);

      this.log('info', `Creating virtual environment using Python ${pythonVersion}...`);
      this.log('info', `System Python: ${systemPython}`);
      this.log('info', `Target directory: ${this.venvDir}`);

      this.runCommand(systemPython, ['-m', 'venv', this.venvDir]);
      this.log('info', 'Virtual environment created successfully');
    }

    // Final validation
    if (!this.fileExists(venvPython)) {
      throw new Error(`Virtual environment Python not found at: ${venvPython}`);
    }

    // Upgrade pip
    this.log('info', 'Upgrading pip...');
    this.runCommand(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip']);

    // Install requirements
    const reqFiles = [
      path.join(this.backendDir, 'requirements.txt'),
      path.join(this.backendDir, 'requirements-dev.txt'),
      path.join(this.backendDir, 'requirements-optional.txt'),
    ];

    for (const reqFile of reqFiles) {
      if (this.fileExists(reqFile)) {
        this.log('info', `Installing requirements from ${path.basename(reqFile)}...`);
        this.runCommand(venvPython, ['-m', 'pip', 'install', '-r', reqFile]);
      } else {
        this.log('warn', `Requirements file not found: ${path.basename(reqFile)}`);
      }
    }

    this.log('info', 'Python bootstrap completed successfully');
    this.log('info', `Virtual environment ready at: ${this.venvDir}`);
    this.log('info', `Python executable: ${venvPython}`);
  }

  /**
   * Start development server with enhanced configuration
   */
  async startDevServer() {
    this.log('info', 'Starting FastAPI development server...');

    // Ensure environment is ready
    await this.ensureEnvironment();

    const venvPython = this.getVenvPython();
    const venvUvicorn = this.getVenvTool('uvicorn');

    this.log('info', `Python executable: ${venvPython}`);

    let serverCommand, serverArgs;

    // Try uvicorn directly first, fallback to python -m uvicorn
    if (this.fileExists(venvUvicorn)) {
      this.log('info', `Using uvicorn executable: ${venvUvicorn}`);
      serverCommand = venvUvicorn;
      serverArgs = [
        'app.main:app',
        '--reload',
        '--app-dir', 'backend',
        '--host', '127.0.0.1',
        '--port', '8000'
      ];
    } else {
      this.log('info', 'Using python -m uvicorn');
      serverCommand = venvPython;
      serverArgs = [
        '-m', 'uvicorn',
        'app.main:app',
        '--reload',
        '--app-dir', 'backend',
        '--host', '127.0.0.1',
        '--port', '8000'
      ];
    }

    this.log('info', `Command: ${serverCommand}`);
    this.log('info', `Args: ${serverArgs.join(' ')}`);
    this.log('info', 'Server will be available at: http://127.0.0.1:8000');
    this.log('info', 'API docs will be available at: http://127.0.0.1:8000/docs');
    this.log('info', 'Press Ctrl+C to stop the server');
    console.log('=======================================');

    const child = spawn(serverCommand, serverArgs, {
      stdio: 'inherit',
      cwd: this.repoRoot,
      env: { ...process.env, PYTHONPATH: this.backendDir }
    });

    // Enhanced process management
    child.on('exit', (code, signal) => {
      if (signal) {
        this.log('info', `Development server terminated by signal: ${signal}`);
      } else {
        this.log('info', `Development server exited with code: ${code ?? 0}`);
      }
      process.exit(code ?? 0);
    });

    child.on('error', (error) => {
      this.log('error', `Failed to start development server: ${error.message}`);
      process.exit(1);
    });

    // Handle process termination gracefully
    const gracefulShutdown = (signal) => {
      this.log('info', `\nReceived ${signal}, shutting down development server...`);
      child.kill('SIGTERM');

      // Force kill after timeout
      setTimeout(() => {
        this.log('warn', 'Force killing development server...');
        child.kill('SIGKILL');
      }, 5000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  }

  /**
   * Ensure environment is ready (bootstrap if needed)
   */
  async ensureEnvironment() {
    const venvPython = this.getVenvPython();
    if (!this.fileExists(venvPython)) {
      this.log('info', 'Virtual environment not found, running bootstrap...');
      await this.bootstrap();
    }
  }

  /**
   * Execute Python commands through the virtual environment
   */
  async runPython(args) {
    await this.ensureEnvironment();
    const venvPython = this.getVenvPython();
    this.runCommand(venvPython, args);
  }

  /**
   * Execute Python tools with enhanced tool detection
   */
  async runTool(toolName, args) {
    await this.ensureEnvironment();

    const venvPython = this.getVenvPython();
    const toolPath = this.getVenvTool(toolName);

    // Enhanced tool execution logic
    if (this.fileExists(toolPath)) {
      this.log('debug', `Using tool executable: ${toolPath}`);
      this.runCommand(toolPath, args);
    } else {
      this.log('debug', `Tool executable not found, trying python -m ${toolName}`);
      this.runCommand(venvPython, ['-m', toolName, ...args]);
    }
  }

  /**
   * Main command router
   */
  async execute() {
    const [,, command, ...args] = process.argv;

    if (!command) {
      console.error('Usage: node scripts/multiplatform.cjs <command> [args...]');
      console.error('Commands:');
      console.error('  validate              - Validate environment');
      console.error('  bootstrap             - Bootstrap Python environment');
      console.error('  dev                   - Start development server');
      console.error('  python [args]         - Run Python commands');
      console.error('  tool <name> [args]    - Run Python tools');
      console.error('  info                  - Show environment information');
      process.exit(1);
    }

    try {
      switch (command) {
        case 'validate': {
          const diagnostics = this.validateEnvironment();
          console.log('\n=== Environment Diagnostics ===');
          console.log(JSON.stringify(diagnostics, null, 2));

          if (diagnostics.issues.length > 0) {
            console.log('\n=== Issues Found ===');
            diagnostics.issues.forEach((issue, index) => {
              console.log(`${index + 1}. ${issue}`);
            });
            process.exit(1);
          } else {
            console.log('\n✅ Environment validation passed');
          }
          break;
        }

        case 'bootstrap':
          await this.bootstrap();
          break;

        case 'dev':
          this.printEnvironmentInfo();
          await this.startDevServer();
          break;

        case 'python':
          await this.runPython(args);
          break;

        case 'tool': {
          const [toolName, ...toolArgs] = args;
          if (!toolName) {
            console.error('Tool name is required');
            console.error('Usage: node scripts/multiplatform.cjs tool <name> [args]');
            process.exit(1);
          }
          await this.runTool(toolName, toolArgs);
          break;
        }

        case 'info':
          this.printEnvironmentInfo();
          console.log('\nDetailed diagnostics:');
          const diagnostics = this.validateEnvironment();
          console.log(JSON.stringify(diagnostics, null, 2));
          break;

        default:
          console.error(`Unknown command: ${command}`);
          console.error('Available commands: validate, bootstrap, dev, python, tool, info');
          process.exit(1);
      }
    } catch (error) {
      this.log('error', error.message);
      if (this.verbose) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
      process.exit(1);
    }
  }
}

// Execute if called directly
if (require.main === module) {
  const validator = new MultiPlatformValidator();
  validator.execute().catch((error) => {
    console.error('Unhandled error:', error.message);
    process.exit(1);
  });
}

module.exports = MultiPlatformValidator;