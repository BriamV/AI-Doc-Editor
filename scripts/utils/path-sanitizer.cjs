/**
 * @file path-sanitizer.cjs
 * @description Utilidades para validar y sanitizar rutas, previniendo ataques de path traversal
 */

const path = require('path');
const fs = require('fs');

/**
 * Verifica si una ruta es segura (no intenta hacer traversal fuera del directorio base)
 * @param {string} basePath - Directorio base autorizado
 * @param {string} relativePath - Ruta relativa a validar
 * @returns {boolean} - true si es segura, false si intenta traversal
 */
function isPathSafe(basePath, relativePath) {
  // Normalizar las rutas para manejar diferentes formatos
  const normalizedBase = path.normalize(basePath);
  
  // Construir la ruta absoluta destino
  const targetPath = path.resolve(normalizedBase, relativePath);
  
  // Verificar si la ruta resultante sigue dentro del directorio base
  return targetPath.startsWith(normalizedBase);
}

/**
 * Sanitiza un componente de ruta para prevenir path traversal
 * @param {string} pathComponent - Componente de ruta a sanitizar 
 * @returns {string} - Componente sanitizado, removiendo caracteres peligrosos
 */
function sanitizePath(pathComponent) {
  if (!pathComponent) return '';
  
  // Eliminar caracteres especiales y secuencias de escape
  const sanitized = pathComponent
    .replace(/\.\./g, '') // Eliminar secuencias de subir directorio
    .replace(/[\/\\]/g, '') // Eliminar separadores de directorio
    .replace(/[<>:"|?*]/g, ''); // Eliminar caracteres especiales no permitidos en rutas
    
  return sanitized;
}

/**
 * Une rutas de forma segura, previniendo path traversal
 * @param {string} basePath - Directorio base autorizado
 * @param {...string} parts - Componentes de ruta a unir
 * @returns {string|null} - Ruta unida si es segura, null si se detecta un intento de traversal
 */
function safePathJoin(basePath, ...parts) {
  // Normalizar y resolver la ruta base
  const normalizedBase = path.normalize(basePath);
  
  // Sanitizar cada componente
  const sanitizedParts = parts.map(part => {
    // Si es string, sanitizar
    if (typeof part === 'string') {
      // Si empieza con ../ o ..\ es un intento de traversal
      if (part.startsWith('../') || part.startsWith('..\\')) {
        return null; // Indica un posible intento malicioso
      }
      // Para otros casos, preservamos pero aseguramos no subir de directorio
      return part.replace(/\.\./g, '');
    }
    return '';
  });
  
  // Si algún componente es null, se detectó un intento de traversal
  if (sanitizedParts.includes(null)) {
    return null;
  }
  
  // Unir las partes
  const joined = path.join(normalizedBase, ...sanitizedParts);
  
  // Verificar que la ruta resultante sigue dentro del directorio base
  if (!joined.startsWith(normalizedBase)) {
    return null; // Intento de escapar del directorio base
  }
  
  return joined;
}

/**
 * Valida que un script solicitado esté en un directorio permitido
 * @param {string} baseDir - Directorio base donde se buscan los scripts
 * @param {string} scriptPath - Ruta al script solicitado
 * @param {Array<string>} allowedDirs - Lista de subdirectorios permitidos dentro de baseDir
 * @returns {string|null} - Ruta absoluta segura si es válida, null si no lo es
 */
function validateScriptPath(baseDir, scriptPath, allowedDirs = ['commands', 'utils']) {
  // Normalizar ruta base
  const normalizedBase = path.normalize(baseDir);
  
  // Verificar que no hay intentos de traversal en el scriptPath
  if (scriptPath.includes('..')) {
    return null;
  }
  
  // Si el script no tiene extensión, añadir .cjs por default
  const scriptWithExt = scriptPath.endsWith('.cjs') ? scriptPath : `${scriptPath}.cjs`;
  
  // Para rutas relativas simples, verificar si están en directorios permitidos
  if (!scriptPath.includes('/') && !scriptPath.includes('\\')) {
    // Buscar en los directorios permitidos
    for (const dir of allowedDirs) {
      const fullPath = path.join(normalizedBase, dir, scriptWithExt);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  } else {
    // Para rutas con directorios, validar que solo usen directorios permitidos
    const parts = scriptPath.split(/[\/\\]/);
    if (allowedDirs.includes(parts[0])) {
      const fullPath = path.join(normalizedBase, scriptWithExt);
      if (fs.existsSync(fullPath) && isPathSafe(normalizedBase, scriptWithExt)) {
        return fullPath;
      }
    }
  }
  
  return null;
}

module.exports = {
  isPathSafe,
  sanitizePath,
  safePathJoin,
  validateScriptPath
};
