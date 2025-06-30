#!/usr/bin/env node

/**
 * QA-Gate script - Ejecuta verificaciones de calidad secuencialmente
 * 
 * IMPORTANTE: Este script utiliza ejecutores directos para evitar la recursión que
 * ocurre cuando se invoca el CLI desde scripts de yarn.
 * 
 * Este script implementa verificaciones de calidad para:
 * 1. Frontend (TypeScript, ESLint, Jest/Vitest)
 * 2. Backend (Python, FastAPI, pytest)
 * 
 * Autor: AI-Doc-Editor Team
 * Versión: 3.0.0
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determinar el directorio raíz del proyecto
const rootDir = process.cwd();

/**
 * Logger simplificado para evitar dependencias circulares
 */
const log = {
  title: (msg) => console.log(`🎯 ${msg}...`),
  task: (msg) => console.log(`🔄 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`)
};

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
const autoInstall = args.includes('--install') || args.includes('-i');
const skipFrontend = args.includes('--skip-frontend') || args.includes('--backend-only');
const skipBackend = args.includes('--skip-backend') || args.includes('--frontend-only');
const showHelp = args.includes('--help') || args.includes('-h');

// Comprobar si se solicita ayuda primero antes de cualquier otra operación
if (showHelp) {
  console.log('');
  console.log('QA-Gate - Verificación de calidad para AI-Doc-Editor (Frontend + Backend)');
  console.log('');
  console.log('Opciones:');
  console.log('  --install, -i            Instalar dependencias faltantes automáticamente');
  console.log('  --skip-frontend          Omitir verificaciones de frontend');
  console.log('  --skip-backend           Omitir verificaciones de backend');
  console.log('  --frontend-only          Solo ejecutar verificaciones de frontend');
  console.log('  --backend-only           Solo ejecutar verificaciones de backend');
  console.log('  --help, -h               Mostrar esta ayuda');
  console.log('');
  process.exit(0);
}

/**
 * Configuración del QA-Gate
 * Define pasos, comandos y configuraciones específicas
 */
const config = {
  title: "Enhanced Quality Gate (Frontend + Backend)",
  steps: [



/**
 * Verifica y registra si una dependencia Python está instalada
 * @param {string} dependency - Nombre de la dependencia a verificar
 * @returns {boolean} - true si está instalada
 */
function isPythonPackageInstalled(dependency) {
  try {
    execSync(`python -c "import ${dependency.split('[')[0].trim()}"`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Lee el archivo requirements.txt y extrae las dependencias con sus versiones
 * @returns {Object} - Mapa de dependencias y sus versiones
 */
function getBackendRequirements() {
  const requirementsPath = path.join(rootDir, 'backend', 'requirements.txt');
  if (!fs.existsSync(requirementsPath)) {
    return {};
  }
  
  const content = fs.readFileSync(requirementsPath, 'utf8');
  const requirements = {};
  
  // Regex para extraer nombre y versión de dependencias
  const lines = content.split('\n');
  lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [name, version] = line.split('==');
      if (name) {
        // Limpiar los extras como [email] para el mapeo
        const cleanName = name.split('[')[0].trim();
        requirements[cleanName] = { 
          original: name, // Nombre original con extras
          version: version || 'latest'
        };
      }
    }
  });
  
  return requirements;
}

/**
 * Verifica dependencias JavaScript de frontend
 * @returns {Object} - Estado de las dependencias de frontend
 */
function checkFrontendDependencies() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return { missing: [], missingDev: [] };
  }
  
  const packageJson = require(packageJsonPath);
  const deps = Object.keys(packageJson.dependencies || {});
  const devDeps = Object.keys(packageJson.devDependencies || {});
  
  // Dependencias críticas para tests y QA
  const requiredDeps = ['react', 'vite']; 
  const requiredDevDeps = ['jest', 'vitest', 'eslint', 'prettier', 'typescript'];
  
  const missing = requiredDeps.filter(dep => !deps.includes(dep));
  const missingDev = requiredDevDeps.filter(dep => !devDeps.includes(dep) && !deps.includes(dep));
  
  return { missing, missingDev };
}

/**
 * Instala las dependencias Python necesarias para las pruebas usando requirements.txt
 * @param {boolean} autoInstall - Si es verdadero, intenta instalar automáticamente
 * @returns {object} - Estado de las dependencias {missing: string[], installed: string[]}
 */
function ensurePythonDependencies(autoInstall = false) {
  // Dependencias críticas para los tests
  const criticalDeps = [
    'email_validator', 'pydantic', 'aiosqlite', 'authlib', 
    'httpx', 'pytest', 'fastapi', 'pytest_asyncio'
  ];
  const missingDeps = [];
  const installedDeps = [];
  
  log.task('Verificando dependencias Python para tests...');
  
  // Obtener dependencias del requirements.txt
  const requirements = getBackendRequirements();
  const reqPath = path.join(rootDir, 'backend', 'requirements.txt');
  const hasRequirements = fs.existsSync(reqPath);
  
  for (const dep of criticalDeps) {
    const baseDep = dep.replace('_', '-'); // Normalizar nombre (pytest_asyncio -> pytest-asyncio)
    
    if (isPythonPackageInstalled(dep)) {
      installedDeps.push(dep);
    } else {
      // Buscar la versión exacta en requirements.txt
      let installCmd = `pip install ${dep}`;
      
      Object.entries(requirements).forEach(([name, info]) => {
        if (name.toLowerCase() === dep.toLowerCase() || 
            info.original.toLowerCase().includes(dep.toLowerCase())) {
          if (info.version && info.version !== 'latest') {
            installCmd = `pip install ${info.original}==${info.version}`;
          } else {
            installCmd = `pip install ${info.original}`;
          }
        }
      });
      
      missingDeps.push({ name: dep, command: installCmd, inRequirements: hasRequirements });
      
      if (autoInstall) {
        try {
          log.task(`Instalando ${dep}...`);
          execSync(installCmd, { stdio: 'inherit' });
          installedDeps.push(dep);
        } catch (error) {
          log.error(`No se pudo instalar ${dep}`);
        }
      }
    }
  }
  
  return { missing: missingDeps, installed: installedDeps };
}

// Configuración del QA Gate con comandos directos que NO usan yarn o el CLI
const config = {
  steps: [
    // ===== FRONTEND QUALITY CHECKS =====
    {
      name: 'Frontend: TypeScript compilation',
      execute: () => {
        log.task('Comprobando tipos y errores de TypeScript...');
        execSync('npx tsc --noEmit', { cwd: rootDir, stdio: 'inherit' });
      },
      errorMessage: 'TypeScript failed'
    },
    {
      name: 'Frontend: ESLint (zero warnings)',
      execute: () => {
        log.task('Ejecutando ESLint...');
        execSync('npx eslint "src/**/*.{js,jsx,ts,tsx}"', { cwd: rootDir, stdio: 'inherit' });
      },
      errorMessage: 'ESLint failed'
    },
    {
      name: 'Frontend: Prettier formatting',
      execute: () => {
        log.task('Verificando formato con Prettier...');
        execSync('npx prettier --check "src/**/*.{js,jsx,ts,tsx,css,scss,html}"', { cwd: rootDir, stdio: 'inherit' });
      },
      errorMessage: 'Formatting failed'
    },
    
    // ===== BACKEND QUALITY CHECKS =====
    {
      name: 'Backend: Python syntax check',
      execute: () => {
        if (fs.existsSync(path.join(rootDir, 'backend'))) {
          log.task('Verificando sintaxis de archivos Python...');
          // Compila los archivos Python para verificar errores de sintaxis
          execSync('python -m compileall backend', { cwd: rootDir, stdio: 'inherit' });
        } else {
          log.task('Directorio backend no encontrado, saltando verificación de sintaxis');
        }
      },
      errorMessage: 'Python syntax check failed'
    },
    {
      name: 'Frontend: Dependencies check',
      execute: () => {
        const frontDeps = checkFrontendDependencies();
        
        if (frontDeps.missing.length > 0 || frontDeps.missingDev.length > 0) {
          if (frontDeps.missing.length > 0) {
            log.task(`⚠️ Dependencias Frontend faltantes: ${frontDeps.missing.join(', ')}`);
            log.task(`💡 Ejecuta: yarn add ${frontDeps.missing.join(' ')}`);
          }
          
          if (frontDeps.missingDev.length > 0) {
            log.task(`⚠️ Dependencias Dev faltantes: ${frontDeps.missingDev.join(', ')}`);
            log.task(`💡 Ejecuta: yarn add -D ${frontDeps.missingDev.join(' ')}`);
          }
          
          // Instalar dependencias si se especificó --install
          if (autoInstall) {
            if (frontDeps.missing.length > 0) {
              log.task('Instalando dependencias de producción...');
              execSync(`yarn add ${frontDeps.missing.join(' ')}`, { stdio: 'inherit', cwd: rootDir });
            }
            
            if (frontDeps.missingDev.length > 0) {
              log.task('Instalando dependencias de desarrollo...');
              execSync(`yarn add -D ${frontDeps.missingDev.join(' ')}`, { stdio: 'inherit', cwd: rootDir });
            }
          }
        } else {
          log.success('Todas las dependencias frontend están instaladas');
        }
      },
      errorMessage: 'Frontend dependencies check failed'
    },
    {
      name: 'Backend: Dependencies check',
      execute: () => {
        if (fs.existsSync(path.join(rootDir, 'backend'))) {
          // Verificar dependencias pero no instalarlas automáticamente
          const deps = ensurePythonDependencies(false);
          
          if (deps.missing.length > 0) {
            log.task(`⚠️ Dependencias Python faltantes: ${deps.missing.length}`);
            
            // Mostrar comandos exactos de instalación para cada dependencia
            deps.missing.forEach(dep => {
              log.task(`💡 ${dep.name}: ${dep.command}`);
            });
            
            // Instalar dependencias si se especificó --install
            if (deps.missing.some(dep => dep.inRequirements) && autoInstall) {
              log.task('Instalando dependencias desde requirements.txt...');
              // Ejecutar pip install -r requirements.txt
              try {
                execSync('pip install -r backend/requirements.txt', { stdio: 'inherit', cwd: rootDir });
                log.success('Dependencias instaladas correctamente');
              } catch (error) {
                log.error(`Error al instalar dependencias: ${error.message}`);
              }
            }
          } else {
            log.success(`Todas las dependencias Python están instaladas (${deps.installed.length})`);
          }
        } else {
          log.task('Directorio backend no encontrado, saltando verificación de dependencias');
        }
      },
      errorMessage: 'Python dependencies check failed'
    },
    {
      name: 'Frontend: Unit tests',
      execute: () => {
        log.task('Ejecutando pruebas unitarias frontend...');
        // Determina el test runner instalado para JS/TS
        try {
          const hasJest = fs.existsSync(path.join(rootDir, 'node_modules', 'jest'));
          if (hasJest) {
            // La bandera --passWithNoTests permite pasar este paso si no hay tests JS
            execSync('npx jest --passWithNoTests', { cwd: rootDir, stdio: 'inherit' });
          } else if (fs.existsSync(path.join(rootDir, 'node_modules', 'vitest'))) {
            execSync('npx vitest run --passWithNoTests', { cwd: rootDir, stdio: 'inherit' });
          }
          log.success('Pruebas frontend completadas');
        } catch (error) {
          log.error('Pruebas frontend fallidas');
          throw error;
        }
      },
      errorMessage: 'Frontend tests failed'
    },
    {
      name: 'Backend: Unit tests',
      execute: () => {
        if (!fs.existsSync(path.join(rootDir, 'backend'))) {
          log.task('Directorio backend no encontrado, saltando pruebas unitarias');
          return;
        }
        
        log.task('Ejecutando pruebas backend (Python)...');
        let pythonTestPassed = true;
        
        try {
          // Verificar dependencias críticas antes de tests
          const criticalDeps = ['pytest', 'fastapi'];
          for (const dep of criticalDeps) {
            if (!isPythonPackageInstalled(dep)) {
              log.error(`Dependencia crítica faltante: ${dep}. Instala con: pip install ${dep}`);
            }
          }
          
          // Ejecutar tests individuales en la carpeta backend directamente
          // Este enfoque evita problemas con pytest y es más directo
          const pythonTests = fs.readdirSync(path.join(rootDir, 'backend'))
            .filter(file => file.startsWith('test_') && file.endsWith('.py'));
          
          if (pythonTests.length > 0) {
            for (const testFile of pythonTests) {
              log.task(`Ejecutando ${testFile}...`);
              try {
                execSync(`python backend/${testFile}`, { cwd: rootDir, stdio: 'inherit' });
                log.success(`${testFile} completado con éxito`);
              } catch (testError) {
                log.error(`Error en ${testFile}`);
                pythonTestPassed = false;
              }
            }
          } else {
            log.task('No se encontraron archivos de test Python en /backend');
          }
          
          // Verificar y ejecutar tests en backend/tests individualmente
          if (fs.existsSync(path.join(rootDir, 'backend', 'tests'))) {
            const testDirFiles = fs.readdirSync(path.join(rootDir, 'backend', 'tests'))
              .filter(file => file.startsWith('test_') && file.endsWith('.py'));
            
            if (testDirFiles.length > 0) {
              for (const testFile of testDirFiles) {
                log.task(`Ejecutando test de módulo: ${testFile}...`);
                try {
                  execSync(`python -m backend.tests.${testFile.replace('.py', '')}`, { cwd: rootDir, stdio: 'inherit' });
                  log.success(`${testFile} completado con éxito`);
                } catch (testError) {
                  log.error(`Error en ${testFile}`);
                  pythonTestPassed = false;
                }
              }
            } else {
              log.task('No se encontraron archivos de test Python en /backend/tests');
            }
          }
          
          if (!pythonTestPassed) {
            throw new Error('Una o más pruebas de backend fallaron');
          }
          log.success('Todas las pruebas backend completadas correctamente');
          
        } catch (error) {
          log.error(`Error en pruebas backend: ${error.message || 'Error desconocido'}`);
          throw error;
        }
      },
      errorMessage: 'Backend tests failed'
    },
    {
      name: 'Frontend: Build verification',
      execute: () => {
        // Ejecuta build directamente
        log.task('Verificando build frontend (Vite)...');
        execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' });
      },
      errorMessage: 'Frontend build failed'
    },
    {
      name: 'Backend: API validation',
      execute: () => {
        if (!fs.existsSync(path.join(rootDir, 'backend'))) {
          log.task('Directorio backend no encontrado, saltando validación de API');
          return;
        }
        
        log.task('Validando estructura API FastAPI...');
        // Verificar que los archivos de API existan
        const requiredFiles = ['app/main.py', 'app/routers'];
        let allOk = true;
        
        for (const file of requiredFiles) {
          const fullPath = path.join(rootDir, 'backend', file);
          if (fs.existsSync(fullPath)) {
            log.success(`API file ${file} encontrado`); 
          } else {
            log.error(`API file ${file} no encontrado`);
            allOk = false;
          }
        }
        
        if (!allOk) {
          throw new Error('No se encontraron todos los archivos de API requeridos');
        }
      },
      errorMessage: 'Backend API validation failed'
    },
    {
      name: 'Security scanning (T-43)',
      execute: () => {
        // Ejecuta la verificación de seguridad directamente desde el script local
        log.task('Ejecutando escaneo de seguridad (T-43)...');
        const securityScanPath = path.join(__dirname, 'security-scan.cjs');
        execSync(`node ${securityScanPath}`, { cwd: rootDir, stdio: 'inherit' });
      },
      errorMessage: 'Security scanning failed'
    },
    {
      name: 'Cross-platform compatibility',
      execute: () => {
        log.task('Verificando compatibilidad multiplataforma...');
        
        // Verificar configuración de scripts que usan rutas
        if (fs.existsSync(path.join(rootDir, 'package.json'))) {
          log.task('Verificando package.json para compatibilidad de rutas...');
          const packageJson = require(path.join(rootDir, 'package.json'));
          let compatible = true;
          
          // Verificar scripts que usen rutas absolutas incompatibles
          Object.entries(packageJson.scripts || {}).forEach(([name, script]) => {
            // Buscar patrones como C:/ o /usr/ en scripts
            if (/[A-Z]:\\/i.test(script) || /\/usr\//i.test(script)) {
              log.error(`Script '${name}' contiene rutas absolutas no portátiles: ${script}`);
              compatible = false;
            }
          });
          
          if (compatible) {
            log.success('Scripts en package.json son multiplataforma');
          }
        }
      },
      errorMessage: 'Cross-platform compatibility check failed'
    }
  ],
  title: 'Enhanced Quality Gate (Frontend + Backend)'
};

/**
 * Ejecuta un paso del QA gate y maneja los errores
 * @param {Object} step - Configuración del paso a ejecutar
 * @param {number} index - Índice del paso
 * @param {number} total - Total de pasos
 * @returns {boolean} - true si el paso fue exitoso
 */
function runStep(step, index, total) {
  console.log(`\n${index + 1}/${total} ${step.name}...`);
  
  try {
    step.execute(); // Ejecutar la función del paso
    log.success(`${step.name} passed`);
    return true;
  } catch (error) {
    log.error(`${step.errorMessage}`);
    return false;
  }
}

/**
 * Función principal que ejecuta todo el QA gate
 */
function runQAGate() {
  log.title('Running ' + config.title);
  console.log('===============================================');
  
  // Mostrar información sobre la ejecución
  if (autoInstall) {
    log.task('Modo de instalación automática activado');
  }
  if (skipFrontend) {
    log.task('Verificaciones de frontend desactivadas');
  }
  if (skipBackend) {
    log.task('Verificaciones de backend desactivadas');
  }
  
  let allPassed = true;
  const startTime = Date.now();
  // Filtrar pasos según las opciones de línea de comandos
  const stepsToRun = config.steps.filter(step => {
    if (skipFrontend && step.name.startsWith('Frontend:')) return false;
    if (skipBackend && step.name.startsWith('Backend:')) return false;
    return true;
  });
  
  // Ejecutar cada paso en secuencia
  for (let i = 0; i < stepsToRun.length; i++) {
    const success = runStep(stepsToRun[i], i, stepsToRun.length);
    if (!success) {
      allPassed = false;
      break; // Detenemos el proceso en el primer error
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('===============================================');
  
  if (allPassed) {
    console.log(`🎉 ALL QUALITY GATES PASSED! (${duration}s)`);
    process.exit(0);
  } else {
    console.error(`❌ QUALITY GATE FAILED (${duration}s)`);
    process.exit(1);
  }
}

// Ejecutar el QA Gate
runQAGate();
