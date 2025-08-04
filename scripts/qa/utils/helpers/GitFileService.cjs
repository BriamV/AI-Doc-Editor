/**
 * Git File Service - Single Responsibility: Git file operations
 * SOLID-Lean refactoring from ExecutionController
 */

class GitFileService {
  constructor(logger) {
    this.logger = logger;
  }
  
  /**
   * Get staged files from git (fast mode optimization)
   */
  async getStagedFiles() {
    try {
      const { spawn } = require('child_process');
      return new Promise((resolve, reject) => {
        const git = spawn('git', ['diff', '--cached', '--name-only'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: process.cwd()
        });
        
        let stdout = '';
        git.stdout.on('data', (data) => stdout += data.toString());
        git.on('close', (code) => {
          if (code === 0) {
            const files = stdout.trim().split('\n').filter(f => f);
            resolve(files);
          } else {
            resolve([]);
          }
        });
        git.on('error', () => resolve([]));
      });
    } catch (error) {
      this.logger.debug(`Failed to get staged files: ${error.message}`);
      return [];
    }
  }

  /**
   * Get modified files from git (fast mode fallback)  
   */
  async getModifiedFiles() {
    try {
      const { spawn } = require('child_process');
      return new Promise((resolve, reject) => {
        const git = spawn('git', ['diff', '--name-only', 'HEAD'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: process.cwd()
        });
        
        let stdout = '';
        git.stdout.on('data', (data) => stdout += data.toString());
        git.on('close', (code) => {
          if (code === 0) {
            const files = stdout.trim().split('\n').filter(f => f);
            resolve(files);
          } else {
            resolve([]);
          }
        });
        git.on('error', () => resolve([]));
      });
    } catch (error) {
      this.logger.debug(`Failed to get modified files: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get all changed files (staged + modified)
   */
  async getAllChangedFiles() {
    const [staged, modified] = await Promise.all([
      this.getStagedFiles(),
      this.getModifiedFiles()
    ]);
    
    // Combine and deduplicate
    const allFiles = [...new Set([...staged, ...modified])];
    this.logger.debug(`Found ${allFiles.length} changed files (${staged.length} staged, ${modified.length} modified)`);
    
    return {
      staged,
      modified,
      all: allFiles
    };
  }
  
  /**
   * Check if repository has any changes
   */
  async hasChanges() {
    const changed = await this.getAllChangedFiles();
    return changed.all.length > 0;
  }
}

module.exports = GitFileService;