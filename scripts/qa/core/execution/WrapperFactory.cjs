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
    this.wrapperClasses.set('direct-linters', () => require('../wrappers/DirectLintersOrchestrator.cjs'));
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
          
          const process = spawn(finalCommand, finalArgs, { 
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            cwd: process.cwd()
          });
          
          let stdout = '';
          let stderr = '';
          
          process.stdout.on('data', (data) => stdout += data.toString());
          process.stderr.on('data', (data) => stderr += data.toString());
          
          process.on('close', (code) => {
            resolve({
              success: code === 0,
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: code
            });
          });
          
          process.on('error', reject);
        });
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