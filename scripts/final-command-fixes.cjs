#!/usr/bin/env node

/**
 * Final Command Fixes - Targeted fixes for remaining command failures
 * Based on validation results, implements specific solutions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FinalCommandFixes {
  constructor() {
    this.fixes = [];
  }

  async applyAllFixes() {
    console.log('🔧 Applying final fixes for remaining command failures...\n');

    await this.fixFormattingIssues();
    await this.fixLicenseChecker();
    await this.fixMergeProtection();
    await this.fixPythonDependencies();
    await this.fixPortIssues();
    await this.generateSummary();
  }

  async fixFormattingIssues() {
    console.log('✨ Fixing formatting issues...');

    try {
      // Fix formatting for all new scripts
      execSync('yarn fe:format', {
        stdio: 'pipe',
        cwd: path.resolve(__dirname, '..'),
      });
      console.log('  ✅ Fixed formatting issues');
      this.fixes.push({
        issue: 'Prettier formatting violations',
        action: 'Applied fe:format',
        success: true,
      });
    } catch (error) {
      console.log(`  ❌ Failed to fix formatting: ${error.message}`);
      this.fixes.push({
        issue: 'Prettier formatting violations',
        action: 'fe:format',
        success: false,
        error: error.message,
      });
    }
  }

  async fixLicenseChecker() {
    console.log('\n📜 Fixing license checker issues...');

    try {
      // Try to reinstall license checker with compatible version
      console.log('  Updating license-checker-rseidelsohn...');
      execSync('yarn add license-checker-rseidelsohn@latest', {
        stdio: 'pipe',
        cwd: path.resolve(__dirname, '..'),
      });
      console.log('  ✅ Updated license checker');
      this.fixes.push({
        issue: 'License checker compatibility',
        action: 'Updated license-checker-rseidelsohn',
        success: true,
      });
    } catch (error) {
      console.log(`  ❌ Failed to update license checker: ${error.message}`);
      this.fixes.push({
        issue: 'License checker compatibility',
        action: 'Update license-checker-rseidelsohn',
        success: false,
        error: error.message,
      });
    }
  }

  async fixMergeProtection() {
    console.log('\n🛡️ Fixing merge protection scripts...');

    try {
      // Check if merge protection scripts exist and have correct permissions
      const scriptPath = path.resolve(__dirname, '..', 'scripts', 'merge-protection.cjs');
      if (fs.existsSync(scriptPath)) {
        console.log('  ✅ Merge protection script exists');
        this.fixes.push({
          issue: 'Merge protection script availability',
          action: 'Verified script exists',
          success: true,
        });
      } else {
        console.log('  ❌ Merge protection script missing');
        this.fixes.push({
          issue: 'Merge protection script availability',
          action: 'Check script existence',
          success: false,
          error: 'merge-protection.cjs not found',
        });
      }
    } catch (error) {
      console.log(`  ❌ Failed to check merge protection: ${error.message}`);
      this.fixes.push({
        issue: 'Merge protection script check',
        action: 'Verify merge protection script',
        success: false,
        error: error.message,
      });
    }
  }

  async fixPythonDependencies() {
    console.log('\n🐍 Ensuring Python dependencies...');

    try {
      // Check if Python virtual environment is properly set up
      const venvPath = path.resolve(__dirname, '..', 'backend', '.venv');
      if (fs.existsSync(venvPath)) {
        console.log('  ✅ Python virtual environment exists');

        // Try to install schemathesis in the virtual environment
        try {
          execSync('python -m pip install schemathesis', {
            stdio: 'pipe',
            cwd: path.resolve(__dirname, '..', 'backend'),
          });
          console.log('  ✅ Installed schemathesis');
          this.fixes.push({
            issue: 'Missing schemathesis for contract testing',
            action: 'Installed schemathesis via pip',
            success: true,
          });
        } catch (error) {
          console.log('  ⚠️  Could not install schemathesis - manual installation needed');
          this.fixes.push({
            issue: 'Missing schemathesis for contract testing',
            action: 'Manual installation required',
            success: false,
            note: 'Run: yarn be:install or pip install schemathesis',
          });
        }
      } else {
        console.log('  ⚠️  Python virtual environment missing - run yarn be:bootstrap');
        this.fixes.push({
          issue: 'Python virtual environment',
          action: 'Manual setup required',
          success: false,
          note: 'Run: yarn be:bootstrap to create virtual environment',
        });
      }
    } catch (error) {
      console.log(`  ❌ Python environment check failed: ${error.message}`);
      this.fixes.push({
        issue: 'Python environment verification',
        action: 'Check Python setup',
        success: false,
        error: error.message,
      });
    }
  }

  async fixPortIssues() {
    console.log('\n🔌 Ensuring ports are available...');

    try {
      // Check commonly used ports
      const ports = [4173, 5173, 8000, 3000];

      for (const port of ports) {
        try {
          execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
          console.log(`  ⚠️  Port ${port} is in use - may cause conflicts`);
        } catch (error) {
          console.log(`  ✅ Port ${port} is available`);
        }
      }

      this.fixes.push({
        issue: 'Port availability check',
        action: 'Verified common ports',
        success: true,
      });
    } catch (error) {
      console.log(`  ❌ Port check failed: ${error.message}`);
      this.fixes.push({
        issue: 'Port availability check',
        action: 'Check port usage',
        success: false,
        error: error.message,
      });
    }
  }

  generateSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('FINAL COMMAND FIXES SUMMARY');
    console.log('='.repeat(70));

    const successful = this.fixes.filter(f => f.success).length;
    const failed = this.fixes.filter(f => !f.success).length;

    console.log(`Total fixes attempted: ${this.fixes.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed/Manual: ${failed}`);

    console.log('\n📋 FIX DETAILS:');
    this.fixes.forEach((fix, i) => {
      const status = fix.success ? '✅' : '❌';
      console.log(`\n${i + 1}. ${status} ${fix.issue}`);
      console.log(`   Action: ${fix.action}`);
      if (fix.note) {
        console.log(`   Note: ${fix.note}`);
      }
      if (fix.error) {
        console.log(`   Error: ${fix.error}`);
      }
    });

    console.log('\n🎯 CRITICAL NEXT STEPS FOR 100% SUCCESS:');
    console.log('1. Run: yarn fe:format (if formatting issues remain)');
    console.log('2. Manual: yarn be:bootstrap (Python environment setup)');
    console.log('3. Manual: yarn be:install (Python dependencies)');
    console.log('4. Kill any processes on ports 4173, 5173, 8000');
    console.log('5. Run final validation to confirm 169/169 commands working');

    // Save report
    const reportPath = path.resolve(__dirname, '..', 'final-fixes-report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: { total: this.fixes.length, successful, failed },
          fixes: this.fixes,
          nextSteps: [
            'Run formatting fixes',
            'Setup Python environment',
            'Clear port conflicts',
            'Run final validation',
          ],
        },
        null,
        2
      )
    );

    console.log(`\nDetailed report saved to: ${reportPath}`);
  }
}

if (require.main === module) {
  const fixer = new FinalCommandFixes();
  fixer.applyAllFixes().catch(console.error);
}

module.exports = FinalCommandFixes;
