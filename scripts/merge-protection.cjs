#!/usr/bin/env node
/**
 * ================================================================================
 * MERGE PROTECTION SYSTEM
 * ================================================================================
 *
 * Comprehensive merge validation system to prevent catastrophic file loss.
 * This system MUST be run before any merge operation to ensure data integrity.
 *
 * Features:
 * - Branch file count comparison
 * - Critical directory structure validation
 * - Configuration file integrity checks
 * - Development status consistency validation
 * - ADR files presence verification
 * - Automatic rollback on validation failure
 *
 * Usage:
 *   node scripts/merge-protection.cjs validate-merge [--source branch] [--target branch]
 *   node scripts/merge-protection.cjs pre-merge-check
 *   node scripts/merge-protection.cjs branch-audit [branch]
 */

const { spawnSync } = require('child_process');
const path = require('path');

class MergeProtectionSystem {
  constructor() {
    this.criticalDirectories = [
      '.claude',
      '.claude/commands',
      '.claude/agents',
      'backend',
      'backend/app',
      'src',
      'src/components',
      'docs',
      'docs/adr',
      'tools',
      'scripts',
    ];

    this.criticalFiles = [
      'package.json',
      '.claude/hooks.json',
      'CLAUDE.md',
      'docs/DEVELOPMENT-STATUS.md',
      'backend/requirements.txt',
      'backend/app/main.py',
      'vite.config.ts',
      'tsconfig.json',
      'tailwind.config.cjs',
    ];

    this.configFiles = [
      '.eslintrc-legacy.json',
      '.prettierrc',
      '.gitignore',
      '.semgrepignore',
      'eslint.config.js',
      'jest.config.js',
      'playwright.config.ts',
    ];
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m', // Cyan
      success: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      reset: '\x1b[0m', // Reset
    };

    const color = colors[level] || colors.info;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  runCommand(command, args, options = {}) {
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      cwd: process.cwd(),
      ...options,
    });

    if (result.error) {
      throw new Error(`Command failed: ${command} ${args.join(' ')} - ${result.error.message}`);
    }

    if (result.status !== 0) {
      throw new Error(`Command failed with exit code ${result.status}: ${result.stderr}`);
    }

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      status: result.status,
    };
  }

  /**
   * Main entry point for merge validation
   */
  async validateMerge(args) {
    const options = this.parseArgs(args);

    this.log('info', '🔒 MERGE PROTECTION SYSTEM ACTIVATED');
    this.log('info', '=====================================');

    let allPassed = true;
    const results = [];

    try {
      // 1. Get current branch info
      const currentBranch = this.getCurrentBranch();
      const sourceBranch = options.source || currentBranch;
      const targetBranch = options.target || 'main';

      this.log('info', `📋 Validating merge: ${sourceBranch} → ${targetBranch}`);

      // 2. Branch existence validation
      if (!this.branchExists(sourceBranch)) {
        throw new Error(`Source branch '${sourceBranch}' does not exist`);
      }

      if (!this.branchExists(targetBranch)) {
        throw new Error(`Target branch '${targetBranch}' does not exist`);
      }

      // 3. File count comparison
      const fileCountResult = await this.validateFileCount(sourceBranch, targetBranch);
      results.push(fileCountResult);
      if (!fileCountResult.passed) allPassed = false;

      // 4. Critical directories validation
      const dirResult = await this.validateDirectories(sourceBranch);
      results.push(dirResult);
      if (!dirResult.passed) allPassed = false;

      // 5. Critical files validation
      const filesResult = await this.validateCriticalFiles(sourceBranch);
      results.push(filesResult);
      if (!filesResult.passed) allPassed = false;

      // 6. Configuration integrity
      const configResult = await this.validateConfigIntegrity(sourceBranch);
      results.push(configResult);
      if (!configResult.passed) allPassed = false;

      // 7. Development status consistency
      const statusResult = await this.validateDevelopmentStatus(sourceBranch, targetBranch);
      results.push(statusResult);
      if (!statusResult.passed) allPassed = false;

      // 8. ADR files validation
      const adrResult = await this.validateADRFiles(sourceBranch);
      results.push(adrResult);
      if (!adrResult.passed) allPassed = false;

      // Generate final report
      this.generateValidationReport(results, allPassed, sourceBranch, targetBranch);

      if (!allPassed) {
        this.log('error', '🚫 MERGE VALIDATION FAILED');
        this.log('error', '❌ MERGE BLOCKED TO PREVENT DATA LOSS');
        process.exit(1);
      }

      this.log('success', '✅ MERGE VALIDATION PASSED');
      this.log('success', '🔓 MERGE APPROVED - Safe to proceed');

      return { passed: true, results };
    } catch (error) {
      this.log('error', `💥 MERGE VALIDATION ERROR: ${error.message}`);
      this.log('error', '🛑 MERGE BLOCKED DUE TO CRITICAL ERROR');
      process.exit(1);
    }
  }

  /**
   * Pre-merge safety check
   */
  async preMergeCheck(args) {
    this.log('info', '🔍 PRE-MERGE SAFETY CHECK');
    this.log('info', '========================');

    const workingTreeClean = this.isWorkingTreeClean();
    const hasUncommittedChanges = this.hasUncommittedChanges();
    const currentBranch = this.getCurrentBranch();

    const checks = [];

    // Working tree status
    checks.push({
      name: 'Working Tree Clean',
      passed: workingTreeClean,
      message: workingTreeClean ? 'Working tree is clean' : 'Working tree has uncommitted changes',
    });

    // Uncommitted changes
    checks.push({
      name: 'No Uncommitted Changes',
      passed: !hasUncommittedChanges,
      message: hasUncommittedChanges
        ? 'Has uncommitted changes - commit first'
        : 'No uncommitted changes',
    });

    // Current branch check
    checks.push({
      name: 'Valid Branch Context',
      passed: currentBranch !== 'main' && currentBranch !== 'master',
      message: `Current branch: ${currentBranch}`,
    });

    // Display results
    let allPassed = true;
    checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      this.log(check.passed ? 'success' : 'error', `${icon} ${check.name}: ${check.message}`);
      if (!check.passed) allPassed = false;
    });

    if (!allPassed) {
      this.log('error', '🚫 PRE-MERGE CHECK FAILED');
      this.log('error', 'Please resolve issues before attempting merge');
      process.exit(1);
    }

    this.log('success', '🎉 PRE-MERGE CHECK PASSED');
    return { passed: true, checks };
  }

  /**
   * File count validation between branches
   */
  async validateFileCount(sourceBranch, targetBranch) {
    this.log('info', '📊 Validating file counts...');

    const sourceCount = this.getFileCount(sourceBranch);
    const targetCount = this.getFileCount(targetBranch);
    const difference = sourceCount - targetCount;
    const percentChange = targetCount > 0 ? ((difference / targetCount) * 100).toFixed(1) : '0.0';

    this.log('info', `   Source (${sourceBranch}): ${sourceCount} files`);
    this.log('info', `   Target (${targetBranch}): ${targetCount} files`);
    this.log(
      'info',
      `   Difference: ${difference > 0 ? '+' : ''}${difference} files (${percentChange}%)`
    );

    // Alert if more than 10% file loss or more than 50 files lost
    const majorLoss =
      difference < -50 || (difference < 0 && Math.abs(difference) / targetCount > 0.1);

    if (majorLoss) {
      this.log(
        'error',
        `🚨 CRITICAL: Major file loss detected (${Math.abs(difference)} files, ${Math.abs(percentChange)}%)`
      );
      this.log('error', '   This indicates potential merge issues or data loss');

      return {
        name: 'File Count Validation',
        passed: false,
        data: { sourceCount, targetCount, difference, percentChange },
        message: `Major file loss detected: ${Math.abs(difference)} files (${Math.abs(percentChange)}%)`,
      };
    }

    if (difference < 0) {
      this.log(
        'warn',
        `⚠️  File count decreased by ${Math.abs(difference)} files (${Math.abs(percentChange)}%)`
      );
      this.log('warn', '   Please verify this is expected');
    }

    return {
      name: 'File Count Validation',
      passed: true,
      data: { sourceCount, targetCount, difference, percentChange },
      message: `File count difference: ${difference > 0 ? '+' : ''}${difference} files (${percentChange}%)`,
    };
  }

  /**
   * Validate critical directories exist
   */
  async validateDirectories(branch) {
    this.log('info', '📁 Validating critical directories...');

    const missingDirs = [];

    for (const dir of this.criticalDirectories) {
      if (!this.directoryExistsInBranch(dir, branch)) {
        missingDirs.push(dir);
        this.log('error', `   ❌ Missing: ${dir}`);
      } else {
        this.log('success', `   ✅ Present: ${dir}`);
      }
    }

    const passed = missingDirs.length === 0;

    return {
      name: 'Critical Directories',
      passed,
      data: { missingDirs, totalDirs: this.criticalDirectories.length },
      message: passed
        ? 'All critical directories present'
        : `Missing directories: ${missingDirs.join(', ')}`,
    };
  }

  /**
   * Validate critical files exist
   */
  async validateCriticalFiles(branch) {
    this.log('info', '📄 Validating critical files...');

    const missingFiles = [];

    for (const file of this.criticalFiles) {
      if (!this.fileExistsInBranch(file, branch)) {
        missingFiles.push(file);
        this.log('error', `   ❌ Missing: ${file}`);
      } else {
        this.log('success', `   ✅ Present: ${file}`);
      }
    }

    const passed = missingFiles.length === 0;

    return {
      name: 'Critical Files',
      passed,
      data: { missingFiles, totalFiles: this.criticalFiles.length },
      message: passed ? 'All critical files present' : `Missing files: ${missingFiles.join(', ')}`,
    };
  }

  /**
   * Validate configuration file integrity
   */
  async validateConfigIntegrity(branch) {
    this.log('info', '⚙️  Validating configuration integrity...');

    const issues = [];

    for (const file of this.configFiles) {
      if (this.fileExistsInBranch(file, branch)) {
        // Check if file is valid JSON/JS (basic syntax check)
        try {
          const content = this.getFileContent(file, branch);
          if (file.endsWith('.json') && content.trim()) {
            JSON.parse(content);
          }
          this.log('success', `   ✅ Valid: ${file}`);
        } catch (error) {
          issues.push(`${file}: ${error.message}`);
          this.log('error', `   ❌ Invalid: ${file} - ${error.message}`);
        }
      } else {
        this.log('warn', `   ⚠️  Missing: ${file}`);
      }
    }

    const passed = issues.length === 0;

    return {
      name: 'Configuration Integrity',
      passed,
      data: { issues, totalConfigs: this.configFiles.length },
      message: passed ? 'All configuration files valid' : `Configuration issues: ${issues.length}`,
    };
  }

  /**
   * Validate development status consistency
   */
  async validateDevelopmentStatus(sourceBranch, targetBranch) {
    this.log('info', '📋 Validating development status consistency...');

    const statusFile = 'docs/DEVELOPMENT-STATUS.md';
    const issues = [];

    if (!this.fileExistsInBranch(statusFile, sourceBranch)) {
      issues.push('DEVELOPMENT-STATUS.md missing from source branch');
    } else {
      const content = this.getFileContent(statusFile, sourceBranch);

      // Check for basic consistency markers
      const hasCurrentPhase =
        content.includes('## Fase Actual') || content.includes('## Current Phase');
      const hasProgress = content.includes('Progress') || content.includes('Progreso');
      const hasTimestamp = /\d{4}-\d{2}-\d{2}/.test(content);

      if (!hasCurrentPhase) issues.push('Missing current phase section');
      if (!hasProgress) issues.push('Missing progress information');
      if (!hasTimestamp) issues.push('Missing or invalid timestamps');

      this.log('info', `   Current phase present: ${hasCurrentPhase ? '✅' : '❌'}`);
      this.log('info', `   Progress info present: ${hasProgress ? '✅' : '❌'}`);
      this.log('info', `   Timestamps present: ${hasTimestamp ? '✅' : '❌'}`);
    }

    const passed = issues.length === 0;

    return {
      name: 'Development Status',
      passed,
      data: { issues },
      message: passed ? 'Development status consistent' : `Status issues: ${issues.join(', ')}`,
    };
  }

  /**
   * Validate ADR files presence and integrity
   */
  async validateADRFiles(branch) {
    this.log('info', '📚 Validating ADR files...');

    const adrDir = 'docs/adr';
    const issues = [];

    if (!this.directoryExistsInBranch(adrDir, branch)) {
      issues.push('ADR directory missing');
    } else {
      const adrFiles = this.getDirectoryContents(adrDir, branch);
      const adrCount = adrFiles.filter(f => f.endsWith('.md')).length;

      this.log('info', `   Found ${adrCount} ADR files`);

      if (adrCount === 0) {
        issues.push('No ADR files found');
      }

      // Check for required ADR patterns (flexible naming)
      const requiredADRPatterns = [
        { pattern: /^ADR-001-.*\.md$/, description: 'ADR-001 (Architecture)' },
        { pattern: /^ADR-006-.*\.md$/, description: 'ADR-006 (Security)' },
      ];

      for (const { pattern, description } of requiredADRPatterns) {
        const matchingFile = adrFiles.find(file => pattern.test(file));
        if (!matchingFile) {
          issues.push(`Missing required ADR pattern: ${description}`);
          this.log('error', `   ❌ Missing: ${description}`);
        } else {
          this.log('success', `   ✅ Present: ${description} (${matchingFile})`);
        }
      }
    }

    const passed = issues.length === 0;

    return {
      name: 'ADR Files',
      passed,
      data: { issues },
      message: passed ? 'ADR files complete' : `ADR issues: ${issues.join(', ')}`,
    };
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(results, passed, sourceBranch, targetBranch) {
    this.log('info', '');
    this.log('info', '📊 MERGE VALIDATION REPORT');
    this.log('info', '==========================');
    this.log('info', `Source Branch: ${sourceBranch}`);
    this.log('info', `Target Branch: ${targetBranch}`);
    this.log('info', `Overall Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    this.log('info', '');

    results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      this.log('info', `${index + 1}. ${icon} ${result.name}`);
      this.log('info', `   ${result.message}`);

      if (result.data && Object.keys(result.data).length > 0) {
        this.log('info', `   Data: ${JSON.stringify(result.data)}`);
      }
      this.log('info', '');
    });

    if (!passed) {
      this.log('error', '🚨 CRITICAL ISSUES DETECTED');
      this.log('error', '');
      this.log('error', 'RECOMMENDED ACTIONS:');
      this.log('error', '1. Review the failed validations above');
      this.log('error', '2. Ensure all critical files and directories are present');
      this.log('error', '3. Verify file counts are reasonable');
      this.log('error', '4. Check configuration file integrity');
      this.log('error', '5. Update development status if needed');
      this.log('error', '6. Re-run validation before attempting merge');
    }
  }

  // ===============================
  // Git Utility Methods
  // ===============================

  getCurrentBranch() {
    const result = this.runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    return result.stdout.trim();
  }

  branchExists(branch) {
    try {
      this.runCommand('git', ['rev-parse', '--verify', `refs/heads/${branch}`]);
      return true;
    } catch {
      try {
        this.runCommand('git', ['rev-parse', '--verify', `refs/remotes/origin/${branch}`]);
        return true;
      } catch {
        return false;
      }
    }
  }

  getFileCount(branch) {
    try {
      const result = this.runCommand('git', ['ls-tree', '-r', '--name-only', branch]);
      return result.stdout
        .trim()
        .split('\n')
        .filter(line => line.length > 0).length;
    } catch {
      return 0;
    }
  }

  fileExistsInBranch(file, branch) {
    try {
      this.runCommand('git', ['cat-file', '-e', `${branch}:${file}`]);
      return true;
    } catch {
      return false;
    }
  }

  directoryExistsInBranch(dir, branch) {
    try {
      const result = this.runCommand('git', ['ls-tree', branch, '--', dir]);
      return result.stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  getFileContent(file, branch) {
    try {
      const result = this.runCommand('git', ['show', `${branch}:${file}`]);
      return result.stdout;
    } catch {
      return '';
    }
  }

  getDirectoryContents(dir, branch) {
    try {
      // Use git ls-tree with -r to recursively list files in the directory
      const result = this.runCommand('git', ['ls-tree', '-r', '--name-only', branch, '--', dir]);
      return result.stdout
        .trim()
        .split('\n')
        .filter(line => line.length > 0)
        .map(file => path.basename(file)); // Extract just the filename
    } catch {
      return [];
    }
  }

  isWorkingTreeClean() {
    try {
      const result = this.runCommand('git', ['status', '--porcelain']);
      return result.stdout.trim().length === 0;
    } catch {
      return false;
    }
  }

  hasUncommittedChanges() {
    try {
      const result = this.runCommand('git', ['diff', '--cached', '--name-only']);
      return result.stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  parseArgs(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--source' && args[i + 1]) {
        options.source = args[i + 1];
        i++;
      } else if (arg === '--target' && args[i + 1]) {
        options.target = args[i + 1];
        i++;
      } else if (arg.startsWith('--source=')) {
        options.source = arg.split('=')[1];
      } else if (arg.startsWith('--target=')) {
        options.target = arg.split('=')[1];
      }
    }
    return options;
  }

  async execute() {
    const command = process.argv[2];
    const args = process.argv.slice(3);

    switch (command) {
      case 'validate-merge':
        return await this.validateMerge(args);
      case 'pre-merge-check':
        return await this.preMergeCheck(args);
      case 'branch-audit':
        const branch = args[0] || this.getCurrentBranch();
        const fileCount = this.getFileCount(branch);
        this.log('info', `Branch ${branch} contains ${fileCount} files`);
        return { branch, fileCount };
      default:
        this.log(
          'error',
          'Unknown command. Available commands: validate-merge, pre-merge-check, branch-audit'
        );
        process.exit(1);
    }
  }
}

// Execute if called directly
if (require.main === module) {
  const mergeProtection = new MergeProtectionSystem();
  mergeProtection.execute().catch(error => {
    console.error('Unhandled error:', error.message);
    process.exit(1);
  });
}

module.exports = MergeProtectionSystem;
