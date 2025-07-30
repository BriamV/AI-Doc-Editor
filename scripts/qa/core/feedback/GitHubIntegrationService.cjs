/**
 * GitHubIntegrationService.cjs - GitHub Integration Service
 * Single Responsibility: Only handle GitHub URL generation and browser integration
 * Extracted from FeedbackManager.cjs for better modularity (RNF-001: ≤212 lines)
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);

class GitHubIntegrationService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };
    
    // GitHub repository configuration
    this.repositoryOwner = config?.github?.owner || 'BriamV';
    this.repositoryName = config?.github?.repo || 'AI-Doc-Editor';
    this.baseUrl = `https://github.com/${this.repositoryOwner}/${this.repositoryName}`;
    
    // URL constraints
    this.MAX_URL_LENGTH = 8000;  // GitHub URL practical limit
    this.MAX_BODY_LENGTH = 4000; // Safe body length for URLs
  }
  
  /**
   * Create GitHub issue URL with progressive truncation strategy
   */
  async createGitHubIssueUrl(issueBody, context = {}) {
    try {
      this.logger.info('GitHubIntegrationService: Creating GitHub issue URL...');
      
      const title = context.title || this._generateDefaultTitle(context);
      const labels = context.labels || this._generateDefaultLabels(context);
      
      // Try progressive strategies to fit URL length constraints
      return await this._tryProgressiveUrlGeneration(title, issueBody, labels, context);
      
    } catch (error) {
      this.logger.error(`GitHubIntegrationService: Failed to create GitHub URL: ${error.message}`);
      return {
        success: false,
        error: error.message,
        fallbackUrl: `${this.baseUrl}/issues/new`
      };
    }
  }
  
  /**
   * Open GitHub issue in browser
   */
  async openInBrowser(url) {
    try {
      this.logger.info('GitHubIntegrationService: Opening GitHub issue in browser...');
      
      const platform = os.platform();
      let command;
      
      switch (platform) {
        case 'darwin':
          command = `open "${url}"`;
          break;
        case 'win32':
          command = `start "" "${url}"`;
          break;
        default: // linux and others
          command = `xdg-open "${url}"`;
          break;
      }
      
      await execAsync(command);
      
      this.logger.info('✅ GitHub issue opened in browser successfully');
      return { success: true, platform, command };
      
    } catch (error) {
      this.logger.error(`GitHubIntegrationService: Failed to open browser: ${error.message}`);
      return { 
        success: false, 
        error: error.message,
        platform: os.platform()
      };
    }
  }
  
  /**
   * Validate GitHub URL
   */
  validateGitHubUrl(url) {
    if (!url || typeof url !== 'string') {
      return { isValid: false, reason: 'URL must be a non-empty string' };
    }
    
    if (!url.startsWith('https://github.com/')) {
      return { isValid: false, reason: 'URL must be a GitHub URL' };
    }
    
    if (url.length > this.MAX_URL_LENGTH) {
      return { 
        isValid: false, 
        reason: `URL too long (${url.length} > ${this.MAX_URL_LENGTH})` 
      };
    }
    
    try {
      new URL(url);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, reason: 'Invalid URL format' };
    }
  }
  
  /**
   * Get GitHub repository information
   */
  getRepositoryInfo() {
    return {
      owner: this.repositoryOwner,
      name: this.repositoryName,
      baseUrl: this.baseUrl,
      issuesUrl: `${this.baseUrl}/issues`,
      newIssueUrl: `${this.baseUrl}/issues/new`
    };
  }
  
  /**
   * Update repository configuration
   */
  updateRepositoryConfig(owner, name) {
    this.repositoryOwner = owner;
    this.repositoryName = name;
    this.baseUrl = `https://github.com/${owner}/${name}`;
    
    this.logger.info(`GitHubIntegrationService: Repository updated to ${owner}/${name}`);
  }
  
  /**
   * Progressive URL generation with multiple strategies
   */
  async _tryProgressiveUrlGeneration(title, issueBody, labels, context) {
    let attempt = 1;
    let truncatedBody = issueBody;
    
    // Strategy 1-3: Progressive truncation
    while (attempt <= 3) {
      const params = new URLSearchParams();
      params.append('title', title);
      params.append('body', truncatedBody);
      params.append('labels', labels.join(','));
      
      const url = `${this.baseUrl}/issues/new?${params.toString()}`;
      
      this.logger.info(`GitHubIntegrationService: Attempt ${attempt}, URL length: ${url.length}`);
      
      if (url.length <= this.MAX_URL_LENGTH) {
        return {
          success: true,
          url: url,
          method: `progressive-truncation-${attempt}`,
          urlLength: url.length,
          truncated: attempt > 1
        };
      }
      
      // Apply progressive truncation
      truncatedBody = this._applyTruncationStrategy(truncatedBody, attempt);
      attempt++;
    }
    
    // Strategy 4: Title and labels only
    return this._generateMinimalUrl(title, labels);
  }
  
  /**
   * Apply truncation strategy based on attempt number
   */
  _applyTruncationStrategy(body, attempt) {
    switch (attempt) {
      case 1:
        // Truncate to safe length
        return body.substring(0, this.MAX_BODY_LENGTH) + '\n\n...(content truncated)';
      case 2:
        // Minimal template
        return `# QA System Issue\n\n(See full details in local report)\n\n*Auto-generated*`;
      default:
        return 'QA System Issue - See local report for details';
    }
  }
  
  /**
   * Generate minimal URL with title and limited labels
   */
  _generateMinimalUrl(title, labels) {
    const params = new URLSearchParams();
    params.append('title', title);
    params.append('labels', labels.slice(0, 3).join(','));
    
    const url = `${this.baseUrl}/issues/new?${params.toString()}`;
    
    if (url.length <= this.MAX_URL_LENGTH) {
      return {
        success: true,
        url: url,
        method: 'minimal-title-labels',
        urlLength: url.length,
        truncated: true
      };
    }
    
    // Final fallback: just new issue URL
    return {
      success: false,
      method: 'length-exceeded',
      fallbackUrl: `${this.baseUrl}/issues/new`,
      attemptedLength: url.length
    };
  }
  
  /**
   * Generate default title if not provided
   */
  _generateDefaultTitle(context) {
    const tool = context.failedTool || 'QA System';
    const dimension = context.toolDimension || 'general';
    const mode = context.mode || 'automatic';
    
    if (context.errorMessage) {
      return `QA System Issue: ${tool} (${dimension}) - ${mode} mode`;
    }
    
    return `QA System Feedback: ${tool} - ${dimension}`;
  }
  
  /**
   * Generate default labels if not provided
   */
  _generateDefaultLabels(context) {
    const labels = ['qa-system', 'automated-report'];
    
    if (context.failedTool) {
      labels.push('bug');
      labels.push(`tool:${context.failedTool.toLowerCase()}`);
    }
    
    if (context.toolDimension) {
      labels.push(`dimension:${context.toolDimension.toLowerCase()}`);
    }
    
    if (context.mode) {
      labels.push(`mode:${context.mode.toLowerCase()}`);
    }
    
    return labels;
  }
  
  /**
   * Get service statistics
   */
  getStats() {
    return {
      repositoryOwner: this.repositoryOwner,
      repositoryName: this.repositoryName,
      baseUrl: this.baseUrl,
      maxUrlLength: this.MAX_URL_LENGTH,
      maxBodyLength: this.MAX_BODY_LENGTH,
      platform: os.platform()
    };
  }
}

module.exports = GitHubIntegrationService;