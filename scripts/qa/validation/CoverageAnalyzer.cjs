/**
 * CoverageAnalyzer.cjs - Test Coverage Analysis  
 * Conservative extraction from architectural-validator.cjs lines 467-501
 * No new functionality added - exact mapping only
 */

const fs = require('fs');
const path = require('path');

class CoverageAnalyzer {
  constructor(qaPath, results) {
    this.qaPath = qaPath;
    this.results = results;
  }

  /**
   * Analizar cobertura real vs mocks
   */
  async analyzeCoverage() {
    console.log('\n🎯 Analizando Cobertura Real vs Mocks...');
    
    const testFiles = this.getTestFiles();
    
    let realTests = 0;
    let mockTests = 0;
    
    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Contar tests reales (que hacen llamadas reales)
      const realTestPatterns = [
        /test\(/g,
        /it\(/g,
        /describe\(/g
      ];
      
      // Contar tests con mocks
      const mockPatterns = [
        /jest\.mock\(/g,
        /sinon\./g,
        /stub\(/g,
        /spy\(/g,
        /mock\(/g
      ];
      
      realTestPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          realTests += matches.length;
        }
      });
      
      mockPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          mockTests += matches.length;
        }
      });
    });
    
    const totalTests = realTests + mockTests;
    const realRatio = totalTests > 0 ? (realTests / totalTests) * 100 : 0;
    
    this.results.coverage = {
      realTests,
      mockTests,
      totalTests,
      realRatio: parseFloat(realRatio.toFixed(1))
    };
    
    this.printCoverageResults();
  }

  /**
   * Obtener archivos de test
   */
  getTestFiles() {
    const files = [];
    
    function walkDir(currentDir) {
      try {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.')) {
            walkDir(fullPath);
          } else if (item.includes('.test.') || item.includes('.spec.')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    }
    
    if (fs.existsSync(this.qaPath)) {
      walkDir(this.qaPath);
    }
    
    return files;
  }

  /**
   * Imprimir resultados de cobertura
   */
  printCoverageResults() {
    console.log('\n🎯 Resultados Cobertura:');
    
    const coverage = this.results.coverage || {};
    
    console.log(`  Tests reales: ${coverage.realTests || 0}`);
    console.log(`  Tests con mocks: ${coverage.mockTests || 0}`);
    console.log(`  Ratio real: ${coverage.realRatio || 0}%`);
  }
}

module.exports = CoverageAnalyzer;