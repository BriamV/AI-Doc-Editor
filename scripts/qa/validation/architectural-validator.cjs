/**
 * ArchitecturalValidator.cjs - Simple Coordinator for Architectural Validation
 * Conservative refactoring: coordinates 5 specialized analyzers
 * Maintains exact same API as original 713-line version
 */

const fs = require('fs');
const path = require('path');
const SOLIDValidator = require('./SOLIDValidator.cjs');
const MetricsAnalyzer = require('./MetricsAnalyzer.cjs');
const DependencyAnalyzer = require('./DependencyAnalyzer.cjs');
const CoverageAnalyzer = require('./CoverageAnalyzer.cjs');
const ValidationReporter = require('./ValidationReporter.cjs');

class ArchitecturalValidator {
  constructor() {
    this.qaPath = path.join(__dirname, '../');
    
    // Initialize results structure (exact same as original)
    this.results = {
      solid: {
        srp: [],
        ocp: [],
        lsp: [],
        isp: [],
        dip: []
      },
      metrics: {
        loc: [],
        complexity: [],
        coupling: []
      },
      dependencies: {
        graph: {},
        circular: [],
        components: 0
      },
      coverage: {}
    };
    
    // Compose analyzers following Single Responsibility Principle
    this.solidValidator = new SOLIDValidator(this.qaPath, this.results);
    this.metricsAnalyzer = new MetricsAnalyzer(this.qaPath, this.results);
    this.dependencyAnalyzer = new DependencyAnalyzer(this.qaPath, this.results);
    this.coverageAnalyzer = new CoverageAnalyzer(this.qaPath, this.results);
    this.validationReporter = new ValidationReporter(this.qaPath, this.results);
  }

  /**
   * Ejecutar validación completa (exact same interface as original)
   */
  async validateComplete() {
    console.log('🔍 Iniciando Validación Arquitectónica del Sistema QA CLI');
    console.log('=' .repeat(60));
    
    try {
      // Validar principios SOLID (delegates to SOLID validator)
      await this.solidValidator.validateSOLIDPrinciples();
      
      // Analizar métricas de código (delegates to metrics analyzer)
      await this.metricsAnalyzer.analyzeCodeMetrics();
      
      // Crear dependency graph (delegates to dependency analyzer)
      await this.dependencyAnalyzer.analyzeDependencies();
      
      // Analizar cobertura real vs mocks (delegates to coverage analyzer)
      await this.coverageAnalyzer.analyzeCoverage();
      
      // Generar reporte (delegates to validation reporter)
      await this.validationReporter.generateReport();
      
      console.log('\n✅ Validación Arquitectónica Completada');
      console.log(`📊 Reporte generado: ${path.join(this.qaPath, 'validation/architectural-report.json')}`);
      
    } catch (error) {
      console.error('❌ Error durante validación arquitectónica:', error.message);
      process.exit(1);
    }
  }

  /**
   * Get results (for external access)
   */
  getResults() {
    return this.results;
  }

  /**
   * Generate only reports (delegates to reporter)
   */
  async generateReports() {
    return await this.validationReporter.saveReports();
  }
}

module.exports = ArchitecturalValidator;