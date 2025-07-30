/**
 * SOLIDValidator.cjs - SOLID Principles Validation
 * Conservative extraction from architectural-validator.cjs lines 81-283
 * No new functionality added - exact mapping only
 */

const fs = require('fs');
const path = require('path');

class SOLIDValidator {
  constructor(qaPath, results) {
    this.qaPath = qaPath;
    this.results = results;
  }

  /**
   * Validar principios SOLID
   */
  async validateSOLIDPrinciples() {
    console.log('\n🏗️  Validando Principios SOLID...');
    
    const coreFiles = this.getJavaScriptFiles(path.join(this.qaPath, 'core'));
    
    for (const file of coreFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const filename = path.basename(file);
      
      // Validar Single Responsibility Principle (SRP)
      const srpResult = this.validateSRP(content, filename);
      this.results.solid.srp.push(srpResult);
      
      // Validar Open/Closed Principle (OCP)
      const ocpResult = this.validateOCP(content, filename);
      this.results.solid.ocp.push(ocpResult);
      
      // Validar Liskov Substitution Principle (LSP)
      const lspResult = this.validateLSP(content, filename);
      this.results.solid.lsp.push(lspResult);
      
      // Validar Interface Segregation Principle (ISP)
      const ispResult = this.validateISP(content, filename);
      this.results.solid.isp.push(ispResult);
      
      // Validar Dependency Inversion Principle (DIP)
      const dipResult = this.validateDIP(content, filename);
      this.results.solid.dip.push(dipResult);
    }
    
    this.printSOLIDResults();
  }

  /**
   * Validar Single Responsibility Principle
   */
  validateSRP(content, filename) {
    const methods = this.extractMethods(content);
    const classes = this.extractClasses(content);
    
    const result = {
      file: filename,
      passed: true,
      issues: [],
      score: 100
    };
    
    // Verificar que cada clase tenga una responsabilidad clara
    classes.forEach(className => {
      if (methods.length > 15) {
        result.passed = false;
        result.issues.push(`Class ${className} has too many methods (${methods.length}), violates SRP`);
        result.score -= 20;
      }
    });
    
    // Verificar nombres de métodos para detectar múltiples responsabilidades
    const responsabilityKeywords = ['create', 'update', 'delete', 'validate', 'execute', 'format', 'parse'];
    const foundKeywords = new Set();
    
    methods.forEach(method => {
      responsabilityKeywords.forEach(keyword => {
        if (method.toLowerCase().includes(keyword)) {
          foundKeywords.add(keyword);
        }
      });
    });
    
    if (foundKeywords.size > 3) {
      result.passed = false;
      result.issues.push(`Class has mixed responsibilities: ${Array.from(foundKeywords).join(', ')}`);
      result.score -= 30;
    }
    
    return result;
  }

  /**
   * Validar Open/Closed Principle
   */
  validateOCP(content, filename) {
    const result = {
      file: filename,
      passed: true,
      issues: [],
      score: 100
    };
    
    // Verificar uso de Strategy Pattern
    const hasStrategyPattern = content.includes('Strategy') || content.includes('Handler');
    
    // Verificar extensibilidad sin modificación
    const hasExtensibilityPatterns = content.includes('require(') && 
                                    (content.includes('Factory') || content.includes('Registry'));
    
    // Verificar modificación directa de clases (anti-pattern)
    const hasDirectModification = content.includes('// TODO: extend') || 
                                 content.includes('// HACK:') ||
                                 content.includes('if (type === ');
    
    if (hasDirectModification) {
      result.passed = false;
      result.issues.push('Code contains direct modification patterns, violates OCP');
      result.score -= 25;
    }
    
    return result;
  }

  /**
   * Validar Liskov Substitution Principle
   */
  validateLSP(content, filename) {
    const result = {
      file: filename,
      passed: true,
      issues: [],
      score: 100
    };
    
    // Verificar herencia apropiada
    const hasInheritance = content.includes('extends') || content.includes('prototype');
    
    if (hasInheritance) {
      // Verificar que no se modifiquen precondiciones/postcondiciones
      const hasConditionModification = content.includes('override') && 
                                      (content.includes('throw new Error') || content.includes('not implemented'));
      
      if (hasConditionModification) {
        result.passed = false;
        result.issues.push('Inheritance modifies preconditions/postconditions, violates LSP');
        result.score -= 30;
      }
    }
    
    return result;
  }

  /**
   * Validar Interface Segregation Principle
   */
  validateISP(content, filename) {
    const result = {
      file: filename,
      passed: true,
      issues: [],
      score: 100
    };
    
    const methods = this.extractMethods(content);
    
    // Verificar que las interfaces no sean demasiado grandes
    if (methods.length > 10) {
      result.passed = false;
      result.issues.push(`Interface/Class has too many methods (${methods.length}), violates ISP`);
      result.score -= 25;
    }
    
    return result;
  }

  /**
   * Validar Dependency Inversion Principle
   */
  validateDIP(content, filename) {
    const result = {
      file: filename,
      passed: true,
      issues: [],
      score: 100
    };
    
    // Verificar dependencias directas (new Class())
    const directDependencies = (content.match(/new\s+[A-Z]\w+\(/g) || []).length;
    
    if (directDependencies > 3) {
      result.passed = false;
      result.issues.push(`Too many direct dependencies (${directDependencies}), violates DIP`);
      result.score -= 20;
    }
    
    return result;
  }

  /**
   * Extraer métodos del código
   */
  extractMethods(content) {
    const methodRegex = /(?:async\s+)?(?:function\s+)?(\w+)\s*\(/g;
    const methods = [];
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1]);
    }
    
    return methods.filter(method => method !== 'require' && method.length > 2);
  }

  /**
   * Extraer clases del código
   */
  extractClasses(content) {
    const classRegex = /class\s+(\w+)/g;
    const classes = [];
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    
    return classes;
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
   * Imprimir resultados SOLID
   */
  printSOLIDResults() {
    console.log('\n📋 Resultados SOLID:');
    
    const srpPassed = this.results.solid.srp.filter(r => r.passed).length;
    const ocpPassed = this.results.solid.ocp.filter(r => r.passed).length;
    const lspPassed = this.results.solid.lsp.filter(r => r.passed).length;
    const ispPassed = this.results.solid.isp.filter(r => r.passed).length;
    const dipPassed = this.results.solid.dip.filter(r => r.passed).length;
    
    const total = this.results.solid.srp.length;
    
    console.log(`  SRP: ${srpPassed === total ? '✅' : '❌'} ${srpPassed}/${total} archivos`);
    console.log(`  OCP: ${ocpPassed === total ? '✅' : '❌'} ${ocpPassed}/${total} archivos`);
    console.log(`  LSP: ${lspPassed === total ? '✅' : '❌'} ${lspPassed}/${total} archivos`);
    console.log(`  ISP: ${ispPassed === total ? '✅' : '❌'} ${ispPassed}/${total} archivos`);
    console.log(`  DIP: ${dipPassed === total ? '✅' : '❌'} ${dipPassed}/${total} archivos`);
  }
}

module.exports = SOLIDValidator;