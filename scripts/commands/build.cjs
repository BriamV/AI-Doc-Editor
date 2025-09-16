/**
 * Comandos de construcción para AI-Doc-Editor
 * Implementa funcionalidades específicas para la construcción del proyecto
 * 
 * @module build
 */

const logger = require('../utils/logger.cjs');
const { execute } = require('../utils/executor.cjs');
const config = require('../utils/config.cjs');
const path = require('path');
const fs = require('fs');

/**
 * Construye la aplicación para producción
 * @param {Array<string>} args - Argumentos adicionales
 */
function buildApp(args = []) {
  const startTime = Date.now();
  logger.title('Construcción de la Aplicación');
  logger.task('Generando build de producción optimizado...');
  
  execute(
    config.commands.build,
    { stdio: 'inherit' },
    null,
    'Error al construir la aplicación.'
  );
  
  const endTime = Date.now();
  const buildTime = ((endTime - startTime) / 1000).toFixed(2);
  
  logger.success(`Construcción completada en ${buildTime} segundos.`);
  logger.info('Los archivos de construcción están disponibles en el directorio "dist".');
}

/**
 * Construye la aplicación con análisis de bundle
 * @param {Array<string>} args - Argumentos adicionales
 */
function buildWithAnalyze(args = []) {
  logger.title('Construcción con Análisis de Bundle');
  logger.task('Generando build con análisis de tamaño de bundle...');
  
  execute(
    'yarn build --analyze',
    { stdio: 'inherit' },
    'Construcción y análisis completados correctamente.',
    'Error al construir la aplicación con análisis.'
  );
  
  logger.info('El informe de análisis del bundle está disponible en el navegador.');
}

/**
 * Construye la aplicación para modo desarrollo
 * @param {Array<string>} args - Argumentos adicionales
 */
function buildDev(args = []) {
  logger.title('Construcción para Desarrollo');
  logger.task('Generando build de desarrollo...');
  
  execute(
    'yarn build:dev',
    { stdio: 'inherit' },
    'Construcción de desarrollo completada correctamente.',
    'Error al construir la aplicación para desarrollo.'
  );
}

/**
 * Construye la documentación técnica del proyecto en formatos adecuados para desarrollo
 * @param {Array<string>} args - Argumentos adicionales
 *   - --format=<md|json|html> - Formato de salida (por defecto: md)
 *   - --api - Genera documentación de API
 *   - --components - Genera documentación de componentes
 */
function buildDocs(args = []) {
  logger.title('Construcción de Documentación Técnica');
  
  // Analizar argumentos
  const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'md';
  const includeApi = args.includes('--api');
  const includeComponents = args.includes('--components');
  const includeAll = !includeApi && !includeComponents; // Si no se especifica, incluir todo
  
  // Crear directorio de documentación técnica si no existe
  const docsDir = path.join(process.cwd(), 'docs', 'technical');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Generar documentación de API si se solicita
  if (includeApi || includeAll) {
    logger.task('Generando documentación de API...');
    execute(
      'npx openapi-typescript-codegen --input ./src/api/openapi.yaml --output ./docs/technical/api',
      { stdio: 'inherit' },
      'Documentación de API generada correctamente.',
      'Error al generar la documentación de API.'
    );
    
    // Convertir OpenAPI a formato solicitado si no es JSON
    if (format !== 'json') {
      logger.task(`Convirtiendo documentación de API a formato ${format}...`);
      execute(
        `npx widdershins --language_tabs 'javascript:JavaScript' 'typescript:TypeScript' --summary ./src/api/openapi.yaml -o ./docs/technical/api/README.${format}`,
        { stdio: 'inherit' },
        `Documentación de API convertida a ${format}.`,
        `Error al convertir la documentación de API a ${format}.`
      );
    }
  }
  
  // Generar documentación de componentes si se solicita
  if (includeComponents || includeAll) {
    logger.task('Generando documentación de componentes React...');
    execute(
      'npx react-docgen ./src/components --output ./docs/technical/components.json',
      { stdio: 'inherit' },
      'Documentación de componentes generada correctamente.',
      'Error al generar la documentación de componentes.'
    );
    
    // Convertir documentación de componentes a Markdown si se solicita
    if (format === 'md') {
      logger.task('Convirtiendo documentación de componentes a Markdown...');
      execute(
        'node ./scripts/utils/json-to-markdown.js ./docs/technical/components.json ./docs/technical/components.md',
        { stdio: 'inherit' },
        'Documentación de componentes convertida a Markdown.',
        'Error al convertir la documentación de componentes a Markdown.'
      );
    }
  }
  
  // Generar índice de documentación técnica
  logger.task('Generando índice de documentación técnica...');
  const indexContent = `# Documentación Técnica de AI-Doc-Editor

## Contenido

${includeApi || includeAll ? '- [Documentación de API](./api/README.md)\n' : ''}
${includeComponents || includeAll ? '- [Documentación de Componentes](./components.md)\n' : ''}

## Generado

Esta documentación fue generada automáticamente el ${new Date().toISOString()} usando \`yarn run cmd build-docs\`.
`;
  
  fs.writeFileSync(path.join(docsDir, 'README.md'), indexContent);
  
  logger.success('Documentación técnica generada correctamente.');
  logger.info(`La documentación está disponible en el directorio "docs/technical" en formato ${format.toUpperCase()}.`);
  logger.info('Puedes visualizarla en tu editor de código o navegador web.');
}

/**
 * Construye la aplicación para diferentes entornos
 * @param {Array<string>} args - Argumentos adicionales
 */
function buildEnv(args = []) {
  const env = args[0] || 'production';
  const validEnvs = ['development', 'staging', 'production'];
  
  if (!validEnvs.includes(env)) {
    logger.error(`Entorno no válido: ${env}`);
    logger.info(`Entornos válidos: ${validEnvs.join(', ')}`);
    process.exit(1);
  }
  
  logger.title(`Construcción para Entorno: ${env}`);
  logger.task(`Generando build para ${env}...`);
  
  // Establecer variable de entorno
  const envCmd = process.platform === 'win32' 
    ? `set NODE_ENV=${env} && yarn build`
    : `NODE_ENV=${env} yarn build`;
  
  execute(
    envCmd,
    { stdio: 'inherit' },
    `Construcción para ${env} completada correctamente.`,
    `Error al construir la aplicación para ${env}.`
  );
}

/**
 * Construye y empaqueta la aplicación Electron
 * @param {Array<string>} args - Argumentos adicionales
 */
function buildElectron(args = []) {
  logger.title('Construcción de Aplicación Electron');
  
  // Construir aplicación web primero
  logger.task('1/2 Construyendo aplicación web...');
  const webBuildSuccess = execute(
    config.commands.build,
    { stdio: 'inherit' },
    'Aplicación web construida correctamente.',
    'Error al construir la aplicación web.',
    false // No salir en caso de error
  );
  
  if (!webBuildSuccess) {
    logger.error('No se puede continuar con el empaquetado de Electron debido a errores en la construcción web.');
    process.exit(1);
  }
  
  // Empaquetar aplicación Electron
  logger.task('2/2 Empaquetando aplicación Electron...');
  execute(
    config.commands.electronMake,
    { stdio: 'inherit' },
    'Aplicación Electron empaquetada correctamente.',
    'Error al empaquetar la aplicación Electron.'
  );
  
  logger.info('Los archivos de distribución están disponibles en el directorio "release".');
}

module.exports = {
  buildApp,
  buildWithAnalyze,
  buildDev,
  buildDocs,
  buildEnv,
  buildElectron
};
