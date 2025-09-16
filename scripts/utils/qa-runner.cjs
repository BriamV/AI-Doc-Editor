/**
 * Ejecutor de pasos QA Gate
 * Maneja la ejecución secuencial y el reporte de resultados
 */

const logger = require('./logger.cjs');

class QARunner {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Ejecuta un paso individual del QA Gate
   * @param {Object} step - Configuración del paso
   * @param {number} index - Índice del paso
   * @param {number} total - Total de pasos
   * @returns {boolean} - true si el paso fue exitoso
   */
  async runStep(step, index, total) {
    console.log(`\n${index + 1}/${total} ${step.name}...`);
    
    try {
      await step.execute();
      logger.success(`${step.name} passed`);
      return true;
    } catch (error) {
      logger.error(`${step.errorMessage}`);
      if (this.options.verbose) {
        console.error('Detalles del error:', error.message);
      }
      return false;
    }
  }

  /**
   * Ejecuta una lista de pasos de forma secuencial
   * @param {Array} steps - Lista de pasos a ejecutar
   * @returns {boolean} - true si todos los pasos pasaron
   */
  async runSteps(steps) {
    let allPassed = true;
    
    for (let i = 0; i < steps.length; i++) {
      const success = await this.runStep(steps[i], i, steps.length);
      if (!success) {
        allPassed = false;
        break; // Detener en el primer error
      }
    }
    
    return allPassed;
  }

  /**
   * Ejecuta pasos en paralelo (para casos específicos)
   * @param {Array} steps - Lista de pasos a ejecutar
   * @returns {boolean} - true si todos los pasos pasaron
   */
  async runStepsParallel(steps) {
    logger.info('Ejecutando pasos en paralelo...');
    
    const promises = steps.map(async (step, index) => {
      try {
        await step.execute();
        logger.success(`${step.name} passed`);
        return { success: true, step: step.name };
      } catch (error) {
        logger.error(`${step.errorMessage}`);
        return { success: false, step: step.name, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const failures = results.filter(r => !r.success);
    
    if (failures.length > 0) {
      logger.error(`${failures.length} pasos fallaron:`);
      failures.forEach(f => logger.error(`- ${f.step}: ${f.error}`));
      return false;
    }
    
    return true;
  }
}

module.exports = QARunner;