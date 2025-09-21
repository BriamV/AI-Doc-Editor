#!/usr/bin/env node
/**
 * ================================================================================
 * GIT HOOKS INSTALLER FOR MERGE PROTECTION
 * ================================================================================
 *
 * Installs mandatory git hooks to prevent catastrophic merge failures.
 * These hooks create a final safety net in addition to yarn commands.
 *
 * Usage:
 *   node scripts/install-merge-hooks.cjs
 *   yarn install-merge-hooks
 */

const fs = require('fs');
const path = require('path');

class GitHooksInstaller {
  constructor() {
    this.hooksDir = '.git/hooks';
    this.scriptsDir = 'scripts';
  }

  log(level, message) {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[level]}${message}${colors.reset}`);
  }

  ensureHooksDir() {
    if (!fs.existsSync(this.hooksDir)) {
      fs.mkdirSync(this.hooksDir, { recursive: true });
      this.log('info', '📁 Created .git/hooks directory');
    }
  }

  createPreMergeCommitHook() {
    const hookPath = path.join(this.hooksDir, 'pre-merge-commit');
    const hookContent = `#!/bin/sh
#
# MERGE PROTECTION: Pre-merge commit hook
# Prevents commits that could cause data loss during merges
#

echo "🔒 MERGE PROTECTION: Pre-merge commit validation..."

# Check if this is a merge commit
if [ -f .git/MERGE_HEAD ]; then
  echo "🔍 Merge commit detected - running safety checks..."

  # Run merge protection validation
  if ! node scripts/merge-protection.cjs pre-merge-check; then
    echo "🚫 MERGE BLOCKED: Pre-merge check failed"
    echo "❌ Commit aborted to prevent data loss"
    exit 1
  fi

  echo "✅ Merge safety checks passed"
fi

echo "🔓 Pre-merge commit validation complete"
`;

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    this.log('success', '✅ Installed pre-merge-commit hook');
  }

  createPrePushHook() {
    const hookPath = path.join(this.hooksDir, 'pre-push');
    const hookContent = `#!/bin/sh
#
# MERGE PROTECTION: Pre-push hook
# Final validation before pushing potentially dangerous merges
#

echo "🔒 MERGE PROTECTION: Pre-push validation..."

protected_branches="main master"
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\\(.*\\),\\1,')

# Check if pushing to protected branch
for branch in $protected_branches; do
  if [ "$current_branch" = "$branch" ]; then
    echo "🚨 CRITICAL: Attempting to push to protected branch: $branch"

    # Get last commit message to check if it's a merge
    last_commit=$(git log -1 --pretty=%B)
    if echo "$last_commit" | grep -q "^Merge"; then
      echo "🔍 Merge commit detected in protected branch"

      # Run comprehensive merge validation
      if ! node scripts/merge-protection.cjs validate-merge --target "$branch"; then
        echo "🚫 PUSH BLOCKED: Merge validation failed"
        echo "❌ This push could cause data loss"
        echo ""
        echo "🛠️  RECOVERY STEPS:"
        echo "1. Run: yarn validate-merge"
        echo "2. Review and fix any issues"
        echo "3. Re-run validation before pushing"
        exit 1
      fi
    fi

    echo "✅ Protected branch push validation passed"
    break
  fi
done

echo "🔓 Pre-push validation complete"
`;

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    this.log('success', '✅ Installed pre-push hook');
  }

  createPostMergeHook() {
    const hookPath = path.join(this.hooksDir, 'post-merge');
    const hookContent = `#!/bin/sh
#
# MERGE PROTECTION: Post-merge hook
# Validates merge integrity and updates project status
#

echo "🔒 MERGE PROTECTION: Post-merge validation..."

# Check if merge was successful
if [ $? -eq 0 ]; then
  echo "🔍 Merge completed - running integrity checks..."

  # Run post-merge audit
  if ! node scripts/merge-protection.cjs branch-audit; then
    echo "⚠️  Post-merge audit detected issues"
    echo "📋 Please review the merge results"
  fi

  # Check for critical file losses
  echo "📊 Checking file count integrity..."
  file_count=$(git ls-files | wc -l)
  echo "📁 Current file count: $file_count"

  if [ "$file_count" -lt 100 ]; then
    echo "🚨 WARNING: Suspiciously low file count after merge"
    echo "⚠️  Please verify merge integrity manually"
  fi

  echo "✅ Post-merge validation complete"
else
  echo "❌ Merge failed - no post-merge validation needed"
fi
`;

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    this.log('success', '✅ Installed post-merge hook');
  }

  install() {
    this.log('info', '🔧 Installing Git Hooks for Merge Protection');
    this.log('info', '===========================================');

    try {
      this.ensureHooksDir();
      this.createPreMergeCommitHook();
      this.createPrePushHook();
      this.createPostMergeHook();

      this.log('success', '');
      this.log('success', '🎉 Git hooks installation completed!');
      this.log('success', '');
      this.log('info', '📋 Installed hooks:');
      this.log('info', '  • pre-merge-commit: Validates merge safety before commits');
      this.log('info', '  • pre-push: Prevents dangerous pushes to protected branches');
      this.log('info', '  • post-merge: Validates merge integrity after completion');
      this.log('success', '');
      this.log('success', '🛡️  Your repository is now protected against merge disasters!');

    } catch (error) {
      this.log('error', `💥 Hook installation failed: ${error.message}`);
      process.exit(1);
    }
  }

  uninstall() {
    this.log('info', '🗑️  Uninstalling merge protection hooks...');

    const hooks = ['pre-merge-commit', 'pre-push', 'post-merge'];
    let removed = 0;

    hooks.forEach(hook => {
      const hookPath = path.join(this.hooksDir, hook);
      if (fs.existsSync(hookPath)) {
        fs.unlinkSync(hookPath);
        this.log('success', `✅ Removed ${hook} hook`);
        removed++;
      }
    });

    if (removed > 0) {
      this.log('success', `🗑️  Uninstalled ${removed} merge protection hooks`);
    } else {
      this.log('info', '📋 No merge protection hooks found to remove');
    }
  }
}

// Execute if called directly
if (require.main === module) {
  const installer = new GitHooksInstaller();
  const action = process.argv[2] || 'install';

  switch (action) {
    case 'install':
      installer.install();
      break;
    case 'uninstall':
      installer.uninstall();
      break;
    default:
      console.log('Usage: node scripts/install-merge-hooks.cjs [install|uninstall]');
      process.exit(1);
  }
}

module.exports = GitHooksInstaller;