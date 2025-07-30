/**
 * SOLID-Compliant Linter Wrapper Interfaces
 * ISP: Interface Segregation Principle - Small, focused interfaces
 * No dead code - Only essential methods
 */

// Base interface (ISP compliant - minimal interface)
class IBaseLinterWrapper {
  getName() { throw new Error('Must implement getName()'); }
  getVersion() { throw new Error('Must implement getVersion()'); }
  async isAvailable() { throw new Error('Must implement isAvailable()'); }
}

// Execution interface (separated by ISP)
class ILinterExecutor {
  async execute(files, options) { throw new Error('Must implement execute()'); }
  async validateConfig() { throw new Error('Must implement validateConfig()'); }
}

// Configuration interface (separated by ISP)
class ILinterConfig {
  getConfigPath() { throw new Error('Must implement getConfigPath()'); }
  async loadConfig() { throw new Error('Must implement loadConfig()'); }
}

// Result interface (separated by ISP)
class ILinterReporter {
  async formatResults(results) { throw new Error('Must implement formatResults()'); }
}

module.exports = {
  IBaseLinterWrapper,
  ILinterExecutor, 
  ILinterConfig,
  ILinterReporter
};