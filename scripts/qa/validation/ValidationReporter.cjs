/**
 * ValidationReporter.cjs - Validation Report Generation
 * Conservative extraction from architectural-validator.cjs lines 502-713
 * No new functionality added - exact mapping only
 */

const fs = require('fs');
const path = require('path');

class ValidationReporter {
  constructor(qaPath, results) {
    this.qaPath = qaPath;
    this.results = results;
  }

  /**
   * Generar reporte de validación
   */
  async generateReport() {
    console.log('\n📄 Generando Reporte...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      solid: this.results.solid,
      metrics: this.results.metrics,
      dependencies: this.results.dependencies,
      coverage: this.results.coverage
    };
    
    const reportPath = path.join(this.qaPath, 'validation/architectural-report.json');
    
    // Ensure validation directory exists
    const validationDir = path.dirname(reportPath);
    if (!fs.existsSync(validationDir)) {
      fs.mkdirSync(validationDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Reporte guardado: ${reportPath}`);
    
    return report;
  }

  /**
   * Generar resumen del reporte
   */
  generateSummary() {
    const summary = {
      overall: 'PASS',
      issues: [],
      scores: {}
    };
    
    // Verificar SOLID
    const solidResults = this.results.solid || {};
    Object.keys(solidResults).forEach(principle => {
      const results = solidResults[principle] || [];
      const failed = results.filter(r => !r.passed).length;
      const total = results.length;
      
      summary.scores[`solid_${principle}`] = total > 0 ? ((total - failed) / total * 100).toFixed(1) : 100;
      
      if (failed > 0) {
        summary.issues.push(`SOLID ${principle.toUpperCase()}: ${failed}/${total} archivos fallan`);
      }
    });
    
    // Verificar métricas
    const metricsResults = this.results.metrics || {};
    Object.keys(metricsResults).forEach(metric => {
      const results = metricsResults[metric] || [];
      const failed = results.filter(r => !r.passed).length;
      const total = results.length;
      
      summary.scores[`metrics_${metric}`] = total > 0 ? ((total - failed) / total * 100).toFixed(1) : 100;
      
      if (failed > 0) {
        summary.issues.push(`Métricas ${metric}: ${failed}/${total} archivos fallan`);
        if (failed > total * 0.3) { // Más del 30% falla
          summary.overall = 'FAIL';
        }
      }
    });
    
    // Verificar dependencias circulares
    const dependencies = this.results.dependencies || {};
    const circularDeps = dependencies.circular || [];
    
    if (circularDeps.length > 0) {
      summary.issues.push(`Dependencias circulares: ${circularDeps.length} detectadas`);
      summary.overall = 'FAIL';
    }
    
    // Verificar cobertura
    const coverage = this.results.coverage || {};
    const realRatio = coverage.realRatio || 0;
    
    summary.scores.coverage_real_ratio = realRatio;
    
    if (realRatio < 80) {
      summary.issues.push(`Cobertura real baja: ${realRatio}% (mínimo 80%)`);
    }
    
    return summary;
  }

  /**
   * Generar reporte detallado en texto
   */
  generateTextReport() {
    const lines = [];
    
    lines.push('='.repeat(80));
    lines.push('REPORTE DE VALIDACIÓN ARQUITECTÓNICA');
    lines.push('='.repeat(80));
    lines.push(`Generado: ${new Date().toISOString()}`);
    lines.push('');
    
    // Resumen
    const summary = this.generateSummary();
    lines.push(`Estado General: ${summary.overall}`);
    lines.push('');
    
    if (summary.issues.length > 0) {
      lines.push('PROBLEMAS DETECTADOS:');
      summary.issues.forEach((issue, index) => {
        lines.push(`${index + 1}. ${issue}`);
      });
      lines.push('');
    }
    
    // Puntuaciones
    lines.push('PUNTUACIONES:');
    Object.entries(summary.scores).forEach(([metric, score]) => {
      lines.push(`  ${metric}: ${score}%`);
    });
    lines.push('');
    
    // SOLID Details
    lines.push('PRINCIPIOS SOLID:');
    const solid = this.results.solid || {};
    Object.entries(solid).forEach(([principle, results]) => {
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      lines.push(`  ${principle.toUpperCase()}: ${passed}/${total} archivos pasan`);
      
      const failed = results.filter(r => !r.passed);
      if (failed.length > 0) {
        failed.forEach(result => {
          lines.push(`    ❌ ${result.file}: ${result.issues.join(', ')}`);
        });
      }
    });
    lines.push('');
    
    // Métricas Details
    lines.push('MÉTRICAS DE CÓDIGO:');
    const metrics = this.results.metrics || {};
    Object.entries(metrics).forEach(([metric, results]) => {
      const violations = results.filter(r => !r.passed);
      lines.push(`  ${metric.toUpperCase()}: ${violations.length} violaciones`);
      
      if (violations.length > 0) {
        violations.slice(0, 10).forEach(result => { // Top 10
          lines.push(`    ❌ ${result.file}: ${result.value || result.complexity || result.dependencies}`);
        });
        if (violations.length > 10) {
          lines.push(`    ... y ${violations.length - 10} más`);
        }
      }
    });
    lines.push('');
    
    return lines.join('\n');
  }

  /**
   * Guardar reporte en múltiples formatos
   */
  async saveReports() {
    const reportDir = path.join(this.qaPath, 'validation');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // JSON Report
    const jsonReport = await this.generateReport();
    
    // Text Report
    const textReport = this.generateTextReport();
    const textReportPath = path.join(reportDir, 'architectural-report.txt');
    fs.writeFileSync(textReportPath, textReport);
    
    console.log(`📄 Reporte texto: ${textReportPath}`);
    
    return {
      json: path.join(reportDir, 'architectural-report.json'),
      text: textReportPath,
      data: jsonReport
    };
  }
}

module.exports = ValidationReporter;