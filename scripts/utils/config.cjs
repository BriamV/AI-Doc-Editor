/**
 * Configuración centralizada para scripts de AI-Doc-Editor
 * Define rutas, comandos y configuraciones compartidas
 *
 * @module config
 */

const path = require('path');

// Directorio raíz del proyecto (relativo a este archivo)
const rootDir = path.resolve(__dirname, '../../');

/**
 * Rutas importantes del proyecto
 */
const paths = {
  root: rootDir,
  dist: path.join(rootDir, 'dist'),
  src: path.join(rootDir, 'src'),
  tests: path.join(rootDir, 'tests'),
  e2e: path.join(rootDir, 'cypress'),
  docs: path.join(rootDir, '.taskmaster/docs'),
  reports: path.join(rootDir, 'reports'),
};

/**
 * Comandos para las diferentes operaciones
 */
const commands = {
  // Comandos de desarrollo - Usar comandos directos de Vite/npm scripts
  dev: 'npx vite',
  build: 'npx vite build',
  preview: 'npx vite preview',

  // Comandos de pruebas - Usar comandos directos de Jest/Cypress
  test: 'npx jest',
  testWatch: 'npx jest --watch',
  testCoverage: 'npx jest --coverage',
  testE2E: 'npx cypress run',
  testE2EOpen: 'npx cypress open',

  // Comandos de calidad - Usando binarios locales para mayor compatibilidad
  lint: './node_modules/.bin/eslint --max-warnings=0 src/**/*.{js,jsx,ts,tsx}',
  lintFix: './node_modules/.bin/eslint --fix src/**/*.{js,jsx,ts,tsx}',
  format: './node_modules/.bin/prettier --write src/**/*.{js,jsx,ts,tsx,json,css,scss,md}',
  formatCheck: './node_modules/.bin/prettier --check src/**/*.{js,jsx,ts,tsx,json,css,scss,md}',
  tscCheck: './node_modules/.bin/tsc --noEmit', // Binario local de TypeScript

  // Comandos de seguridad - Usar comandos directos de npm/yarn
  audit: 'npm audit',
  auditFix: 'npm audit fix',
  licenseCheck: 'license-checker-rseidelsohn --production --json --out reports/licenses.json',

  // Comandos de gobernanza - Usar rutas directas a los scripts
  apiSpec: 'npx redocly lint',
  traceability: 'node scripts/generate-traceability.cjs',
  traceabilityXlsx: 'node scripts/generate-traceability.cjs --format=xlsx',
  traceabilityJson: 'node scripts/generate-traceability.cjs --format=json',
  traceabilityMd: 'node scripts/generate-traceability.cjs --format=md',

  // Comandos de Docker
  dockerDev: 'docker-compose up app-dev',
  dockerProd: 'docker-compose --profile production up app-prod',
  dockerBackend: 'docker-compose --profile backend up',
  dockerStop: 'docker-compose down',
  dockerLogs: 'docker-compose logs -f',

  // Comandos de mantenimiento
  clean: 'rimraf node_modules/.cache dist coverage reports/licenses.json',

  // Comandos de Electron - Usar comandos directos de Electron
  electron: 'npx electron .',
  electronPack: 'npx electron-builder --dir',
  electronMake: 'npx electron-builder build',
};

/**
 * Pasos de Quality Gate
 */
const qaGateSteps = [
  {
    name: 'TypeScript Check',
    command: commands.tscCheck,
    stopOnError: true,
    successMessage: 'TypeScript check completado correctamente.',
    errorMessage: 'TypeScript check falló. Por favor, corrige los errores antes de continuar.',
  },
  {
    name: 'ESLint',
    command: commands.lint,
    stopOnError: true,
    successMessage: 'ESLint completado sin errores ni warnings.',
    errorMessage: 'ESLint encontró problemas. Por favor, corrige los errores antes de continuar.',
  },
  {
    name: 'Prettier Format Check',
    command: commands.formatCheck,
    stopOnError: true,
    successMessage: 'Prettier format check completado correctamente.',
    errorMessage: 'Prettier format check falló. Por favor, formatea el código antes de continuar.',
  },
  {
    name: 'Unit Tests',
    command: commands.test,
    stopOnError: true,
    successMessage: 'Pruebas unitarias completadas correctamente.',
    errorMessage: 'Pruebas unitarias fallaron. Por favor, corrige los errores antes de continuar.',
  },
  {
    name: 'Build Verification',
    command: commands.build,
    stopOnError: true,
    successMessage: 'Build verificado correctamente.',
    errorMessage: 'Build falló. Por favor, corrige los errores antes de continuar.',
  },
  {
    name: 'Security Scan',
    command: 'node scripts/security-scan.cjs',
    stopOnError: false,
    successMessage: 'Security scan completado.',
    errorMessage: 'Security scan encontró problemas. Revisa el reporte para más detalles.',
  },
];

/**
 * Configuración de seguridad
 */
const securityConfig = {
  // Nivel de severidad para bloquear el proceso (low, moderate, high, critical)
  auditLevel: 'critical',

  // Rutas para informes
  licenseReport: path.join(paths.reports, 'licenses.json'),

  // Configuración de licencias
  licenseOptions: {
    // Licencias permitidas
    allow: [
      'MIT',
      'ISC',
      'BSD',
      'Apache-2.0',
      'CC0-1.0',
      'Unlicense',
      'BSD-2-Clause',
      'BSD-3-Clause',
    ],
    // Licencias que requieren revisión
    review: ['GPL', 'LGPL', 'MPL', 'CDDL', 'EPL'],
  },
};

/**
 * Configuración de gobernanza
 */
const governanceConfig = {
  // Rutas para documentos de gobernanza
  apiSpecPath: path.join(paths.docs, 'api-spec'),
  traceabilityPath: path.join(paths.docs, 'traceability'),

  // Configuración de tareas
  tasks: {
    t01: {
      name: 'Baseline & CI/CD',
      components: [
        { id: 'T-01.1', name: 'GitHub Actions CI/CD pipeline', status: 'done' },
        { id: 'T-01.2', name: 'ADR template structure + CODEOWNERS', status: 'done' },
        { id: 'T-01.3', name: 'Quality gates (ESLint, Prettier, TypeScript)', status: 'done' },
        { id: 'T-01.4', name: 'Makefile for development commands', status: 'done' },
        { id: 'T-01.5', name: 'Docker-compose setup (Docker files ready)', status: 'done' },
        { id: 'T-01.6', name: 'Pydantic v2 migration', status: 'deferred' },
      ],
    },
    r0wp1: {
      name: 'Core Backend & Security Foundation',
      tasks: [
        { id: 'T-01', name: 'Baseline & CI/CD', status: 'done', progress: 83 },
        { id: 'T-17', name: 'API-SPEC & ADR Governance', status: 'done', progress: 100 },
        { id: 'T-23', name: 'Health-check API (/healthz endpoint)', status: 'done', progress: 100 },
        { id: 'T-43', name: 'Implementar Escaneo de Dependencias', status: 'done', progress: 100 },
      ],
    },
  },
};

module.exports = {
  paths,
  commands,
  qaGateSteps,
  securityConfig,
  governanceConfig,
};
