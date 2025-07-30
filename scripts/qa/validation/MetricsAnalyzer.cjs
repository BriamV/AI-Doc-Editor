/**
 * MetricsAnalyzer.cjs - Code Metrics Analysis
 * Conservative extraction from architectural-validator.cjs lines 284-380
 * No new functionality added - exact mapping only
 */

const fs = require('fs');
const path = require('path');

class MetricsAnalyzer {
  constructor(qaPath, results) {
    this.qaPath = qaPath;
    this.results = results;
  }

  /**
   * Analizar métricas de código
   */
  async analyzeCodeMetrics() {
    console.log('\n📊 Analizando Métricas de Código...');
    
    const allFiles = this.getJavaScriptFiles(this.qaPath);
    
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const filename = path.relative(this.qaPath, file);
      
      // Analizar Lines of Code (LOC)
      const locResult = this.analyzeLOC(content, filename);
      this.results.metrics.loc.push(locResult);
      
      // Analizar complejidad ciclomática
      const complexityResult = this.analyzeComplexity(content, filename);
      this.results.metrics.complexity.push(complexityResult);
      
      // Analizar acoplamiento
      const couplingResult = this.analyzeCoupling(content, filename);
      this.results.metrics.coupling.push(couplingResult);
    }
    
    this.printMetricsResults();
  }

  /**
   * Analizar Lines of Code
   */
  analyzeLOC(content, filename) {
    const lines = content.split('\n');
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
    });
    
    const result = {
      file: filename,
      total: lines.length,
      code: codeLines.length,
      limit: 212,
      passed: codeLines.length <= 212,
      score: codeLines.length <= 212 ? 100 : Math.max(0, 100 - (codeLines.length - 212) * 2)
    };
    
    return result;
  }

  /**
   * Analizar complejidad ciclomática
   */
  analyzeComplexity(content, filename) {
    // Contar estructuras de control
    const controlStructures = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', 'finally',
      '&&', '||', '?', 'try'
    ];
    
    let complexity = 1; // Base complexity
    
    controlStructures.forEach(structure => {
      const escapedStructure = structure.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = content.match(new RegExp(`\\b${escapedStructure}\\b`, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    });
    
    const result = {
      file: filename,
      complexity: complexity,
      limit: 10,
      passed: complexity <= 10,
      score: complexity <= 10 ? 100 : Math.max(0, 100 - (complexity - 10) * 10)
    };
    
    return result;
  }

  /**
   * Analizar acoplamiento
   */
  analyzeCoupling(content, filename) {
    const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
    const importMatches = content.match(/import.*from ['"]([^'"]+)['"]/g) || [];
    
    const totalDependencies = requireMatches.length + importMatches.length;
    
    const result = {
      file: filename,
      dependencies: totalDependencies,
      limit: 5,
      passed: totalDependencies <= 5,
      score: totalDependencies <= 5 ? 100 : Math.max(0, 100 - (totalDependencies - 5) * 15)
    };
    
    return result;
  }

  /**
   * Obtener archivos JavaScript
   */
  getJavaScriptFiles(dir) {
    const files = [];
    
    function walkDir(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith('.cjs') || item.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    }
    
    if (fs.existsSync(dir)) {
      walkDir(dir);
    }
    
    return files;
  }

  /**
   * Imprimir resultados de métricas
   */
  printMetricsResults() {
    console.log('\n📊 Resultados Métricas:');
    
    const locViolations = this.results.metrics.loc.filter(r => !r.passed).length;
    const complexityViolations = this.results.metrics.complexity.filter(r => !r.passed).length;
    const couplingViolations = this.results.metrics.coupling.filter(r => !r.passed).length;
    
    console.log(`  LOC: ${locViolations === 0 ? '✅' : '❌'} ${locViolations} violaciones`);
    console.log(`  Complejidad: ${complexityViolations === 0 ? '✅' : '❌'} ${complexityViolations} violaciones`);
    console.log(`  Acoplamiento: ${couplingViolations === 0 ? '✅' : '❌'} ${couplingViolations} violaciones`);
  }
}

module.exports = MetricsAnalyzer;