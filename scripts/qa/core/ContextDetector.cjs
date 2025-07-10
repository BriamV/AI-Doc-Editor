/**
 * Context Detector - Git & File System Analysis
 * T-03: Context Detector implementation
 * 
 * Uses git CLI to detect current branch and modified files (staged and unstaged)
 * Maps files to their technology stacks by extension
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class ContextDetector {
  constructor(options = {}) {
    this.options = {
      cwd: process.cwd(),
      verbose: false,
      ...options
    };
    
    // Stack mapping by file extension
    this.stackMappings = {
      // Frontend
      '.ts': 'frontend',
      '.tsx': 'frontend', 
      '.js': 'frontend',
      '.jsx': 'frontend',
      '.vue': 'frontend',
      '.html': 'frontend',
      '.css': 'frontend',
      '.scss': 'frontend',
      '.sass': 'frontend',
      '.less': 'frontend',
      
      // Backend
      '.py': 'backend',
      '.pyi': 'backend',
      '.pyx': 'backend',
      '.pxd': 'backend',
      '.pth': 'backend',
      
      // Infrastructure/Tooling
      '.cjs': 'infrastructure',
      '.mjs': 'infrastructure',
      '.sh': 'infrastructure',
      '.bash': 'infrastructure',
      '.zsh': 'infrastructure',
      '.fish': 'infrastructure',
      '.ps1': 'infrastructure',
      '.bat': 'infrastructure',
      '.cmd': 'infrastructure',
      '.yml': 'infrastructure',
      '.yaml': 'infrastructure',
      '.json': 'infrastructure',
      '.toml': 'infrastructure',
      '.ini': 'infrastructure',
      '.cfg': 'infrastructure',
      '.conf': 'infrastructure',
      '.dockerfile': 'infrastructure',
      
      // Documentation
      '.md': 'docs',
      '.mdx': 'docs',
      '.rst': 'docs',
      '.txt': 'docs',
      
      // Tests (special handling)
      '.test.ts': 'testing',
      '.test.tsx': 'testing',
      '.test.js': 'testing',
      '.test.jsx': 'testing',
      '.spec.ts': 'testing',
      '.spec.tsx': 'testing',
      '.spec.js': 'testing',
      '.spec.jsx': 'testing',
      '.test.py': 'testing',
      '.spec.py': 'testing'
    };
    
    // Branch type patterns
    this.branchPatterns = {
      feature: /^feature\/|^feat\//i,
      bugfix: /^bugfix\/|^fix\/|^hotfix\//i,
      refactor: /^refactor\/|^refact\//i,
      chore: /^chore\//i,
      docs: /^docs?\//i,
      test: /^test\//i,
      release: /^release\/|^rel\//i,
      develop: /^develop$|^dev$/i,
      main: /^main$|^master$/i
    };
  }
  
  /**
   * Execute git command safely
   */
  execGit(command) {
    try {
      const result = execSync(`git ${command}`, {
        cwd: this.options.cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
      return result.trim();
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`Git command failed: git ${command}`, error.message);
      }
      return null;
    }
  }
  
  /**
   * Check if we're in a git repository
   */
  isGitRepository() {
    return this.execGit('rev-parse --git-dir') !== null;
  }
  
  /**
   * Get current branch name
   */
  getCurrentBranch() {
    const branch = this.execGit('rev-parse --abbrev-ref HEAD');
    return branch || 'unknown';
  }
  
  /**
   * Determine branch type from branch name
   */
  getBranchType(branchName) {
    for (const [type, pattern] of Object.entries(this.branchPatterns)) {
      if (pattern.test(branchName)) {
        return type;
      }
    }
    return 'other';
  }
  
  /**
   * Get modified files (staged and unstaged)
   */
  getModifiedFiles() {
    const files = {
      staged: [],
      unstaged: [],
      untracked: [],
      all: []
    };
    
    // Get staged files
    const staged = this.execGit('diff --cached --name-only');
    if (staged) {
      files.staged = staged.split('\n').filter(f => f.trim());
    }
    
    // Get unstaged files  
    const unstaged = this.execGit('diff --name-only');
    if (unstaged) {
      files.unstaged = unstaged.split('\n').filter(f => f.trim());
    }
    
    // Get untracked files
    const untracked = this.execGit('ls-files --others --exclude-standard');
    if (untracked) {
      files.untracked = untracked.split('\n').filter(f => f.trim());
    }
    
    // Combine all files (removing duplicates)
    const allFiles = new Set([
      ...files.staged,
      ...files.unstaged, 
      ...files.untracked
    ]);
    files.all = Array.from(allFiles);
    
    return files;
  }
  
  /**
   * Map file to technology stack
   */
  getFileStack(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();
    
    // Check for test files first (more specific)
    if (fileName.includes('.test.') || fileName.includes('.spec.')) {
      return 'testing';
    }
    
    // Check dockerfile
    if (fileName === 'dockerfile' || fileName.startsWith('dockerfile.')) {
      return 'infrastructure';
    }
    
    // Check package.json, requirements.txt, etc.
    const specialFiles = {
      'package.json': 'infrastructure',
      'package-lock.json': 'infrastructure',
      'yarn.lock': 'infrastructure',
      'requirements.txt': 'backend',
      'pyproject.toml': 'backend',
      'setup.py': 'backend',
      'makefile': 'infrastructure',
      'dockerfile': 'infrastructure',
      'docker-compose.yml': 'infrastructure',
      'docker-compose.yaml': 'infrastructure'
    };
    
    if (specialFiles[fileName]) {
      return specialFiles[fileName];
    }
    
    // Default extension mapping
    return this.stackMappings[ext] || 'unknown';
  }
  
  /**
   * Get stack distribution of files
   */
  getStackDistribution(files) {
    const distribution = {
      frontend: [],
      backend: [],
      infrastructure: [],
      testing: [],
      docs: [],
      unknown: []
    };
    
    for (const file of files) {
      const stack = this.getFileStack(file);
      if (distribution[stack]) {
        distribution[stack].push(file);
      } else {
        distribution.unknown.push(file);
      }
    }
    
    return distribution;
  }
  
  /**
   * Get git repository info
   */
  getRepositoryInfo() {
    const info = {
      isRepo: this.isGitRepository(),
      remoteUrl: null,
      defaultBranch: null
    };
    
    if (info.isRepo) {
      info.remoteUrl = this.execGit('config --get remote.origin.url');
      info.defaultBranch = this.execGit('symbolic-ref refs/remotes/origin/HEAD') || 'main';
      if (info.defaultBranch.includes('/')) {
        info.defaultBranch = info.defaultBranch.split('/').pop();
      }
    }
    
    return info;
  }
  
  /**
   * Get commit information
   */
  getCommitInfo() {
    const info = {
      lastCommitHash: null,
      lastCommitMessage: null,
      commitsSinceMain: 0
    };
    
    if (this.isGitRepository()) {
      info.lastCommitHash = this.execGit('rev-parse HEAD');
      info.lastCommitMessage = this.execGit('log -1 --pretty=%B');
      
      // Count commits since main/master
      const mainBranch = this.execGit('symbolic-ref refs/remotes/origin/HEAD') || 'origin/main';
      const commitCount = this.execGit(`rev-list --count HEAD ^${mainBranch.split('/').pop()}`);
      info.commitsSinceMain = commitCount ? parseInt(commitCount, 10) : 0;
    }
    
    return info;
  }
  
  /**
   * Detect complete context
   */
  detectContext() {
    const context = {
      timestamp: new Date().toISOString(),
      repository: this.getRepositoryInfo(),
      branch: {
        name: this.getCurrentBranch(),
        type: null
      },
      files: {
        modified: this.getModifiedFiles(),
        stacks: {},
        summary: {}
      },
      commit: this.getCommitInfo()
    };
    
    // Set branch type
    context.branch.type = this.getBranchType(context.branch.name);
    
    // Get stack distribution
    context.files.stacks = this.getStackDistribution(context.files.modified.all);
    
    // Create summary
    context.files.summary = {
      total: context.files.modified.all.length,
      staged: context.files.modified.staged.length,
      unstaged: context.files.modified.unstaged.length,
      untracked: context.files.modified.untracked.length,
      byStack: Object.fromEntries(
        Object.entries(context.files.stacks).map(([stack, files]) => [stack, files.length])
      )
    };
    
    return context;
  }
  
  /**
   * Get primary stack based on modified files
   */
  getPrimaryStack(context = null) {
    if (!context) {
      context = this.detectContext();
    }
    
    const stackCounts = context.files.summary.byStack;
    
    // Remove docs and unknown from consideration
    delete stackCounts.docs;
    delete stackCounts.unknown;
    
    // Find stack with most files
    const sortedStacks = Object.entries(stackCounts)
      .sort(([,a], [,b]) => b - a)
      .filter(([,count]) => count > 0);
    
    return sortedStacks.length > 0 ? sortedStacks[0][0] : 'unknown';
  }
  
  /**
   * Check if context suggests specific validation needs
   */
  suggestValidationScope(context = null) {
    if (!context) {
      context = this.detectContext();
    }
    
    const suggestions = {
      scopes: [],
      priority: 'normal',
      fastMode: false
    };
    
    // Suggest scopes based on modified files
    const stackCounts = context.files.summary.byStack;
    Object.entries(stackCounts).forEach(([stack, count]) => {
      if (count > 0 && stack !== 'unknown' && stack !== 'docs') {
        suggestions.scopes.push(stack);
      }
    });
    
    // Suggest fast mode for small changes
    if (context.files.summary.total <= 3) {
      suggestions.fastMode = true;
    }
    
    // Suggest priority based on branch type
    if (context.branch.type === 'hotfix' || context.branch.type === 'bugfix') {
      suggestions.priority = 'high';
    } else if (context.branch.type === 'feature') {
      suggestions.priority = 'normal';
    } else if (context.branch.type === 'docs' || context.branch.type === 'chore') {
      suggestions.priority = 'low';
    }
    
    return suggestions;
  }
}

module.exports = ContextDetector;