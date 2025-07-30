/**
 * DependencyAnalyzer.cjs - Dependency Analysis
 * Conservative extraction from architectural-validator.cjs lines 385-466
 * No new functionality added - exact mapping only
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DependencyAnalyzer {
  constructor(qaPath, results) {
    this.qaPath = qaPath;
    this.results = results;
  }

  /**
   * Analizar dependencias
   */
  async analyzeDependencies() {
    console.log('\n🔗 Analizando Dependencias...');
    
    try {
      // Usar madge para análisis de dependencias
      const dependencyGraph = this.generateDependencyGraph();
      this.results.dependencies.graph = dependencyGraph;
      
      // Detectar dependencias circulares
      const circularDeps = this.detectCircularDependencies();
      this.results.dependencies.circular = circularDeps;
      
      // Contar componentes
      const componentCount = this.countComponents();
      this.results.dependencies.components = componentCount;
      
      this.printDependencyResults();
      
    } catch (error) {
      console.log('❌ Error analizando dependencias:', error.message);
      this.results.dependencies.error = error.message;
    }
  }

  /**
   * Generar grafo de dependencias
   */
  generateDependencyGraph() {
    try {
      const madgeCommand = `npx madge --circular --json ${this.qaPath}`;
      const output = execSync(madgeCommand, { encoding: 'utf8', cwd: this.qaPath });
      return JSON.parse(output);
    } catch (error) {
      console.log('⚠️  Madge no disponible, usando análisis manual');
      return this.manualDependencyAnalysis();
    }
  }

  /**
   * Análisis manual de dependencias
   */
  manualDependencyAnalysis() {
    const files = this.getJavaScriptFiles(this.qaPath);
    const dependencies = {};

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(this.qaPath, file);
      
      const requireMatches = content.match(/require\(['"]\.\.?\/[^'"]+['"]\)/g) || [];
      dependencies[relativePath] = requireMatches.map(match => {
        const pathMatch = match.match(/require\(['"]([^'"]+)['"]\)/);
        return pathMatch ? pathMatch[1] : '';
      }).filter(dep => dep);
    });

    return dependencies;
  }

  /**
   * Detectar dependencias circulares
   */
  detectCircularDependencies() {
    try {
      const madgeCommand = `npx madge --circular ${this.qaPath}`;
      const output = execSync(madgeCommand, { encoding: 'utf8', cwd: this.qaPath });
      
      if (output.trim() === '') {
        return [];
      }
      
      return output.split('\n').filter(line => line.trim()).map(line => line.trim());
    } catch (error) {
      console.log('⚠️  Usando detección manual de dependencias circulares');
      return this.manualCircularDetection();
    }
  }

  /**
   * Detección manual de dependencias circulares
   */
  manualCircularDetection() {
    const graph = this.results.dependencies.graph || {};
    const visited = new Set();
    const recStack = new Set();
    const cycles = [];

    function hasCycle(node, graph, visited, recStack, path) {
      if (recStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart));
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recStack.add(node);

      const dependencies = graph[node] || [];
      for (const dep of dependencies) {
        if (hasCycle(dep, graph, visited, recStack, [...path, dep])) {
          return true;
        }
      }

      recStack.delete(node);
      return false;
    }

    Object.keys(graph).forEach(node => {
      if (!visited.has(node)) {
        hasCycle(node, graph, visited, recStack, [node]);
      }
    });

    return cycles;
  }

  /**
   * Contar componentes
   */
  countComponents() {
    const files = this.getJavaScriptFiles(this.qaPath);
    
    return {
      totalFiles: files.length,
      coreFiles: files.filter(f => f.includes('/core/')).length,
      testFiles: files.filter(f => f.includes('/test')).length,
      utilFiles: files.filter(f => f.includes('/util')).length
    };
  }

  /**
   * Obtener archivos JavaScript
   */
  getJavaScriptFiles(dir) {
    const files = [];
    
    function walkDir(currentDir) {
      try {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            walkDir(fullPath);
          } else if (item.endsWith('.cjs') || item.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    }
    
    if (fs.existsSync(dir)) {
      walkDir(dir);
    }
    
    return files;
  }

  /**
   * Imprimir resultados de dependencias
   */
  printDependencyResults() {
    console.log('\n🔗 Resultados Dependencias:');
    
    const components = this.results.dependencies.components || {};
    const circular = this.results.dependencies.circular || [];
    
    console.log(`  Componentes: ${components.totalFiles || 0}`);
    console.log(`  Dependencias circulares: ${circular.length === 0 ? '✅' : '❌'} ${circular.length}`);
    
    if (circular.length > 0) {
      console.log('  Ciclos detectados:');
      circular.forEach((cycle, index) => {
        console.log(`    ${index + 1}. ${Array.isArray(cycle) ? cycle.join(' → ') : cycle}`);
      });
    }
  }
}

module.exports = DependencyAnalyzer;