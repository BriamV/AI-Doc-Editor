/**
 * Orquestador de pasos QA Gate
 * Responsabilidad única: Coordinar pasos de verificación usando módulos especializados
 * 
 * Principios SOLID aplicados:
 * - SRP: Solo coordina, no implementa verificaciones específicas
 * - OCP: Extensible sin modificar código existente
 * - DIP: Depende de abstracciones, no implementaciones concretas
 * 
 * Métricas objetivo:
 * - LOC: <212 (🟢)
 * - Complejidad ciclomática: ≤10
 * - Líneas: ≤100 caracteres
 */

const { execSync } = require('child_process');
const QAFrontendSteps = require('./qa-frontend-steps.cjs');
const QABackendSteps = require('./qa-backend-steps.cjs');
const QASecuritySteps = require('./qa-security-steps.cjs');

class QASteps {
  constructor(rootDir, options = {}) {
    this.rootDir = rootDir;
    this.options = options;
    
    // Inicializar módulos especializados (Dependency Injection)
    this.frontendSteps = new QAFrontendSteps(rootDir, options);
    this.backendSteps = new QABackendSteps(rootDir, options);
    this.securitySteps = new QASecuritySteps(rootDir, options);
  }

  /**
   * Obtiene todos los pasos de verificación configurados
   * Combina pasos de todos los módulos especializados
   * 
   * @returns {Array} - Lista completa de pasos del QA Gate
   */
  getSteps() {
    const allSteps = [
      ...this.frontendSteps.getSteps(),
      ...this.backendSteps.getSteps(),
      ...this.securitySteps.getSteps(),
      // Design Guidelines usando comando CLI existente
      {
        name: 'Design Guidelines: DESIGN_GUIDELINES.md validation',
        category: 'design-guidelines',
        execute: () => this._validateDesignGuidelines(),
        errorMessage: 'Design Guidelines validation failed'
      }
    ];

    return this._validateSteps(allSteps);
  }

  /**
   * Obtiene pasos filtrados por categoría
   * Permite ejecutar solo un tipo específico de verificaciones
   * 
   * @param {string} category - Categoría de pasos ('frontend', 'backend', etc.)
   * @returns {Array} - Lista de pasos filtrados
   */
  getStepsByCategory(category) {
    const allSteps = this.getSteps();
    return allSteps.filter(step => step.category === category);
  }

  /**
   * Obtiene información sobre los pasos disponibles
   * Útil para diagnósticos y reportes
   * 
   * @returns {Object} - Estadísticas de pasos por categoría
   */
  getStepsInfo() {
    const allSteps = this.getSteps();
    const categories = {};

    allSteps.forEach(step => {
      const category = step.category || 'unknown';
      categories[category] = (categories[category] || 0) + 1;
    });

    return {
      total: allSteps.length,
      categories,
      byCategory: {
        frontend: this.frontendSteps.getSteps().length,
        backend: this.backendSteps.getSteps().length,
        security: this.securitySteps.getSteps().length,
        'design-guidelines': 1 // Un paso que ejecuta validate-design-guidelines
      }
    };
  }

  /**
   * Valida DESIGN_GUIDELINES.md usando herramientas existentes directamente
   * Reutiliza ESLint, Prettier, TypeScript configurados
   */
  _validateDesignGuidelines() {
    // Importar y usar función directamente sin pasar por CLI
    const { validateDesignGuidelines } = require('../commands/qa.cjs');
    validateDesignGuidelines();
  }

  // === Métodos Privados de Validación === //

  /**
   * Valida que todos los pasos tengan la estructura correcta
   * Aplica principio de validación temprana
   * 
   * @param {Array} steps - Lista de pasos a validar
   * @returns {Array} - Lista de pasos validados
   * @throws {Error} - Si algún paso no cumple con la estructura requerida
   */
  _validateSteps(steps) {
    const requiredProperties = ['name', 'category', 'execute', 'errorMessage'];

    steps.forEach((step, index) => {
      this._validateStep(step, index, requiredProperties);
    });

    return steps;
  }

  /**
   * Valida un paso individual
   * @param {Object} step - Paso a validar
   * @param {number} index - Índice del paso para reporte de errores
   * @param {Array} requiredProperties - Propiedades requeridas
   * @throws {Error} - Si el paso no es válido
   */
  _validateStep(step, index, requiredProperties) {
    if (!step || typeof step !== 'object') {
      throw new Error(`Paso ${index} no es un objeto válido`);
    }

    const missingProps = requiredProperties.filter(
      prop => !(prop in step)
    );

    if (missingProps.length > 0) {
      throw new Error(
        `Paso ${index} ('${step.name || 'sin nombre'}') ` +
        `falta propiedades: ${missingProps.join(', ')}`
      );
    }

    if (typeof step.execute !== 'function') {
      throw new Error(
        `Paso ${index} ('${step.name}') - execute debe ser una función`
      );
    }
  }
}

module.exports = QASteps;