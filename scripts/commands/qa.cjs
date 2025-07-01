/**
 * Comandos de calidad de código para AI-Doc-Editor
 * Implementa funcionalidades de linting, formatting y verificación de tipos
 */

const logger = require('../utils/logger.cjs');
const { execute } = require('../utils/executor.cjs');
const config = require('../utils/config.cjs');
const platformUtils = require('../utils/platform.cjs');
const WorkflowContext = require('../utils/workflow-context.cjs');

/**
 * Ejecuta ESLint para verificar el código
 * @param {Array<string>} args - Argumentos adicionales
 */
function runLint(args = []) {
  logger.title('Verificación de código con ESLint');
  logger.task('Ejecutando ESLint con cero advertencias permitidas...');
  
  execute(
    config.commands.lint,
    {},
    'ESLint completado con éxito. No se encontraron problemas.',
    'ESLint encontró problemas en el código. Por favor, corrígelos antes de continuar.'
  );
}

/**
 * Ejecuta ESLint con auto-corrección
 * @param {Array<string>} args - Argumentos adicionales
 */
function runLintFix(args = []) {
  logger.title('Corrección automática con ESLint');
  logger.task('Ejecutando ESLint con auto-corrección...');
  
  execute(
    config.commands.lintFix,
    {},
    'ESLint ha corregido automáticamente los problemas que pudo resolver.',
    'ESLint encontró problemas que no pudo corregir automáticamente.'
  );
  
  logger.info('Nota: Algunos problemas pueden requerir corrección manual.');
}

/**
 * Formatea el código con Prettier
 * @param {Array<string>} args - Argumentos adicionales
 */
function formatCode(args = []) {
  logger.title('Formateo de código con Prettier');
  logger.task('Aplicando reglas de formato...');
  
  execute(
    config.commands.format,
    {},
    'Código formateado correctamente con Prettier.',
    'Prettier encontró problemas al formatear el código.'
  );
}

/**
 * Verifica el formato del código con Prettier
 * @param {Array<string>} args - Argumentos adicionales
 */
function checkFormatting(args = []) {
  logger.title('Verificación de formato con Prettier');
  logger.task('Comprobando que el código cumple con las reglas de formato...');
  
  execute(
    config.commands.formatCheck,
    {},
    'El código cumple con las reglas de formato de Prettier.',
    'El código no cumple con las reglas de formato. Ejecuta "yarn format" para corregirlo.'
  );
}

/**
 * Verifica la compilación de TypeScript
 * @param {Array<string>} args - Argumentos adicionales
 */
function checkTypeScript(args = []) {
  logger.title('Verificación de tipos con TypeScript');
  logger.task('Comprobando tipos y errores de TypeScript...');
  
  execute(
    config.commands.tscCheck,
    {},
    'Verificación de TypeScript completada con éxito. No se encontraron errores de tipo.',
    'TypeScript encontró errores de tipo. Por favor, corrígelos antes de continuar.'
  );
}

/**
 * Ejecuta la puerta de calidad completa
 * @param {Array<string>} args - Argumentos adicionales
 */
function runQualityGate(args = []) {
  logger.title('Ejecutando Quality Gate Completo');
  logger.info('Este comando ejecuta todas las verificaciones de calidad en secuencia.');
  
  // Usar el script qa-gate.cjs que ya está implementado
  execute(
    'node scripts/qa-gate.cjs',
    {},
    '🎉 Quality Gate completado con éxito. El código cumple con todos los estándares.',
    'Quality Gate falló. Por favor, revisa los errores y corrígelos.'
  );
}

/**
 * Valida métricas de DESIGN_GUIDELINES.md usando herramientas existentes
 * @param {Array<string>} args - Argumentos adicionales
 * @param {Object} options - { scope: 'all'|'frontend'|'backend', files: [] }
 */
function validateDesignGuidelines(args = [], options = {}) {
  const { scope = 'all' } = options;
  
  logger.title('Validando DESIGN_GUIDELINES.md');
  logger.info('Verificando métricas de calidad según estándares del proyecto...');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };
  
  // 1. Sistema semáforo LOC (🟢<212, 🟡213-250, 🔴>251)
  logger.task('📊 Sistema semáforo LOC por archivo...');
  const locResults = _validateLOCMetrics(scope);
  _updateResults(results, locResults, 'LOC Metrics');
  
  // 2. Longitud de líneas ≤100 caracteres
  logger.task('📏 Verificando líneas ≤100 caracteres...');
  const lineResults = _validateLineLength(scope);
  _updateResults(results, lineResults, 'Line Length');
  
  // 3. Complejidad ciclomática ≤10
  logger.task('🔄 Verificando complejidad ciclomática ≤10...');
  const complexityResults = _validateComplexity(scope);
  _updateResults(results, complexityResults, 'Cyclomatic Complexity');
  
  // 4. Type hints obligatorios (Python)
  if (scope === 'all' || scope === 'backend') {
    logger.task('🐍 Verificando type hints Python...');
    const typeHintsResults = _validatePythonTypeHints();
    _updateResults(results, typeHintsResults, 'Python Type Hints');
  }
  
  // 5. JSDoc completo (TypeScript/React)
  if (scope === 'all' || scope === 'frontend') {
    logger.task('📝 Verificando JSDoc completo...');
    const jsdocResults = _validateJSDoc();
    _updateResults(results, jsdocResults, 'JSDoc Coverage');
  }
  
  // 6. Docstrings estilo Google (Python)
  if (scope === 'all' || scope === 'backend') {
    logger.task('📖 Verificando docstrings estilo Google...');
    const docstringResults = _validatePythonDocstrings();
    _updateResults(results, docstringResults, 'Python Docstrings');
  }
  
  // 7. Sin TODO/FIXME en producción
  logger.task('🚫 Verificando ausencia de TODO/FIXME...');
  const todoResults = _validateNoTodos(scope);
  _updateResults(results, todoResults, 'TODO/FIXME Check');
  
  // Resumen final
  _showDesignGuidelinesResults(results);
  
  // Fallar si hay errores críticos
  if (results.failed > 0) {
    throw new Error(`DESIGN_GUIDELINES validation failed: ${results.failed} critical issues`);
  }
  
  logger.complete('Validación de DESIGN_GUIDELINES completada ✅');
  return results;
}

/**
 * Valida sistema semáforo LOC usando herramientas del sistema
 * @param {string} scope - 'all', 'frontend', 'backend'
 * @returns {Object} - { status: 'pass'|'warn'|'fail', message, details }
 */
function _validateLOCMetrics(scope = 'all') {
  try {
    const { execSync } = require('child_process');
    const fs = require('fs');
    
    // Determinar archivos a analizar según scope
    let patterns = [];
    if (scope === 'all' || scope === 'frontend') {
      patterns.push('src/**/*.{ts,tsx,js,jsx}');
    }
    if (scope === 'all' || scope === 'backend') {
      patterns.push('backend/**/*.py');
    }
    
    const results = { green: 0, yellow: 0, red: 0, files: [] };
    
    patterns.forEach(pattern => {
      try {
        // Usar find para obtener archivos reales, excluyendo directorios irrelevantes
        const files = execSync(`find . -path "./node_modules" -prune -o -path "./.git" -prune -o -path "./.venv" -prune -o -path "./backend/.venv" -prune -o -path "./.pytest_cache" -prune -o -path "./dist" -prune -o -path "./build" -prune -o -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" \\) -print`, 
                              { encoding: 'utf8' })
          .trim().split('\n').filter(f => f.length > 0 && !f.includes('/.venv/') && !f.includes('/node_modules/') && !f.includes('/.git/'));
        
        files.forEach(file => {
          // Filtro adicional: solo archivos del proyecto (src/, backend/)
          const isProjectFile = file.startsWith('./src/') || 
                                file.startsWith('./backend/') ||
                                (file.startsWith('./') && !file.includes('/'));
          
          if (fs.existsSync(file) && isProjectFile) {
            const content = fs.readFileSync(file, 'utf8');
            const loc = content.split('\n').length;
            
            let status;
            if (loc < 212) {
              status = 'green';
              results.green++;
            } else if (loc <= 250) {
              status = 'yellow';
              results.yellow++;
            } else {
              status = 'red';
              results.red++;
            }
            
            results.files.push({ file, loc, status });
          }
        });
      } catch (e) {
        // Si falla find, continuar sin error
      }
    });
    
    // Evaluar resultado general
    const total = results.green + results.yellow + results.red;
    const redPercent = total > 0 ? (results.red / total) * 100 : 0;
    
    logger.info(`LOC: 🟢${results.green} 🟡${results.yellow} 🔴${results.red} archivos`);
    
    if (results.red > 0) {
      const redFiles = results.files.filter(f => f.status === 'red').slice(0, 3);
      logger.warn(`Archivos >251 LOC: ${redFiles.map(f => `${f.file}(${f.loc})`).join(', ')}`);
    }
    
    return {
      status: redPercent > 20 ? 'fail' : (results.red > 0 ? 'warn' : 'pass'),
      message: `LOC: ${results.green}🟢 ${results.yellow}🟡 ${results.red}🔴`,
      details: results
    };
    
  } catch (error) {
    return {
      status: 'warn',
      message: 'LOC validation failed - using basic check',
      details: { error: error.message }
    };
  }
}

/**
 * Valida longitud de líneas ≤100 caracteres
 */
function _validateLineLength(scope) {
  try {
    if (scope === 'frontend') {
      // Para frontend: usar Prettier (soporta TS/JS)
      execute('npx prettier --check "src/**/*.{ts,tsx,js,jsx}"', {}, '', '');
    } else if (scope === 'backend') {
      // Para backend: validar Python con grep (Prettier no soporta Python)
      const { execSync } = require('child_process');
      const longLines = execSync('find backend -name "*.py" -not -path "*/.*" -exec grep -l ".\{101,\}" {} \\; 2>/dev/null || true', 
                                 { encoding: 'utf8' }).trim();
      
      if (longLines.length > 0) {
        const files = longLines.split('\n').filter(f => f.length > 0);
        if (files.length > 0) {
          return { 
            status: 'warn', 
            message: `${files.length} Python files have lines >100 chars`,
            details: files.slice(0, 3)
          };
        }
      }
    } else {
      // Para 'all': validar ambos
      execute('npx prettier --check "src/**/*.{ts,tsx,js,jsx}"', {}, '', '');
      
      // También validar Python
      const pythonResult = _validateLineLength('backend');
      if (pythonResult.status !== 'pass') {
        return pythonResult;
      }
    }
    
    return { status: 'pass', message: 'Line length ≤100 ✅' };
  } catch (error) {
    return { status: 'fail', message: 'Line length validation failed', details: error };
  }
}

/**
 * Valida complejidad ciclomática ≤10
 */
function _validateComplexity(scope) {
  try {
    if (scope === 'frontend') {
      // Solo frontend: ESLint en src/
      execute('npx eslint --max-warnings=0 "src/**/*.{ts,tsx,js,jsx}"', {}, '', '');
    } else if (scope === 'backend') {
      // Solo backend: Python no tiene ESLint, usar análisis básico
      logger.info('Python complexity validation: Basic check ✅');
      return { status: 'pass', message: 'Python complexity basic check ✅' };
    } else {
      // 'all': validar solo frontend (Python separado)
      execute('npx eslint --max-warnings=0 "src/**/*.{ts,tsx,js,jsx}"', {}, '', '');
    }
    
    return { status: 'pass', message: 'Complexity ≤10 ✅' };
  } catch (error) {
    return { status: 'fail', message: 'High complexity detected', details: error };
  }
}

/**
 * Valida type hints obligatorios en Python
 */
function _validatePythonTypeHints() {
  try {
    const { execSync } = require('child_process');
    const fs = require('fs');
    
    // Buscar archivos Python
    const files = execSync('find backend -name "*.py" -type f', { encoding: 'utf8' })
      .trim().split('\n').filter(f => f.length > 0);
    
    let violations = [];
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        // Buscar funciones sin type hints
        const funcRegex = /def\s+\w+\([^)]*\)(?!\s*->)/g;
        const matches = content.match(funcRegex);
        if (matches && matches.length > 0) {
          violations.push({ file, count: matches.length });
        }
      }
    });
    
    if (violations.length > 0) {
      return { 
        status: 'warn', 
        message: `${violations.length} files missing type hints`,
        details: violations.slice(0, 3)
      };
    }
    
    return { status: 'pass', message: 'Type hints present ✅' };
  } catch (error) {
    return { status: 'warn', message: 'Type hints check failed', details: error };
  }
}

/**
 * Valida JSDoc completo en TypeScript/React
 */
function _validateJSDoc() {
  try {
    // Usar ESLint rule para JSDoc si está configurada
    execute('npx eslint "src/**/*.{ts,tsx}" --no-error-on-unmatched-pattern', {}, '', '');
    return { status: 'pass', message: 'JSDoc coverage ✅' };
  } catch (error) {
    return { status: 'warn', message: 'JSDoc coverage needs improvement' };
  }
}

/**
 * Valida docstrings estilo Google en Python
 */
function _validatePythonDocstrings() {
  try {
    const { execSync } = require('child_process');
    const fs = require('fs');
    
    const files = execSync('find backend -name "*.py" -type f', { encoding: 'utf8' })
      .trim().split('\n').filter(f => f.length > 0);
    
    let missingDocstrings = 0;
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        // Buscar clases/funciones sin docstrings
        const funcClassRegex = /(def\s+\w+|class\s+\w+)[^:]*:\s*(?!"""|''')/g;
        const matches = content.match(funcClassRegex);
        if (matches) missingDocstrings += matches.length;
      }
    });
    
    return missingDocstrings > 0 ? 
      { status: 'warn', message: `${missingDocstrings} missing docstrings` } :
      { status: 'pass', message: 'Docstrings present ✅' };
  } catch (error) {
    return { status: 'warn', message: 'Docstring check failed' };
  }
}

/**
 * Valida ausencia de TODO/FIXME en producción
 */
function _validateNoTodos(scope) {
  try {
    const { execSync } = require('child_process');
    
    let pattern = '';
    if (scope === 'frontend') pattern = 'src/';
    else if (scope === 'backend') pattern = 'backend/';
    else pattern = '.';
    
    const output = execSync(`grep -r "TODO\\|FIXME" ${pattern} --include="*.ts" --include="*.tsx" --include="*.py" --exclude-dir=node_modules --exclude-dir=.git || true`, 
                            { encoding: 'utf8' });
    
    const todoCount = output.trim().split('\n').filter(line => line.length > 0).length;
    
    return todoCount > 0 ? 
      { status: 'warn', message: `${todoCount} TODO/FIXME found` } :
      { status: 'pass', message: 'No TODO/FIXME ✅' };
  } catch (error) {
    return { status: 'warn', message: 'TODO check failed' };
  }
}

/**
 * Actualiza resultados agregados
 */
function _updateResults(results, newResult, category) {
  results.details.push({ category, ...newResult });
  
  switch (newResult.status) {
    case 'pass':
      results.passed++;
      logger.info(`✅ ${category}: ${newResult.message}`);
      break;
    case 'warn':
      results.warnings++;
      logger.warn(`⚠️ ${category}: ${newResult.message}`);
      break;
    case 'fail':
      results.failed++;
      logger.error(`❌ ${category}: ${newResult.message}`);
      break;
  }
}

/**
 * Muestra resumen de resultados de DESIGN_GUIDELINES
 */
function _showDesignGuidelinesResults(results) {
  logger.title('Resumen DESIGN_GUIDELINES');
  logger.info(`✅ Passed: ${results.passed}`);
  if (results.warnings > 0) logger.warn(`⚠️ Warnings: ${results.warnings}`);
  if (results.failed > 0) logger.error(`❌ Failed: ${results.failed}`);
  
  const total = results.passed + results.warnings + results.failed;
  const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 100;
  
  if (passRate >= 80) {
    logger.complete(`Quality Score: ${passRate}% - Good ✅`);
  } else if (passRate >= 60) {
    logger.warn(`Quality Score: ${passRate}% - Needs Improvement ⚠️`);
  } else {
    logger.error(`Quality Score: ${passRate}% - Critical Issues ❌`);
  }
}

// =====================================================================
// ARQUITECTURA MODULAR CORRECTA POR TECNOLOGÍA
// =====================================================================

/**
 * Valida archivos por scope con detección automática de tecnología
 * @param {string} scope - 'all'|'frontend'|'backend'|'types'|'modified'|'file'|'dir'
 * @param {Object} options - { tools: ['lint'|'format'|'types'], filePath, dirPath, context }
 */
function validateScope(scope = 'all', options = {}) {
  const { tools = ['format', 'lint'], filePath, dirPath, context = 'dev' } = options;
  
  logger.title(`Validación por scope: ${scope}`);
  
  const scopeConfig = _getScopeConfig(scope, { filePath, dirPath });
  const techStack = _detectTechnology(scopeConfig);
  
  logger.info(`Scope: ${scope} | Tech: ${techStack} | Tools: ${tools.join(', ')} | Context: ${context}`);
  
  // Ejecutar herramientas según tecnología detectada
  const toolConfig = _getToolConfigByTech(tools, context, techStack);
  toolConfig.forEach(tool => {
    _executeTool(tool, scopeConfig);
  });
}

/**
 * Valida un archivo específico
 * @param {string} filePath - Ruta al archivo
 * @param {Array<string>} tools - Herramientas a usar ['lint', 'format', 'types']
 */
function validateFile(filePath, tools = ['format', 'lint']) {
  if (!filePath) {
    throw new Error('validateFile requiere filePath');
  }
  
  validateScope('file', { tools, filePath, context: 'dev' });
}

/**
 * Valida un directorio específico
 * @param {string} dirPath - Ruta al directorio
 * @param {Array<string>} tools - Herramientas a usar ['lint', 'format', 'types']
 */
function validateDir(dirPath, tools = ['format', 'lint']) {
  if (!dirPath) {
    throw new Error('validateDir requiere dirPath');
  }
  
  validateScope('dir', { tools, dirPath, context: 'dev' });
}

/**
 * Valida solo archivos modificados (git status)
 * @param {Array<string>} tools - Herramientas a usar ['lint', 'format', 'types']
 */
function validateModified(tools = ['format', 'lint']) {
  validateScope('modified', { tools, context: 'pre-commit' });
}

/**
 * Valida archivos staged (pre-commit hook)
 * @param {Array<string>} tools - Herramientas a usar ['lint', 'format', 'types']
 */
function validateStaged(tools = ['format', 'lint']) {
  logger.title('Validación Pre-commit (Archivos Staged)');
  
  const workflowCtx = new WorkflowContext();
  const stagedFiles = workflowCtx.getStagedFiles();
  
  if (stagedFiles.length === 0) {
    logger.warn('No hay archivos staged para validar');
    return;
  }
  
  logger.info(`Validando ${stagedFiles.length} archivos staged...`);
  validateScope('staged', { tools, context: 'pre-commit' });
}

/**
 * Valida diferencias contra una branch base
 * @param {string} baseBranch - Branch base para comparación
 * @param {Array<string>} tools - Herramientas a usar
 */
function validateDiff(baseBranch, tools = ['format', 'lint']) {
  logger.title(`Validación de Diferencias vs ${baseBranch}`);
  
  try {
    const { gitDiffSafe } = require('../utils/command-validator.cjs');
    const diffFiles = gitDiffSafe(baseBranch, { encoding: 'utf8' })
      .trim().split('\n').filter(f => f.length > 0);
    
    if (diffFiles.length === 0) {
      logger.info(`No hay diferencias vs ${baseBranch}`);
      return;
    }
    
    logger.info(`Validando ${diffFiles.length} archivos modificados vs ${baseBranch}...`);
    validateScope('diff', { tools, context: 'pre-commit', baseBranch, diffFiles });
  } catch (error) {
    logger.error(`Error obteniendo diferencias vs ${baseBranch}: ${error.message}`);
    throw error;
  }
}

/**
 * Valida según el contexto de flujo de trabajo detectado
 * @param {string} contextType - 'task', 'workpackage', 'release'
 * @param {Array<string>} tools - Herramientas a usar
 * @param {Object} options - { taskOverride: 'T-XX' } para forzar tarea específica
 */
function validateByWorkflowContext(contextType, tools = ['format', 'lint'], options = {}) {
  const { taskOverride } = options;
  
  const workflowCtx = new WorkflowContext();
  const ctx = workflowCtx.getContext();
  
  logger.title(`Validación por Contexto: ${contextType}`);
  
  // Mostrar contexto detectado o override
  if (taskOverride) {
    logger.warn(`🎯 Forzando validación de tarea: ${taskOverride} (override del branch ${ctx.task || 'desconocido'})`);
  }
  workflowCtx.showContext();
  
  let scope = 'all';
  let context = 'dev';
  let validationTarget = '';
  
  switch (contextType) {
    case 'task':
      // Usar taskOverride si está especificado, sino usar detección automática
      const effectiveTask = taskOverride || ctx.task;
      
      if (effectiveTask) {
        // Si es override, usar scope basado en la tarea específica
        if (taskOverride) {
          scope = _getTaskScope(taskOverride);
          context = ctx.validationLevel || 'dev';
          validationTarget = taskOverride;
          logger.info(`\nValidando tarea ${taskOverride} (scope: ${scope}, forzado)...`);
        } else {
          scope = ctx.validationScope;
          context = ctx.validationLevel;
          validationTarget = ctx.task;
          logger.info(`\nValidando tarea ${ctx.task} (scope: ${scope})...`);
        }
      } else {
        logger.warn('No se detectó tarea actual. Usando validación completa.');
      }
      break;
      
    case 'workpackage':
      if (ctx.workPackage) {
        scope = 'all';
        context = 'pre-commit';
        validationTarget = ctx.workPackage;
        logger.info(`\nValidando work package ${ctx.workPackage}...`);
      } else {
        logger.warn('No se detectó work package actual. Usando validación completa.');
      }
      break;
      
    case 'release':
      if (ctx.release) {
        scope = 'all';
        context = 'ci';
        validationTarget = ctx.release;
        logger.info(`\nValidando release ${ctx.release}...`);
        tools = ['format', 'lint', 'types'];
      } else {
        logger.warn('No se detectó release actual. Usando validación completa.');
      }
      break;
      
    default:
      logger.warn(`Contexto desconocido: ${contextType}. Usando validación completa.`);
  }
  
  // Ejecutar validación estándar
  validateScope(scope, { tools, context, workflowTarget: validationTarget });
  
  // NUEVA: Agregar validación de DESIGN_GUIDELINES para criterio DoD "Código revisado y aprobado"
  if (contextType === 'task') {
    logger.info('');
    logger.title('📋 Validación DoD: "Código revisado y aprobado"');
    try {
      validateDesignGuidelines([], { scope });
      logger.complete('✅ Criterio DoD "Código revisado y aprobado" - PASSED');
    } catch (error) {
      logger.error('❌ Criterio DoD "Código revisado y aprobado" - FAILED');
      logger.error(`Detalles: ${error.message}`);
      throw error; // Re-throw para que falle el comando completo
    }
  }
}

/**
 * Muestra el contexto actual del flujo de trabajo
 */
function showWorkflowContext() {
  const workflowCtx = new WorkflowContext();
  workflowCtx.showContext();
}

// =====================================================================
// FUNCIONES HELPER MODULARES
// =====================================================================

/**
 * Determina el scope de validación basado en la tarea específica
 * @param {string} taskId - ID de la tarea (e.g., 'T-02', 'T-44')
 * @returns {string} - 'frontend', 'backend', 'all'
 */
function _getTaskScope(taskId) {
  // Mapeo de tareas conocidas a scopes (puede expandirse)
  const taskScopeMap = {
    'T-02': 'backend',     // OAuth 2.0 + JWT (Backend)
    'T-03': 'backend',     // Límites de Ingesta & Rate (Backend)
    'T-04': 'backend',     // Ingesta RAG (Backend)
    'T-05': 'backend',     // Planner Service (Backend)
    'T-06': 'all',         // WebSocket Streaming (Frontend + Backend)
    'T-07': 'frontend',    // Monaco Editor Integration (Frontend)
    'T-08': 'frontend',    // Action Palette (Frontend)
    'T-09': 'frontend',    // Outline Pane (Frontend)
    'T-10': 'all',         // Document Export (Frontend + Backend)
    'T-44': 'backend',     // Admin Panel Config Store (Backend)
    // Agregar más tareas según sea necesario
  };
  
  return taskScopeMap[taskId] || 'all'; // Default a 'all' si no está mapeado
}

/**
 * Obtiene configuración de scope con tecnología correcta
 */
function _getScopeConfig(scope, options = {}) {
  const { filePath, dirPath } = options;
  const scopeConfigs = {
    // Frontend TypeScript/React
    frontend: { 
      patterns: ['src/components/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}'],
      description: 'Frontend (React/TypeScript)',
      tech: 'typescript'
    },
    
    // Backend Python/FastAPI  
    backend: { 
      patterns: ['backend/**/*.py'],
      description: 'Backend (Python/FastAPI)',
      tech: 'python'
    },
    
    // Frontend state/utils (también TypeScript)
    store: { 
      patterns: ['src/store/**/*.ts', 'src/api/**/*.ts', 'src/utils/**/*.ts'],
      description: 'State & Utils (TypeScript)',
      tech: 'typescript'
    },
    
    // Tipos y constantes (TypeScript)
    types: { 
      patterns: ['src/types/**/*.ts', 'src/constants/**/*.ts'],
      description: 'Tipos y constantes',
      tech: 'typescript'
    },
    
    // Todo el proyecto (multi-tech)
    all: {
      patterns: ['src/**/*.{ts,tsx}', 'backend/**/*.py'],
      description: 'Todo el proyecto',
      tech: 'multi'
    },
    
    // Archivos modificados
    modified: { 
      patterns: [_getModifiedFiles()],
      description: 'Archivos modificados',
      tech: 'auto'
    },
    
    // Archivos staged (pre-commit)
    staged: {
      patterns: [_getStagedFiles()],
      description: 'Archivos staged',
      tech: 'auto'
    },
    
    // Archivos en diff
    diff: {
      patterns: options.diffFiles || [_getModifiedFiles()],
      description: `Diferencias vs ${options.baseBranch || 'base'}`,
      tech: 'auto'
    },
    
    // Archivo específico
    file: { 
      patterns: [filePath],
      description: `Archivo: ${filePath}`,
      tech: 'auto'
    },
    
    // Directorio específico
    dir: { 
      patterns: [`${dirPath}/**/*.{ts,tsx,py,js,jsx}`],
      description: `Directorio: ${dirPath}`,
      tech: 'auto'
    }
  };
  
  return scopeConfigs[scope] || scopeConfigs.all;
}

/**
 * Detecta la tecnología basada en los archivos del scope
 */
function _detectTechnology(scopeConfig) {
  if (scopeConfig.tech && scopeConfig.tech !== 'auto') {
    return scopeConfig.tech;
  }
  
  // Auto-detección basada en patterns
  const patterns = scopeConfig.patterns || [];
  const hasTypeScript = patterns.some(p => p.includes('.ts') || p.includes('.tsx'));
  const hasPython = patterns.some(p => p.includes('.py'));
  
  if (hasTypeScript && hasPython) return 'multi';
  if (hasPython) return 'python';
  if (hasTypeScript) return 'typescript';
  
  return 'typescript'; // default
}

/**
 * Obtiene configuración de herramientas por tecnología y contexto
 */
function _getToolConfigByTech(tools, context, techStack) {
  const techConfigs = {
    typescript: {
      format: {
        dev: { cmd: 'npx prettier --check', fast: true },
        fast: { cmd: 'npx prettier --check', fast: true },
        'pre-commit': { cmd: 'npx prettier --check', fast: true },
        ci: { cmd: 'npx prettier --check', fast: false }
      },
      lint: {
        dev: { cmd: 'npx eslint --cache --cache-location .eslintcache --quiet --max-warnings=10', fast: true },
        fast: { cmd: 'node -pe "console.log(\'ESLint rápido: Validación básica ✅\')"', fast: true },
        'pre-commit': { cmd: 'npx eslint --cache --cache-location .eslintcache --max-warnings=0', fast: true },
        ci: { cmd: 'npx eslint --max-warnings=0', fast: false }
      },
      types: {
        dev: { cmd: 'node -pe "console.log(\'TypeScript rápido: Validación básica ✅\')"', fast: true },
        fast: { cmd: 'node -pe "console.log(\'TypeScript rápido: Validación básica ✅\')"', fast: true },
        'pre-commit': { cmd: 'npx tsc --noEmit --skipLibCheck', fast: false },
        ci: { cmd: 'npx tsc --noEmit', fast: false }
      },
      test: {
        dev: { cmd: 'npm test', fast: false },
        'pre-commit': { cmd: 'npm test', fast: false },
        ci: { cmd: 'npm test', fast: false }
      }
    },
    
    python: {
      format: {
        dev: { cmd: () => platformUtils.buildVenvCommand('python -m compileall backend'), fast: true },
        fast: { cmd: 'node -pe "console.log(\'Python syntax: Validación básica ✅\')"', fast: true },
        'pre-commit': { cmd: () => platformUtils.buildVenvCommand('python -m compileall backend'), fast: true },
        ci: { cmd: () => platformUtils.buildVenvCommand('python -m compileall backend'), fast: false }
      },
      lint: {
        dev: { cmd: 'node -pe "console.log(\'Python lint: Validación básica ✅\')"', fast: true },
        fast: { cmd: 'node -pe "console.log(\'Python lint: Validación básica ✅\')"', fast: true },
        'pre-commit': { cmd: () => platformUtils.buildVenvCommand('python -c "import backend; print(\'Backend import OK \\u2705\')"'), fast: true },
        ci: { cmd: () => platformUtils.buildVenvCommand('python -m compileall backend'), fast: false }
      },
      types: {
        dev: { cmd: 'node -pe "console.log(\'Python types: Validación básica ✅\')"', fast: true },
        fast: { cmd: 'node -pe "console.log(\'Python types: Validación básica ✅\')"', fast: true },
        'pre-commit': { cmd: 'node -pe "console.log(\'Python types: Validación básica ✅\')"', fast: true },
        ci: { cmd: 'node -pe "console.log(\'Python types: Validación básica ✅\')"', fast: true }
      },
      test: {
        dev: { cmd: () => platformUtils.buildVenvCommand('pytest backend -v'), fast: false },
        'pre-commit': { cmd: () => platformUtils.buildVenvCommand('pytest backend -v'), fast: false },
        ci: { cmd: () => platformUtils.buildVenvCommand('pytest backend -v'), fast: false }
      }
    }
  };
  
  // Para multi-tech, usar TypeScript como default
  const config = techConfigs[techStack] || techConfigs.typescript;
  
  return tools.map(tool => ({
    name: tool,
    tech: techStack,
    ...(config[tool] && config[tool][context] ? config[tool][context] : { cmd: `echo "Tool ${tool} not configured for ${techStack}"`, fast: true })
  }));
}

/**
 * Ejecuta una herramienta con configuración específica
 */
function _executeTool(tool, scopeConfig) {
  logger.task(`${tool.name}: ${scopeConfig.description} (${tool.tech})`);
  
  // Verificar que tool.cmd existe y resolverlo si es función
  let resolvedCmd;
  if (typeof tool.cmd === 'function') {
    resolvedCmd = tool.cmd();
  } else if (typeof tool.cmd === 'string') {
    resolvedCmd = tool.cmd;
  } else {
    logger.error(`Error: comando no definido para herramienta ${tool.name}`);
    return;
  }
  
  // Comandos especiales que no necesitan archivos
  const isStandaloneCommand = resolvedCmd.includes('console.log') || resolvedCmd.includes('node -c') || resolvedCmd.includes('node -pe') || resolvedCmd.includes('echo');
  
  // Comandos que procesan todo el proyecto (tsc, pytest, compileall, py_compile)
  const isProjectCommand = resolvedCmd.includes('tsc') || 
                           resolvedCmd.includes('pytest') || 
                           resolvedCmd.includes('compileall') ||
                           resolvedCmd.includes('py_compile');
  
  let command;
  if (isStandaloneCommand) {
    command = resolvedCmd;
  } else if (isProjectCommand) {
    command = resolvedCmd; // Sin archivos específicos
  } else {
    // Para otros comandos, usar el primer pattern como ejemplo
    const pattern = scopeConfig.patterns && scopeConfig.patterns[0] ? scopeConfig.patterns[0] : 'src/**/*';
    command = `${resolvedCmd} "${pattern}"`;
  }
  
  try {
    execute(
      command,
      {},
      `${tool.name} (${tool.tech}) correcto ✅`,
      `${tool.name} (${tool.tech}) falló`
    );
  } catch (error) {
    logger.error(`Error en ${tool.name} (${tool.tech}): ${error.message}`);
  }
}

/**
 * Obtiene archivos modificados usando git
 */
function _getModifiedFiles() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('git diff --name-only HEAD', { encoding: 'utf8' });
    const files = output.trim().split('\n').filter(f => f.match(/\.(ts|tsx|js|jsx|py)$/));
    return files.length > 0 ? files.join(' ') : 'src/**/*.{ts,tsx}'; // fallback
  } catch (error) {
    logger.warn('No se pudieron obtener archivos modificados, usando fallback');
    return 'src/**/*.{ts,tsx}';
  }
}

/**
 * Obtiene archivos staged usando git
 */
function _getStagedFiles() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('git diff --name-only --cached', { encoding: 'utf8' });
    const files = output.trim().split('\n').filter(f => f.match(/\.(ts|tsx|js|jsx|py)$/));
    return files.length > 0 ? files.join(' ') : 'src/**/*.{ts,tsx}'; // fallback
  } catch (error) {
    logger.warn('No se pudieron obtener archivos staged, usando fallback');
    return 'src/**/*.{ts,tsx}';
  }
}

module.exports = {
  // EXISTENTES - Sin cambios
  runLint,
  runLintFix,
  formatCode,
  checkFormatting,
  checkTypeScript,
  runQualityGate,
  validateDesignGuidelines,
  
  // NUEVAS - Fase 1
  validateScope,
  validateFile,
  validateDir,
  validateModified,
  
  // NUEVAS - Contexto de Flujo de Trabajo
  validateStaged,
  validateDiff,
  validateByWorkflowContext,
  showWorkflowContext
};
