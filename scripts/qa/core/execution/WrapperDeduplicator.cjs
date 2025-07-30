/**
 * WrapperDeduplicator.cjs - Tool Deduplication and Coverage Logic
 * Conservative extraction from WrapperManager.cjs lines 240-339
 * No new functionality added - exact mapping only
 */

class WrapperDeduplicator {
  constructor(logger, toolTypeClassifier, wrapperMappings) {
    this.logger = logger;
    this.toolTypeClassifier = toolTypeClassifier;
    this.wrapperMappings = wrapperMappings;
    this.deduplicatedTools = null;
  }

  /**
   * Fix 4.1: Deduplicate tools to prevent double execution
   */
  _deduplicateTools(tools, getWrapperType) {
    const processedTools = [];
    const toolsHandledByWrappers = new Set();
    
    // Identify tools that will be handled by dimension wrappers
    for (const tool of tools) {
      const wrapperType = getWrapperType(tool);
      
      // Fix 4.3: Build wrapper in dimension mode handles multiple tools
      if (wrapperType === 'build' && tool.config && tool.config.dimensionMode) {
        // Build wrapper will handle all build tools, mark them as handled
        const buildTools = ['npm', 'yarn', 'pnpm', 'tsc', 'pip', 'vite']; // Extended to include all package managers
        buildTools.forEach(buildTool => toolsHandledByWrappers.add(buildTool));
        processedTools.push(tool);
      } else if (!toolsHandledByWrappers.has(tool.name)) {
        processedTools.push(tool);
      } else {
        this.logger.info(`Deduplicating tool ${tool.name} - already handled by dimension wrapper`);
      }
    }
    
    return processedTools;
  }

  /**
   * Fix 4.2: Check if tool should be skipped due to deduplication (systematic approach)
   */
  async _isToolSkipped(tool) {
    // MODULAR FIX: Dimension tools should never be skipped - they represent the entire dimension
    if (tool.config && tool.config.dimensionMode) {
      this.logger.info(`Dimension tool '${tool.name}' will execute (dimension tools never skipped)`);
      return false;
    }
    
    // Skip individual tools that are handled by dimension wrappers in dimension mode
    if (this.deduplicatedTools) {
      const dimensionToolsActive = this.deduplicatedTools.filter(t => 
        t.config && t.config.dimensionMode
      );
      
      if (dimensionToolsActive.length > 0) {
        // Check if this individual tool is covered by any active dimension tool
        for (const dimensionTool of dimensionToolsActive) {
          const isToolCovered = await this._isToolCoveredByDimension(tool.name, dimensionTool.name);
          if (isToolCovered) {
            this.logger.info(`Individual tool '${tool.name}' skipped - covered by dimension tool '${dimensionTool.name}'`);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * SYSTEMATIC FIX: Check if tool is covered by dimension (avoids hardcoding)
   */
  async _isToolCoveredByDimension(toolName, dimensionName) {
    try {
      // Systematic approach: Use inferred dimension from tool patterns
      const toolDimension = this._inferDimensionFromTool(toolName);
      if (toolDimension === dimensionName) {
        return true;
      }
      
      // Alternative approach: Use ToolTypeClassifier if available
      const toolType = await this.toolTypeClassifier.getToolType(toolName);
      const expectedDimension = this._getDimensionForToolType(toolType);
      return expectedDimension === dimensionName;
      
    } catch (error) {
      // Final fallback: Check if tool and dimension use same wrapper
      const toolWrapper = this.wrapperMappings.baseWrapperMappings?.[toolName];
      const dimensionWrapper = this.wrapperMappings[dimensionName];
      return toolWrapper === dimensionWrapper;
    }
  }

  /**
   * SYSTEMATIC FIX: Get dimension for tool type (derives from ToolTypeClassifier patterns)
   */
  _getDimensionForToolType(toolType) {
    const typeToDimensionMap = {
      'package-manager': 'build',
      'compiler': 'build', 
      'bundler': 'build',
      'dependency-manager': 'build',
      'test-runner': 'test',
      'linter': 'lint',
      'formatter': 'format',
      'security-scanner': 'security'
    };
    
    return typeToDimensionMap[toolType] || null;
  }

  /**
   * Infer dimension from tool name (pattern-based approach)
   */
  _inferDimensionFromTool(toolName) {
    const toolToDimensionPatterns = {
      'prettier': 'format',
      'black': 'format',
      'eslint': 'lint',
      'pylint': 'lint',
      'jest': 'test',
      'pytest': 'test',
      'snyk': 'security',
      'semgrep': 'security',
      'bandit': 'security',
      'npm': 'build',
      'yarn': 'build',
      'pnpm': 'build',
      'tsc': 'build',
      'vite': 'build',
      'pip': 'build'
    };
    
    return toolToDimensionPatterns[toolName] || null;
  }

  /**
   * Deduplicate tools (public interface)
   */
  deduplicateTools(tools, getWrapperType) {
    this.deduplicatedTools = this._deduplicateTools(tools, getWrapperType);
    return this.deduplicatedTools;
  }

  /**
   * Check if tool should be skipped (public interface)
   */
  async isToolSkipped(tool) {
    return await this._isToolSkipped(tool);
  }

  /**
   * Clear deduplication cache
   */
  clearCache() {
    this.deduplicatedTools = null;
  }
}

module.exports = WrapperDeduplicator;