/**
 * QA Gate Orchestrator - Coordina la ejecución de todas las verificaciones
 */

const Logger = require('./logger');
const QAConfig = require('./qa-config');
const StepRunner = require('./step-runner');

class QAGateOrchestrator {
  constructor(options = {}) {
    this.options = options;
    this.logger = new Logger();
    this.config = new QAConfig();
    this.stepRunner = new StepRunner(options);
    this.startTime = null;
  }

  /**
   * Ejecuta todo el proceso de QA Gate
   * @returns {Promise<boolean>} - true si todos los pasos pasaron
   */
  async run() {
    this.startTime = Date.now();
    this.logger.title(`Running ${this.config.title}`);
    this._logExecutionInfo();

    const stepsToRun = this._filterSteps();
    let allPassed = true;

    for (let i = 0; i < stepsToRun.length; i++) {
      const success = await this.stepRunner.runStep(stepsToRun[i], i, stepsToRun.length);
      if (!success) {
        allPassed = false;
        break;
      }
    }

    this._logFinalResult(allPassed);
    return allPassed;
  }

  /**
   * Filtra los pasos según las opciones de CLI
   * @returns {Array} - Lista de pasos a ejecutar
   */
  _filterSteps() {
    return this.config.steps.filter(step => {
      if (this.options.skipFrontend && step.category === 'frontend') return false;
      if (this.options.skipBackend && step.category === 'backend') return false;
      return true;
    });
  }

  /**
   * Registra información sobre la ejecución
   */
  _logExecutionInfo() {
    console.log('===============================================');
    
    if (this.options.autoInstall) {
      this.logger.task('Modo de instalación automática activado');
    }
    if (this.options.skipFrontend) {
      this.logger.task('Verificaciones de frontend desactivadas');
    }
    if (this.options.skipBackend) {
      this.logger.task('Verificaciones de backend desactivadas');
    }
  }

  /**
   * Registra el resultado final
   * @param {boolean} allPassed - Si todos los pasos pasaron
   */
  _logFinalResult(allPassed) {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log('===============================================');
    
    if (allPassed) {
      console.log(`🎉 ALL QUALITY GATES PASSED! (${duration}s)`);
    } else {
      console.error(`❌ QUALITY GATE FAILED (${duration}s)`);
    }
  }
}

module.exports = QAGateOrchestrator;