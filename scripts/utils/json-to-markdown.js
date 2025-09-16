#!/usr/bin/env node
/**
 * Utilidad para convertir documentación JSON a formato Markdown
 * 
 * Este script convierte documentación de componentes en formato JSON
 * a un archivo Markdown estructurado y fácil de leer en editores de código.
 * 
 * Uso: node json-to-markdown.js <archivo-entrada.json> <archivo-salida.md>
 */

const fs = require('fs');
const path = require('path');

// Validar argumentos
if (process.argv.length < 4) {
  console.error('❌ Error: Faltan argumentos');
  console.log('📋 Uso: node json-to-markdown.js <archivo-entrada.json> <archivo-salida.md>');
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

// Verificar que el archivo de entrada existe
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Error: El archivo ${inputFile} no existe`);
  process.exit(1);
}

try {
  // Leer y parsear el archivo JSON
  const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  // Generar contenido Markdown
  let mdContent = '# Documentación de Componentes\n\n';
  mdContent += `> Generado automáticamente el ${new Date().toISOString()}\n\n`;
  mdContent += '## Índice\n\n';
  
  // Crear índice de componentes
  Object.keys(jsonData).forEach(componentPath => {
    const componentName = path.basename(componentPath, path.extname(componentPath));
    mdContent += `- [${componentName}](#${componentName.toLowerCase()})\n`;
  });
  
  mdContent += '\n---\n\n';
  
  // Documentar cada componente
  Object.entries(jsonData).forEach(([componentPath, componentInfo]) => {
    const componentName = path.basename(componentPath, path.extname(componentPath));
    
    mdContent += `## ${componentName}\n\n`;
    mdContent += `**Ruta:** \`${componentPath}\`\n\n`;
    
    if (componentInfo.description) {
      mdContent += `**Descripción:** ${componentInfo.description}\n\n`;
    }
    
    // Documentar props
    if (componentInfo.props && Object.keys(componentInfo.props).length > 0) {
      mdContent += '### Props\n\n';
      mdContent += '| Nombre | Tipo | Requerido | Valor por defecto | Descripción |\n';
      mdContent += '|--------|------|-----------|-------------------|-------------|\n';
      
      Object.entries(componentInfo.props).forEach(([propName, propInfo]) => {
        const type = propInfo.type?.name || 'any';
        const required = propInfo.required ? '✓' : '';
        const defaultValue = propInfo.defaultValue?.value || '';
        const description = propInfo.description || '';
        
        mdContent += `| ${propName} | \`${type}\` | ${required} | ${defaultValue} | ${description} |\n`;
      });
      
      mdContent += '\n';
    }
    
    // Documentar métodos
    if (componentInfo.methods && componentInfo.methods.length > 0) {
      mdContent += '### Métodos\n\n';
      
      componentInfo.methods.forEach(method => {
        mdContent += `#### ${method.name}()\n\n`;
        
        if (method.description) {
          mdContent += `${method.description}\n\n`;
        }
        
        if (method.params && method.params.length > 0) {
          mdContent += '**Parámetros:**\n\n';
          method.params.forEach(param => {
            mdContent += `- \`${param.name}\` (\`${param.type?.name || 'any'}\`): ${param.description || ''}\n`;
          });
          mdContent += '\n';
        }
        
        if (method.returns) {
          mdContent += `**Retorna:** \`${method.returns.type?.name || 'void'}\` ${method.returns.description || ''}\n\n`;
        }
      });
    }
    
    // Añadir ejemplos de uso si existen
    if (componentInfo.examples && componentInfo.examples.length > 0) {
      mdContent += '### Ejemplos\n\n';
      
      componentInfo.examples.forEach((example, index) => {
        mdContent += `#### Ejemplo ${index + 1}\n\n`;
        mdContent += '```jsx\n';
        mdContent += example;
        mdContent += '\n```\n\n';
      });
    }
    
    mdContent += '---\n\n';
  });
  
  // Escribir el archivo Markdown
  fs.writeFileSync(outputFile, mdContent);
  console.log(`✅ Documentación convertida exitosamente a ${outputFile}`);
  
} catch (error) {
  console.error(`❌ Error al procesar el archivo: ${error.message}`);
  process.exit(1);
}
