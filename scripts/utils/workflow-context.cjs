/**
 * Utilidad para detectar contexto de flujo de trabajo según WORK-PLAN v5.md
 * Identifica automáticamente: Task, WorkPackage, Release, Branch context
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./logger.cjs');

class WorkflowContext {
  constructor() {
    this.currentBranch = this._getCurrentBranch();
    this.context = this._analyzeWorkflowContext();
  }

  /**
   * Detecta el contexto actual del flujo de trabajo
   * @returns {Object} Contexto completo del workflow
   */
  _analyzeWorkflowContext() {
    const context = {
      type: 'unknown',
      branch: this.currentBranch,
      task: null,
      workPackage: null,
      release: null,
      integration: null,
      validationScope: 'all',
      validationLevel: 'dev'
    };

    // 1. Detectar tipo de branch
    if (this.currentBranch === 'main') {
      context.type = 'production';
      context.integration = 'main';
      context.validationLevel = 'ci';
      context.validationScope = 'all';
    } else if (this.currentBranch === 'develop') {
      context.type = 'integration';
      context.integration = 'develop';
      context.validationLevel = 'pre-commit';
      context.validationScope = 'all';
    } else if (this.currentBranch.startsWith('release/')) {
      context.type = 'release';
      context.release = this._extractReleaseFromBranch(this.currentBranch);
      context.integration = 'release';
      context.validationLevel = 'pre-commit';
      context.validationScope = 'all';
    } else if (this.currentBranch.startsWith('feature/T-')) {
      context.type = 'feature';
      context.task = this._extractTaskFromBranch(this.currentBranch);
      context.workPackage = this._getWorkPackageForTask(context.task);
      context.release = this._getReleaseForTask(context.task);
      context.integration = 'feature';
      context.validationLevel = 'dev';
      context.validationScope = this._getScopeForTask(context.task);
    } else if (this.currentBranch.startsWith('hotfix/')) {
      context.type = 'hotfix';
      context.integration = 'hotfix';
      context.validationLevel = 'ci';
      context.validationScope = 'all';
    } else {
      context.type = 'development';
      context.validationLevel = 'dev';
      context.validationScope = 'all';
    }

    return context;
  }

  /**
   * Obtiene la branch actual
   */
  _getCurrentBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Extrae el número de tarea del nombre de branch
   */
  _extractTaskFromBranch(branchName) {
    const match = branchName.match(/feature\/T-(\d+)/);
    return match ? `T-${match[1]}` : null;
  }

  /**
   * Extrae el número de release del nombre de branch
   */
  _extractReleaseFromBranch(branchName) {
    const match = branchName.match(/release\/R(\d+)/);
    return match ? `R${match[1]}` : null;
  }

  /**
   * Mapeo de tareas a Work Packages según WORK-PLAN v5.md
   */
  _getWorkPackageForTask(taskId) {
    const taskToWP = {
      // R0.WP1
      'T-01': 'R0.WP1', 'T-17': 'R0.WP1', 'T-23': 'R0.WP1', 'T-43': 'R0.WP1',
      // R0.WP2
      'T-02': 'R0.WP2', 'T-41': 'R0.WP2', 'T-44': 'R0.WP2',
      // R0.WP3
      'T-13': 'R0.WP3', 'T-12': 'R0.WP3',
      // R1.WP1
      'T-04': 'R1.WP1', 'T-03': 'R1.WP1', 'T-24': 'R1.WP1',
      // R1.WP2
      'T-05': 'R1.WP2', 'T-06': 'R1.WP2',
      // R2.WP1
      'T-07': 'R2.WP1', 'T-08': 'R2.WP1', 'T-31': 'R2.WP1',
      // R2.WP2
      'T-11': 'R2.WP2', 'T-33': 'R2.WP2',
      // R2.WP3
      'T-45': 'R2.WP3', 'T-46': 'R2.WP3',
      // R3.WP1
      'T-21': 'R3.WP1', 'T-19': 'R3.WP1', 'T-39': 'R3.WP1',
      // R3.WP2
      'T-32': 'R3.WP2', 'T-18': 'R3.WP2', 'T-28': 'R3.WP2',
      // R4.WP1
      'T-09': 'R4.WP1', 'T-10': 'R4.WP1', 'T-22': 'R4.WP1',
      // R4.WP2
      'T-37': 'R4.WP2', 'T-47': 'R4.WP2',
      // R4.WP3
      'T-16': 'R4.WP3',
      // R5.WP1
      'T-14': 'R5.WP1', 'T-25': 'R5.WP1',
      // R5.WP2
      'T-15': 'R5.WP2', 'T-26': 'R5.WP2',
      // R6.WP1
      'T-36': 'R6.WP1', 'T-29': 'R6.WP1', 'T-27': 'R6.WP1',
      // R6.WP2
      'T-38': 'R6.WP2', 'T-35': 'R6.WP2',
      // R6.WP3
      'T-20': 'R6.WP3', 'T-30': 'R6.WP3', 'T-34': 'R6.WP3', 'T-40': 'R6.WP3'
    };

    return taskToWP[taskId] || null;
  }

  /**
   * Obtiene el release para una tarea específica
   */
  _getReleaseForTask(taskId) {
    const wp = this._getWorkPackageForTask(taskId);
    return wp ? wp.split('.')[0] : null;
  }

  /**
   * Determina el scope de validación según la tarea
   */
  _getScopeForTask(taskId) {
    const taskScopes = {
      // Frontend tasks
      'T-07': 'frontend', 'T-08': 'frontend', 'T-18': 'frontend', 'T-19': 'frontend',
      'T-21': 'frontend', 'T-28': 'frontend', 'T-31': 'frontend', 'T-39': 'frontend',
      
      // Backend tasks
      'T-02': 'backend', 'T-03': 'backend', 'T-04': 'backend', 'T-05': 'backend',
      'T-06': 'backend', 'T-09': 'backend', 'T-10': 'backend', 'T-11': 'backend',
      'T-12': 'backend', 'T-13': 'backend', 'T-22': 'backend', 'T-24': 'backend',
      'T-32': 'backend', 'T-35': 'backend', 'T-37': 'backend', 'T-41': 'backend',
      'T-44': 'backend',
      
      // Infrastructure/Full stack
      'T-01': 'all', 'T-14': 'all', 'T-15': 'all', 'T-16': 'all', 'T-17': 'all',
      'T-20': 'all', 'T-23': 'all', 'T-25': 'all', 'T-26': 'all', 'T-27': 'all',
      'T-29': 'all', 'T-30': 'all', 'T-33': 'all', 'T-34': 'all', 'T-36': 'all',
      'T-38': 'all', 'T-40': 'all', 'T-42': 'all', 'T-43': 'all', 'T-45': 'all',
      'T-46': 'all', 'T-47': 'all'
    };

    return taskScopes[taskId] || 'all';
  }

  /**
   * Detecta archivos modificados relevantes para el contexto
   */
  getModifiedFiles() {
    try {
      const output = execSync('git diff --name-only HEAD', { encoding: 'utf8' });
      return output.trim().split('\n').filter(f => f.length > 0);
    } catch {
      return [];
    }
  }

  /**
   * Detecta archivos staged para pre-commit
   */
  getStagedFiles() {
    try {
      const output = execSync('git diff --name-only --cached', { encoding: 'utf8' });
      return output.trim().split('\n').filter(f => f.length > 0);
    } catch {
      return [];
    }
  }

  /**
   * Obtiene el contexto actual
   */
  getContext() {
    return this.context;
  }

  /**
   * Sugiere comandos de validación según el contexto
   */
  getValidationCommands() {
    const ctx = this.context;
    const commands = [];

    switch (ctx.type) {
      case 'feature':
        if (ctx.task) {
          commands.push(`validate-${ctx.validationScope}`);
          commands.push(`validate-${ctx.validationScope}-fast`);
          commands.push('validate-modified');
        }
        break;

      case 'integration':
        commands.push('validate-all');
        commands.push('qa-gate');
        break;

      case 'release':
        commands.push('validate-all-full');
        commands.push('qa-gate');
        commands.push('security-scan');
        break;

      case 'production':
        commands.push('validate-all-full');
        commands.push('qa-gate');
        commands.push('security-scan');
        commands.push('governance');
        break;

      case 'hotfix':
        commands.push('validate-all');
        commands.push('qa-gate');
        break;

      default:
        commands.push('validate-all-fast');
    }

    return commands;
  }

  /**
   * Muestra información de contexto
   */
  showContext() {
    const ctx = this.context;
    
    logger.title('Contexto de Flujo de Trabajo');
    logger.info(`Branch: ${ctx.branch}`);
    logger.info(`Tipo: ${ctx.type}`);
    
    if (ctx.task) {
      logger.info(`Tarea: ${ctx.task}`);
    }
    if (ctx.workPackage) {
      logger.info(`Work Package: ${ctx.workPackage}`);
    }
    if (ctx.release) {
      logger.info(`Release: ${ctx.release}`);
    }
    if (ctx.integration) {
      logger.info(`Integración: ${ctx.integration}`);
    }
    
    logger.info(`Scope de Validación: ${ctx.validationScope}`);
    logger.info(`Nivel de Validación: ${ctx.validationLevel}`);

    const suggestions = this.getValidationCommands();
    if (suggestions.length > 0) {
      logger.info('\nComandos sugeridos:');
      suggestions.forEach(cmd => {
        logger.info(`  yarn run cmd ${cmd}`);
      });
    }
  }
}

module.exports = WorkflowContext;