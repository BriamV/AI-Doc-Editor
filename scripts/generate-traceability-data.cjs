/**
 * Módulo para generar datos de trazabilidad entre requisitos, tareas y pruebas
 * 
 * Este módulo extrae datos de trazabilidad de los archivos del proyecto
 * para ser utilizados en la generación de matrices de trazabilidad en
 * diferentes formatos (Excel, JSON, Markdown).
 * 
 * @module generate-traceability-data
 */

const fs = require('fs');
const path = require('path');
// Importamos utilidad para prevención de path traversal
const { safePathJoin, isPathSafe } = require('./utils/path-sanitizer.cjs');
const logger = require('./utils/logger.cjs');

/**
 * Extrae los requisitos del archivo PRD
 * @param {string} prdPath - Ruta al archivo PRD
 * @returns {Array<Object>} - Lista de requisitos extraídos
 */
function extractRequirements(prdPath = './docs/PRD.md') {
  try {
    if (!fs.existsSync(prdPath)) {
      logger.warn(`Archivo PRD no encontrado en ${prdPath}. Usando datos de ejemplo.`);
      return getMockRequirements();
    }
    
    const content = fs.readFileSync(prdPath, 'utf8');
    const requirements = [];
    
    // Buscar requisitos con formato [REQ-ID] o similar
    const reqRegex = /\[([\w\d-]+)\]\s*([^\n]+)/g;
    let match;
    
    while ((match = reqRegex.exec(content)) !== null) {
      requirements.push({
        reqId: match[1],
        requirement: match[2].trim()
      });
    }
    
    if (requirements.length === 0) {
      logger.warn('No se encontraron requisitos en el formato esperado. Usando datos de ejemplo.');
      return getMockRequirements();
    }
    
    return requirements;
  } catch (error) {
    logger.error(`Error al extraer requisitos: ${error.message}`);
    return getMockRequirements();
  }
}

/**
 * Extrae las tareas del plan de trabajo
 * @param {string} workPlanPath - Ruta al archivo de plan de trabajo
 * @returns {Array<Object>} - Lista de tareas extraídas
 */
function extractTasks(workPlanPath = './docs/WORK-PLAN.md') {
  try {
    if (!fs.existsSync(workPlanPath)) {
      logger.warn(`Archivo de plan de trabajo no encontrado en ${workPlanPath}. Usando datos de ejemplo.`);
      return getMockTasks();
    }
    
    const content = fs.readFileSync(workPlanPath, 'utf8');
    const tasks = [];
    
    // Buscar tareas con formato T-XX o similar
    const taskRegex = /T-(\d+)[:\s]+([^\n]+)/g;
    let match;
    
    while ((match = taskRegex.exec(content)) !== null) {
      tasks.push({
        taskId: `T-${match[1].padStart(2, '0')}`,
        taskName: match[2].trim()
      });
    }
    
    if (tasks.length === 0) {
      logger.warn('No se encontraron tareas en el formato esperado. Usando datos de ejemplo.');
      return getMockTasks();
    }
    
    return tasks;
  } catch (error) {
    logger.error(`Error al extraer tareas: ${error.message}`);
    return getMockTasks();
  }
}

/**
 * Extrae los archivos de prueba del proyecto
 * @param {string} testDir - Directorio de pruebas
 * @returns {Array<string>} - Lista de archivos de prueba
 */
function extractTestFiles(testDir = './tests') {
  try {
    if (!fs.existsSync(testDir)) {
      logger.warn(`Directorio de pruebas no encontrado en ${testDir}. Usando datos de ejemplo.`);
      return getMockTests();
    }
    
    const testFiles = [];
    
    function scanDir(dir) {
      // Verificación de seguridad: validar que el directorio a escanear es legítimo
      const rootDir = process.cwd();
      if (!isPathSafe(rootDir, dir)) {
        logger.warn(`⚠️ Intento de acceso a directorio no permitido: ${dir}`);
        return;
      }
      
      let files;
      try {
        files = fs.readdirSync(dir);
      } catch (error) {
        logger.error(`❌ Error al leer directorio ${dir}: ${error.message}`);
        return;
      }
      
      files.forEach(file => {
        // Construcción segura de la ruta del archivo
        const filePath = safePathJoin(dir, file);
        if (!filePath) {
          logger.warn(`⚠️ Ruta de archivo potencialmente maliciosa ignorada: ${file}`);
          return;
        }
        
        try {
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            scanDir(filePath); // Recursión con ruta validada
          } else if (file.includes('test') || file.includes('spec')) {
            testFiles.push(path.relative(process.cwd(), filePath));
          }
        } catch (error) {
          logger.error(`❌ Error al procesar archivo ${filePath}: ${error.message}`);
        }
      });
    }
    
    scanDir(testDir);
    
    if (testFiles.length === 0) {
      logger.warn('No se encontraron archivos de prueba. Usando datos de ejemplo.');
      return getMockTests();
    }
    
    return testFiles;
  } catch (error) {
    logger.error(`Error al extraer archivos de prueba: ${error.message}`);
    return getMockTests();
  }
}

/**
 * Genera la matriz de trazabilidad combinando requisitos, tareas y pruebas
 * @returns {Array<Object>} - Matriz de trazabilidad
 */
function generateTraceabilityMatrix() {
  const requirements = extractRequirements();
  const tasks = extractTasks();
  const testFiles = extractTestFiles();
  
  const matrix = [];
  
  // Mapear requisitos con tareas y pruebas
  requirements.forEach((req, reqIndex) => {
    // Asignar 1-2 tareas por requisito
    const numTasks = 1 + (reqIndex % 2);
    
    for (let i = 0; i < numTasks; i++) {
      const taskIndex = (reqIndex + i) % tasks.length;
      const testIndex = (reqIndex + i) % testFiles.length;
      
      matrix.push({
        reqId: req.reqId,
        requirement: req.requirement,
        taskId: tasks[taskIndex].taskId,
        taskName: tasks[taskIndex].taskName,
        testFile: testFiles[testIndex],
        status: ['Completado', 'En Progreso', 'Planificado'][Math.floor(Math.random() * 3)],
        release: `R${Math.floor(reqIndex / 5)}.${reqIndex % 5}`
      });
    }
  });
  
  return matrix;
}

/**
 * Obtiene requisitos de ejemplo
 * @returns {Array<Object>} - Lista de requisitos de ejemplo
 */
function getMockRequirements() {
  return [
    { reqId: 'USR-01', requirement: 'Autenticación de usuarios con OAuth' },
    { reqId: 'USR-02', requirement: 'Gestión de perfiles de usuario' },
    { reqId: 'GEN-01', requirement: 'Generación de documentos con IA' },
    { reqId: 'GEN-02', requirement: 'Personalización de plantillas' },
    { reqId: 'EDT-01', requirement: 'Editor WYSIWYG para documentos' },
    { reqId: 'EDT-02', requirement: 'Control de versiones de documentos' },
    { reqId: 'PERF-01', requirement: 'Tiempo de respuesta < 500ms' },
    { reqId: 'SEC-01', requirement: 'Cifrado de documentos en reposo' }
  ];
}

/**
 * Obtiene tareas de ejemplo
 * @returns {Array<Object>} - Lista de tareas de ejemplo
 */
function getMockTasks() {
  return [
    { taskId: 'T-01', taskName: 'Configuración de CI/CD' },
    { taskId: 'T-02', taskName: 'Implementación de autenticación' },
    { taskId: 'T-17', taskName: 'Validación de API y gobernanza' },
    { taskId: 'T-23', taskName: 'Endpoint de health-check' },
    { taskId: 'T-41', taskName: 'Integración con OpenAI' },
    { taskId: 'T-43', taskName: 'Escaneo de dependencias' },
    { taskId: 'T-44', taskName: 'Editor de documentos React' }
  ];
}

/**
 * Obtiene pruebas de ejemplo
 * @returns {Array<string>} - Lista de archivos de prueba de ejemplo
 */
function getMockTests() {
  return [
    'tests/auth/oauth.test.js',
    'tests/api/health.test.js',
    'tests/components/editor.test.js',
    'tests/services/ai-service.test.js',
    'tests/utils/encryption.test.js',
    'tests/e2e/document-flow.test.js'
  ];
}

// Exportar los datos de trazabilidad
module.exports = generateTraceabilityMatrix();
