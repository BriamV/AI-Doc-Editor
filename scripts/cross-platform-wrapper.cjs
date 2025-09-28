#!/usr/bin/env node
/**
 * Cross-Platform Script Wrapper
 *
 * Provides cross-platform execution for bash scripts and shell commands
 * that need to work in Windows PowerShell, CMD, WSL, and Unix environments.
 *
 * Usage:
 *   node scripts/cross-platform-wrapper.cjs script <path> [args]  - Run shell script
 *   node scripts/cross-platform-wrapper.cjs validate-docs [args] - Run document validation
 *
 * Features:
 * - Automatic platform detection (Windows/macOS/Linux/WSL)
 * - Fallback execution strategies for Windows environments
 * - Proper error handling and exit code forwarding
 * - Integration with existing multiplatform.cjs infrastructure
 */

const { spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class CrossPlatformWrapper {
  constructor() {
    // Platform detection
    this.isWin = process.platform === 'win32';
    this.isMac = process.platform === 'darwin';
    this.isLinux = process.platform === 'linux';
    this.isWSL = this.detectWSL();

    // Path configuration
    this.repoRoot = process.cwd();
    this.toolsDir = path.join(this.repoRoot, 'tools');
    this.scriptsDir = path.join(this.repoRoot, 'scripts');

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
      return release.toLowerCase().includes('microsoft') || release.toLowerCase().includes('wsl');
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
   * Find suitable shell interpreter for the platform
   */
  findShellInterpreter() {
    if (this.isWin) {
      // On Windows, try to find bash in common locations
      // EXCLUDE WSL bash to avoid WSL dependency issues
      const bashPaths = [
        'C:\\Program Files\\Git\\bin\\bash.exe',
        'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
        'C:\\msys64\\usr\\bin\\bash.exe',
        'C:\\msys32\\usr\\bin\\bash.exe',
        // REMOVED: 'C:\\Windows\\System32\\bash.exe' - WSL bash causes issues
      ];

      for (const bashPath of bashPaths) {
        if (this.fileExists(bashPath)) {
          this.log('debug', `Found bash at: ${bashPath}`);
          return { interpreter: bashPath, type: 'bash' };
        }
      }

      // Try bash from PATH, but exclude WSL bash
      try {
        const result = spawnSync('bash', ['--version'], { stdio: 'pipe' });
        if (result.status === 0) {
          // Check if this is WSL bash by examining the output
          const output = result.stdout ? result.stdout.toString() : '';
          if (output.toLowerCase().includes('ubuntu') || output.toLowerCase().includes('wsl')) {
            this.log('debug', 'Found WSL bash in PATH, skipping to avoid WSL dependency');
          } else {
            this.log('debug', 'Found bash in PATH');
            return { interpreter: 'bash', type: 'bash' };
          }
        }
      } catch {
        // Ignore
      }

      // Fallback to Node.js implementation for Windows
      this.log('debug', 'No suitable bash found, using Node.js fallback');
      return { interpreter: 'node', type: 'node' };
    } else {
      // Unix-like systems
      return { interpreter: 'bash', type: 'bash' };
    }
  }

  /**
   * Execute shell script with cross-platform compatibility
   */
  executeScript(scriptPath, args = []) {
    this.log('debug', `Executing script: ${scriptPath} with args: ${args.join(' ')}`);

    if (!this.fileExists(scriptPath)) {
      throw new Error(`Script not found: ${scriptPath}`);
    }

    const shell = this.findShellInterpreter();

    if (shell.type === 'bash') {
      // Use bash execution with timeout
      const result = spawnSync(shell.interpreter, [scriptPath, ...args], {
        stdio: 'inherit',
        cwd: this.repoRoot,
        env: process.env,
        timeout: 30000, // 30 second timeout
      });

      if (result.error) {
        if (result.error.code === 'ETIMEDOUT') {
          this.log(
            'warn',
            'Bash script execution timed out, falling back to Node.js implementation'
          );
          throw new Error('FALLBACK_REQUIRED');
        }
        throw new Error(`Failed to execute script: ${result.error.message}`);
      }

      return result.status || 0;
    } else {
      // Node.js fallback - shell script execution not available
      throw new Error('FALLBACK_REQUIRED');
    }
  }

  /**
   * Document validation wrapper - cross-platform document placement validation
   */
  async runDocumentValidation(args = []) {
    this.log('info', 'Running cross-platform document validation...');

    // On Windows, prefer Node.js fallback due to bash compatibility issues
    if (this.isWin) {
      this.log('info', 'Using Node.js implementation for Windows compatibility...');
      return this.runDocumentValidationNodeFallback(args);
    }

    const validationScript = path.join(this.toolsDir, 'validate-document-placement.sh');

    if (!this.fileExists(validationScript)) {
      throw new Error(`Document validation script not found: ${validationScript}`);
    }

    try {
      const exitCode = this.executeScript(validationScript, args);
      this.log('info', `Document validation completed with exit code: ${exitCode}`);
      return exitCode;
    } catch (error) {
      if (
        error.message === 'FALLBACK_REQUIRED' ||
        error.message.includes('Bash script execution not available')
      ) {
        // Use Node.js fallback implementation
        this.log(
          'info',
          'Using Node.js fallback for document validation (bash execution failed)...'
        );
        return this.runDocumentValidationNodeFallback(args);
      }
      throw error;
    }
  }

  /**
   * Node.js fallback for document validation when bash is not available
   */
  async runDocumentValidationNodeFallback(args = []) {
    this.log('info', 'Running Node.js document validation implementation...');

    // Parse command line arguments
    const fixMode = args.includes('--fix');
    const strictMode = args.includes('--strict');
    const reportMode = args.includes('--report');
    const verboseMode = args.includes('--verbose') || this.verbose;

    const validationResults = {
      violations: 0,
      criticalIssues: 0,
      checked: 0,
      misplacedFiles: [],
      missingFiles: [],
      findings: [],
    };

    try {
      // 1. Check essential directories structure
      const essentialDirs = [
        'docs',
        'docs/templates',
        'docs/architecture',
        'docs/architecture/adr',
        'tools',
        'scripts',
        '.claude',
        '.claude/commands',
        'backend',
        'backend/docs',
        'src/docs',
      ];

      this.log('info', '1. Validating directory structure...');
      for (const dir of essentialDirs) {
        const dirPath = path.join(this.repoRoot, dir);
        if (this.fileExists(dirPath)) {
          if (verboseMode) this.log('debug', `✓ Directory exists: ${dir}`);
        } else {
          this.log('warn', `✗ Missing directory: ${dir}`);
          validationResults.missingFiles.push(dir);
          validationResults.violations++;
        }
        validationResults.checked++;
      }

      // 2. Check for essential template and guideline files
      const essentialFiles = [
        'docs/templates/DOCUMENTATION-PLACEMENT-GUIDELINES.md',
        'docs/templates/README-VALIDATION-CHECKLIST.md',
        'CLAUDE.md',
        'README.md',
      ];

      this.log('info', '2. Validating essential files...');
      for (const file of essentialFiles) {
        const filePath = path.join(this.repoRoot, file);
        if (this.fileExists(filePath)) {
          if (verboseMode) this.log('debug', `✓ File exists: ${file}`);
        } else {
          this.log('warn', `✗ Missing essential file: ${file}`);
          validationResults.missingFiles.push(file);
          validationResults.violations++;
        }
        validationResults.checked++;
      }

      // 3. Check for misplaced files in root directory
      this.log('info', '3. Checking for misplaced files in root...');
      try {
        const rootFiles = fs
          .readdirSync(this.repoRoot)
          .filter(file => {
            const filePath = path.join(this.repoRoot, file);
            const stat = fs.statSync(filePath);
            return stat.isFile() && file.endsWith('.md');
          })
          .filter(
            file =>
              !['README.md', 'CLAUDE.md', 'CHANGELOG.md', 'LICENSE.md', 'CONTRIBUTING.md'].includes(
                file
              )
          );

        for (const file of rootFiles) {
          this.log('warn', `✗ Potentially misplaced file in root: ${file}`);
          validationResults.misplacedFiles.push({ file, location: 'root', suggestion: 'docs/' });
          validationResults.violations++;
        }
        validationResults.checked += rootFiles.length;
      } catch (error) {
        this.log('warn', `Could not scan root directory: ${error.message}`);
      }

      // 4. Validate README files in key directories
      this.log('info', '4. Validating README files in key directories...');
      const keyDirsRequiringReadme = ['tools', 'scripts', 'docs', 'backend/docs', 'src/docs'];

      for (const dir of keyDirsRequiringReadme) {
        const dirPath = path.join(this.repoRoot, dir);
        const readmePath = path.join(dirPath, 'README.md');

        if (this.fileExists(dirPath)) {
          if (this.fileExists(readmePath)) {
            if (verboseMode) this.log('debug', `✓ README.md exists in ${dir}`);
          } else {
            this.log('warn', `✗ Missing README.md in ${dir}`);
            validationResults.missingFiles.push(`${dir}/README.md`);
            validationResults.violations++;
          }
          validationResults.checked++;
        }
      }

      // 5. Check .claude/commands structure
      this.log('info', '5. Validating .claude/commands structure...');
      const claudeCommandsPath = path.join(this.repoRoot, '.claude', 'commands');
      if (this.fileExists(claudeCommandsPath)) {
        try {
          const commandFiles = fs
            .readdirSync(claudeCommandsPath)
            .filter(file => file.endsWith('.md'));

          if (commandFiles.length === 0) {
            this.log('warn', '✗ No command files found in .claude/commands');
            validationResults.violations++;
          } else {
            if (verboseMode)
              this.log('debug', `✓ Found ${commandFiles.length} command files in .claude/commands`);
          }
          validationResults.checked++;
        } catch (error) {
          this.log('warn', `Could not scan .claude/commands: ${error.message}`);
        }
      }

      // Generate summary report
      this.log('info', '\n=== DOCUMENT VALIDATION SUMMARY ===');
      this.log('info', `Checked: ${validationResults.checked} items`);
      this.log('info', `Violations: ${validationResults.violations}`);
      this.log('info', `Critical Issues: ${validationResults.criticalIssues}`);

      if (validationResults.misplacedFiles.length > 0) {
        this.log('warn', `\nMisplaced files (${validationResults.misplacedFiles.length}):`);
        for (const item of validationResults.misplacedFiles) {
          this.log('warn', `  - ${item.file} (suggest: ${item.suggestion})`);
        }
      }

      if (validationResults.missingFiles.length > 0) {
        this.log('warn', `\nMissing files/directories (${validationResults.missingFiles.length}):`);
        for (const item of validationResults.missingFiles) {
          this.log('warn', `  - ${item}`);
        }
      }

      if (reportMode) {
        this.log('info', '\n=== DETAILED REPORT MODE ===');
        this.log('info', 'Node.js fallback implementation active');
        this.log('info', 'For full bash script functionality, install Git Bash');
      }

      // Handle strict mode
      if (strictMode && validationResults.violations > 0) {
        this.log('error', 'STRICT MODE: Validation failed due to violations');
        return 1;
      }

      // Return appropriate exit code
      if (validationResults.criticalIssues > 0) {
        return 2; // Critical issues
      } else if (validationResults.violations > 0) {
        return 1; // Violations found
      } else {
        this.log('info', '✓ All document placement validation checks passed');
        return 0; // Success
      }
    } catch (error) {
      this.log('error', `Document validation failed: ${error.message}`);
      if (verboseMode) {
        this.log('error', error.stack);
      }
      return 2;
    }
  }

  /**
   * Main command router
   */
  async execute() {
    const [, , command, ...args] = process.argv;

    if (!command) {
      console.error('Usage: node scripts/cross-platform-wrapper.cjs <command> [args...]');
      console.error('Commands:');
      console.error('  script <path> [args]      - Execute shell script');
      console.error('  validate-docs [args]      - Run document validation');
      process.exit(1);
    }

    try {
      switch (command) {
        case 'script': {
          const [scriptPath, ...scriptArgs] = args;
          if (!scriptPath) {
            console.error('Script path is required');
            console.error('Usage: node scripts/cross-platform-wrapper.cjs script <path> [args]');
            process.exit(1);
          }
          const exitCode = this.executeScript(scriptPath, scriptArgs);
          process.exit(exitCode);
        }

        case 'validate-docs': {
          const exitCode = await this.runDocumentValidation(args);
          process.exit(exitCode);
        }

        default:
          console.error(`Unknown command: ${command}`);
          console.error('Available commands: script, validate-docs');
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
  const wrapper = new CrossPlatformWrapper();
  wrapper.execute().catch(error => {
    console.error('Unhandled error:', error.message);
    process.exit(1);
  });
}

module.exports = CrossPlatformWrapper;
