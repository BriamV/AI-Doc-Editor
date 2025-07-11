/**
 * Hardcoding Scanner Utility
 * Scans QA system for hardcoded values that should be dynamic
 */

const fs = require('fs');
const path = require('path');

class HardcodingScanner {
  constructor() {
    this.qaRootDir = path.resolve(__dirname, '../..');
    this.issues = [];
  }

  getAllJSFiles() {
    const jsFiles = [];
    
    function findJsFiles(dir) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir);
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && entry !== 'node_modules' && entry !== '.git') {
          findJsFiles(fullPath);
        } else if (entry.endsWith('.cjs') || entry.endsWith('.js')) {
          jsFiles.push(fullPath);
        }
      });
    }
    
    findJsFiles(this.qaRootDir);
    return jsFiles;
  }

  scan() {
    console.log('🔍 Scanning QA system for hardcoded values...\n');
    
    this.scanPackageManagerHardcoding();
    this.scanToolCommandHardcoding();
    this.scanHelpTextHardcoding();
    this.scanConfigurationHardcoding();
    
    this.printSummary();
    return this.issues;
  }

  scanPackageManagerHardcoding() {
    console.log('📦 Package Manager Hardcoding Analysis:');
    console.log('=====================================');
    
    // BuildConfig.cjs fallbacks
    const buildConfigPath = path.join(this.qaRootDir, 'core/wrappers/build/BuildConfig.cjs');
    if (fs.existsSync(buildConfigPath)) {
      const content = fs.readFileSync(buildConfigPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('npm install') && line.includes('fallback')) {
          this.addIssue('CRITICAL', 'BuildConfig.cjs', index + 1, 'Hardcoded npm in fallback', line.trim());
        }
      });
    }

    // EnvironmentChecker.cjs
    const envCheckerPath = path.join(this.qaRootDir, 'core/EnvironmentChecker.cjs');
    if (fs.existsSync(envCheckerPath)) {
      const content = fs.readFileSync(envCheckerPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if ((line.includes('npm install') || line.includes('pip install')) && line.includes('installUrl')) {
          this.addIssue('MEDIUM', 'EnvironmentChecker.cjs', index + 1, 'Hardcoded install command in tool descriptions', line.trim());
        }
      });
    }

    // PackageManagerService.cjs
    const serviceePath = path.join(this.qaRootDir, 'core/services/PackageManagerService.cjs');
    if (fs.existsSync(serviceePath)) {
      const content = fs.readFileSync(serviceePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('npm install') && line.includes('--save-dev')) {
          this.addIssue('LOW', 'PackageManagerService.cjs', index + 1, 'Dev dependency install should use detected manager', line.trim());
        }
      });
    }
  }

  scanToolCommandHardcoding() {
    console.log('\n🔧 Tool Command Hardcoding Analysis:');
    console.log('===================================');
    
    // BuildConfig.cjs tool commands
    const buildConfigPath = path.join(this.qaRootDir, 'core/wrappers/build/BuildConfig.cjs');
    if (fs.existsSync(buildConfigPath)) {
      const content = fs.readFileSync(buildConfigPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Check for pip vs pip3 hardcoding (legitimate concern)
        if (line.includes('pip install -r') && !line.includes('python') && !line.includes('detected')) {
          this.addIssue('LOW', 'BuildConfig.cjs', index + 1, 'Consider pip vs pip3 detection', line.trim());
        }
        
        // NOTE: npx tsc and npx vite are legitimate - npx is package manager agnostic
        // The real issue was npm install vs yarn install, which is already fixed
      });
    }

    // Check for actual problematic patterns
    const allFiles = this.getAllJSFiles();
    allFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Look for package manager specific commands that should be dynamic
        // Exclude tests, comments, and legitimate implementations
        if ((line.includes('npm ci') || line.includes('npm install')) && 
            !line.includes('PackageManagerService') && 
            !line.includes('fallback') &&
            !line.includes('expect(') &&           // Exclude test assertions
            !line.includes('//') &&                // Exclude comments
            !line.includes('test(') &&             // Exclude test files
            !line.includes('describe(') &&         // Exclude test files
            !line.includes("'npm install'") &&     // Exclude string literals in implementations
            !line.includes('"npm install"') &&     // Exclude string literals in implementations
            !filePath.includes('test')) {          // Exclude test files completely
          this.addIssue('HIGH', path.relative(this.qaRootDir, filePath), index + 1, 'Package manager command should be dynamic', line.trim());
        }
      });
    });
  }

  scanHelpTextHardcoding() {
    console.log('\n📚 Help Text Hardcoding Analysis:');
    console.log('================================');
    
    const cliPath = path.join(this.qaRootDir, 'qa-cli.cjs');
    if (fs.existsSync(cliPath)) {
      const content = fs.readFileSync(cliPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('yarn qa') && !line.startsWith('//')) {
          this.addIssue('HIGH', 'qa-cli.cjs', index + 1, 'Hardcoded yarn qa in help text', line.trim());
        }
      });
    }
  }

  scanConfigurationHardcoding() {
    console.log('\n⚙️  Configuration Hardcoding Analysis:');
    console.log('====================================');
    
    const configPath = path.join(this.qaRootDir, 'qa-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Check scope mappings
      if (config.scopeMapping) {
        Object.keys(config.scopeMapping).forEach(scope => {
          const tools = config.scopeMapping[scope];
          if (tools.includes('npm')) {
            this.addIssue('HIGH', 'qa-config.json', 0, `Scope '${scope}' has hardcoded 'npm' tool`, `scopeMapping.${scope}: ${JSON.stringify(tools)}`);
          }
        });
      }

      // Check tool commands
      if (config.tools) {
        Object.keys(config.tools).forEach(toolName => {
          const tool = config.tools[toolName];
          if (tool.commandTemplates) {
            Object.keys(tool.commandTemplates).forEach(action => {
              const command = tool.commandTemplates[action];
              if (Array.isArray(command) && command[0] === 'python') {
                this.addIssue('MEDIUM', 'qa-config.json', 0, `Tool '${toolName}' hardcodes python command`, `${toolName}.${action}: ${JSON.stringify(command)}`);
              }
            });
          }
        });
      }
    }
  }

  addIssue(severity, file, line, description, code) {
    this.issues.push({ severity, file, line, description, code });
    
    const severityColors = {
      'CRITICAL': '🔴',
      'HIGH': '🟠', 
      'MEDIUM': '🟡',
      'LOW': '🔵'
    };
    
    console.log(`${severityColors[severity]} ${severity}: ${file}:${line}`);
    console.log(`   ${description}`);
    console.log(`   Code: ${code}`);
    console.log();
  }

  printSummary() {
    console.log('\n📊 Hardcoding Analysis Summary:');
    console.log('==============================');
    
    const severityCounts = this.issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`🔴 Critical: ${severityCounts.CRITICAL || 0}`);
    console.log(`🟠 High: ${severityCounts.HIGH || 0}`);
    console.log(`🟡 Medium: ${severityCounts.MEDIUM || 0}`);
    console.log(`🔵 Low: ${severityCounts.LOW || 0}`);
    console.log(`📝 Total Issues: ${this.issues.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n🔧 Recommendations:');
      console.log('==================');
      console.log('1. Replace hardcoded package managers with PackageManagerService');
      console.log('2. Make tool commands configurable or auto-detected');
      console.log('3. Use detected package manager in help text');
      console.log('4. Convert config hardcoding to dynamic detection');
    } else {
      console.log('\n✅ No hardcoding issues found!');
    }
  }
}

// Run the scanner if called directly
if (require.main === module) {
  const scanner = new HardcodingScanner();
  const issues = scanner.scan();
  
  // Exit with error code if critical issues found
  const criticalIssues = issues.filter(issue => issue.severity === 'CRITICAL');
  process.exit(criticalIssues.length > 0 ? 1 : 0);
}

module.exports = HardcodingScanner;