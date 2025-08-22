/**
 * Custom Jest transformer to handle import.meta.env
 */

const { createTransformer } = require('@swc/jest');

const transformer = createTransformer({
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
      decorators: false,
    },
    transform: {
      react: {
        runtime: 'automatic',
      },
    },
    target: 'es2020',
  },
});

module.exports = {
  process(sourceText, sourcePath, options) {
    // Transform import.meta.env to process.env equivalent for Jest
    const transformedSource = sourceText
      .replace(/import\.meta\.env\.VITE_/g, 'process.env.VITE_')
      .replace(/import\.meta\.env/g, 'process.env');
    
    return transformer.process(transformedSource, sourcePath, options);
  },
};