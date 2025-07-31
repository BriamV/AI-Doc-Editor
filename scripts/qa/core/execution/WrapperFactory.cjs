/**
 * WrapperFactory.cjs - Wrapper Class Factory with Dependency Injection
 * Conservative extraction from WrapperManager.cjs lines 190-231
 * No new functionality added - exact mapping only
 */

class WrapperFactory {
  constructor() {
    // Wrapper class registry using dependency injection
    this.wrapperClasses = new Map();
    this._registerDefaultWrappers();
  }

  /**
   * Register default wrapper classes (dependency injection)
   */
  _registerDefaultWrappers() {
    // Lazy loading - only register paths, not require() them yet
    
    // Orchestrator wrapper (coordinates multiple linters)
    this.wrapperClasses.set('direct-linters', () => require('../wrappers/DirectLintersOrchestrator.cjs'));
    
    // Individual linter wrappers (for direct tool access)
    this.wrapperClasses.set('eslint', () => require('../wrappers/ESLintWrapper.cjs'));
    this.wrapperClasses.set('ruff', () => require('../wrappers/RuffWrapper.cjs'));
    this.wrapperClasses.set('black', () => require('../wrappers/BlackWrapper.cjs'));
    this.wrapperClasses.set('prettier', () => require('../wrappers/PrettierWrapper.cjs'));
    this.wrapperClasses.set('spectral', () => require('../wrappers/SpectralWrapper.cjs'));
    
    // Other specialized wrappers
    this.wrapperClasses.set('snyk', () => require('../wrappers/SnykWrapper.cjs'));
    this.wrapperClasses.set('semgrep', () => require('../wrappers/SemgrepWrapper.cjs'));
    this.wrapperClasses.set('jest', () => require('../wrappers/JestWrapper.cjs'));
    this.wrapperClasses.set('pytest', () => require('../wrappers/PytestWrapper.cjs'));
    this.wrapperClasses.set('native', () => require('../wrappers/NativeWrapper.cjs'));
    this.wrapperClasses.set('build', () => require('../wrappers/BuildWrapper.cjs'));
    this.wrapperClasses.set('data', () => require('../wrappers/DataWrapper.cjs'));
  }

  /**
   * Register a custom wrapper class (dependency injection)
   */
  registerWrapper(wrapperType, wrapperClassFactory) {
    this.wrapperClasses.set(wrapperType, wrapperClassFactory);
  }

  /**
   * Load wrapper instance (strategy pattern)
   */
  async loadWrapper(wrapperType, config, logger) {
    try {
      const wrapperClassFactory = this.wrapperClasses.get(wrapperType);
      
      if (!wrapperClassFactory) {
        throw new Error(`Unknown wrapper type: ${wrapperType}`);
      }
      
      // Lazy loading - only require() when actually needed
      const WrapperClass = wrapperClassFactory();
      
      // ARCHITECTURAL FIX: Create required services for wrapper dependency injection
      const processService = this._createProcessService();
      const fileService = this._createFileService();
      
      const wrapper = new WrapperClass(config, logger, processService, fileService);
      
      logger.info(`Loaded wrapper: ${wrapperType}`);
      return wrapper;
      
    } catch (error) {
      logger.error(`Failed to load wrapper ${wrapperType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create process service instance (dependency injection)
   */
  _createProcessService() {
    const { spawn } = require('child_process');
    const path = require('path');
    
    return {
      async execute(command, args = []) {
        // Check if we have too many file arguments (Windows ENAMETOOLONG fix)
        const MAX_COMMAND_LENGTH = 8000; // Windows command line limit is ~8192 chars
        const commandString = `${command} ${args.join(' ')}`;
        
        if (commandString.length > MAX_COMMAND_LENGTH && this._hasFileArguments(args)) {
          return await this._executeBatched(command, args);
        }
        
        return await this._executeSingle(command, args);
      },

      async _executeSingle(command, args = []) {
        return new Promise((resolve, reject) => {
          // CRITICAL FIX: Use direct Node.js execution for local tools to avoid symlink issues
          const localTools = {
            'eslint': 'node',
            'prettier': 'node', 
            'tsc': 'node'
          };
          
          const localToolPaths = {
            'eslint': 'node_modules/eslint/bin/eslint.js',
            'prettier': 'node_modules/prettier/bin/prettier.cjs',
            'tsc': 'node_modules/typescript/bin/tsc'
          };
          
          // Use direct binary path if available, otherwise use system command
          let finalCommand, finalArgs;
          
          if (localTools[command]) {
            finalCommand = localTools[command]; // 'node'
            finalArgs = [localToolPaths[command], ...args]; // ['node_modules/eslint/bin/eslint.js', ...args]
          } else {
            finalCommand = command;
            finalArgs = args;
          }
          
          const childProcess = spawn(finalCommand, finalArgs, { 
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            cwd: process.cwd()
          });
          
          let stdout = '';
          let stderr = '';
          
          childProcess.stdout.on('data', (data) => stdout += data.toString());
          childProcess.stderr.on('data', (data) => stderr += data.toString());
          
          childProcess.on('close', (code) => {
            resolve({
              success: code === 0,
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: code
            });
          });
          
          childProcess.on('error', reject);
        });
      },

      async _executeBatched(command, args) {
        // Separate file arguments from other arguments
        const { fileArgs, otherArgs } = this._separateFileArgs(args);
        
        if (fileArgs.length === 0) {
          return await this._executeSingle(command, args);
        }

        // Batch files to avoid command line length limits
        const BATCH_SIZE = 50; // Process 50 files at a time
        const batches = [];
        for (let i = 0; i < fileArgs.length; i += BATCH_SIZE) {
          batches.push(fileArgs.slice(i, i + BATCH_SIZE));
        }

        // Execute each batch and combine results
        const results = [];
        let allSuccess = true;
        let combinedStdout = '';
        let combinedStderr = '';

        for (const batch of batches) {
          const batchArgs = [...otherArgs, ...batch];
          const result = await this._executeSingle(command, batchArgs);
          
          results.push(result);
          allSuccess = allSuccess && result.success;
          
          if (result.stdout) {
            combinedStdout += (combinedStdout ? '\n' : '') + result.stdout;
          }
          if (result.stderr) {
            combinedStderr += (combinedStderr ? '\n' : '') + result.stderr;
          }
        }

        return {
          success: allSuccess,
          stdout: combinedStdout,
          stderr: combinedStderr,
          exitCode: allSuccess ? 0 : 1,
          batched: true,
          batchCount: batches.length
        };
      },

      _hasFileArguments(args) {
        // Check if args contain file paths (simple heuristic)
        return args.some(arg => 
          !arg.startsWith('-') && 
          (arg.includes('.') && (arg.includes('/') || arg.includes('\\')))
        );
      },

      _separateFileArgs(args) {
        const fileArgs = [];
        const otherArgs = [];
        
        for (const arg of args) {
          if (!arg.startsWith('-') && 
              (arg.includes('.') && (arg.includes('/') || arg.includes('\\')))) {
            fileArgs.push(arg);
          } else {
            otherArgs.push(arg);
          }
        }
        
        return { fileArgs, otherArgs };
      }
    };
  }

  /**
   * Create file service instance (dependency injection)
   */
  _createFileService() {
    const fs = require('fs').promises;
    const path = require('path');
    
    return {
      async exists(filePath) {
        try {
          await fs.access(filePath);
          return true;
        } catch {
          return false;
        }
      },
      
      async readFile(filePath) {
        return await fs.readFile(filePath, 'utf-8');
      },
      
      async writeFile(filePath, content) {
        await fs.writeFile(filePath, content, 'utf-8');
      },
      
      resolve: path.resolve
    };
  }

  /**
   * Get available wrapper types
   */
  getAvailableWrapperTypes() {
    return Array.from(this.wrapperClasses.keys());
  }

  /**
   * Check if wrapper type is registered
   */
  hasWrapperType(wrapperType) {
    return this.wrapperClasses.has(wrapperType);
  }
}

module.exports = WrapperFactory;