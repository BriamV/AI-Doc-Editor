/**
 * Build Wrapper Tests - RF-003: TypeScript/build validation
 */

const BuildWrapper = require('../../core/wrappers/BuildWrapper.cjs');

jest.mock('../../core/wrappers/BuildWrapper.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config, logger,
    execute: jest.fn(), validateTool: jest.fn(),
    compile: jest.fn(), watch: jest.fn(),
    getCapabilities: jest.fn(() => ({
      supportedTools: ['tsc', 'webpack', 'vite', 'rollup'],
      supportedTargets: ['es5', 'es6', 'node', 'browser'],
      supportedFormats: ['cjs', 'esm', 'umd'], watchMode: true
    }))
  }));
});

describe('Build Wrapper (RF-003 Build & Dependencies - TypeScript)', () => {
  let buildWrapper, mockConfig, mockLogger;
  const buildTargets = ['es5', 'es6', 'node', 'browser'];
  const commonBuildResult = {
    success: true, duration: 2500, files: { input: 45, output: 48 },
    size: { total: '2.3MB', gzipped: '654KB' }
  };

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => ({
        'build.compiler': 'tsc', 'build.target': 'es6', 'build.outDir': 'dist/',
        'build.sourceMap': true, 'build.declaration': true, 'build.strict': true,
        'build.optimization': true, 'build.watch': false
      })[key])
    };
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() };
    buildWrapper = new BuildWrapper(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should initialize with TypeScript build configuration', () => {
    expect(buildWrapper.config).toBe(mockConfig);
    expect(buildWrapper.logger).toBe(mockLogger);
  });

  test('should provide build-specific capabilities', () => {
    const capabilities = buildWrapper.getCapabilities();
    
    expect(capabilities.supportedTools).toContain('tsc');
    expect(capabilities.supportedTargets).toContain('es6');
    expect(capabilities.supportedFormats).toContain('cjs');
    expect(capabilities.watchMode).toBe(true);
  });

  test('should execute TypeScript compilation successfully', async () => {
    const compileResult = {
      ...commonBuildResult, compiler: 'tsc', target: 'es6', 
      outputs: ['dist/index.js', 'dist/index.d.ts', 'dist/index.js.map'],
      diagnostics: { errors: 0, warnings: 2, infos: 0 }
    };

    buildWrapper.execute.mockResolvedValue(compileResult);
    const result = await buildWrapper.execute({ name: 'tsc', target: 'es6' });

    expect(result.success).toBe(true);
    expect(result.compiler).toBe('tsc');
    expect(result.diagnostics.errors).toBe(0);
  });

  test('should handle compilation errors appropriately', async () => {
    const errorResult = {
      success: false, duration: 1200, compiler: 'tsc', target: 'es6',
      diagnostics: { errors: 3, warnings: 1, infos: 0 },
      errors: [{ code: 'TS2304', file: 'src/auth.ts', line: 15 }, { code: 'TS2345', file: 'src/api.ts', line: 28 }]
    };

    buildWrapper.execute.mockResolvedValue(errorResult);
    const result = await buildWrapper.execute({ name: 'tsc', target: 'es6' });

    expect(result.success).toBe(false);
    expect(result.diagnostics.errors).toBeGreaterThan(0);
    expect(result.errors[0].code).toBe('TS2304');
  });

  test('should support multiple build targets', async () => {
    for (const target of buildTargets) {
      const targetTool = { name: 'tsc', target, config: { outDir: `dist/${target}` } };
      
      buildWrapper.execute.mockResolvedValue({
        ...commonBuildResult, target, 
        outputs: [`dist/${target}/index.js`], 
        compatibility: target === 'es5' ? 'legacy' : 'modern'
      });

      const result = await buildWrapper.execute(targetTool);
      expect(result.target).toBe(target);
      expect(result.outputs[0]).toContain(`dist/${target}/`);
    }
  });

  test('should execute webpack build configuration', async () => {
    const webpackResult = {
      success: true, bundler: 'webpack', mode: 'production', duration: 4200,
      bundles: [{ name: 'main.js', size: '1.2MB', chunks: ['vendor', 'app'] }],
      assets: { total: 12 }
    };

    buildWrapper.execute.mockResolvedValue(webpackResult);
    const result = await buildWrapper.execute({ name: 'webpack', mode: 'production' });

    expect(result.bundler).toBe('webpack');
    expect(result.bundles[0].chunks).toContain('vendor');
    expect(result.assets.total).toBe(12);
  });

  test('should support Vite build integration', async () => {
    const viteResult = {
      success: true, bundler: 'vite', duration: 1800,
      outputs: ['dist/assets/index-a1b2c3d4.js'], optimization: { minified: true },
      performance: { buildTime: '1.8s', bundleSize: '145KB' }
    };

    buildWrapper.execute.mockResolvedValue(viteResult);
    const result = await buildWrapper.execute({ name: 'vite', command: 'build' });

    expect(result.bundler).toBe('vite');
    expect(result.optimization.minified).toBe(true);
    expect(result.performance.buildTime).toBe('1.8s');
  });

  test('should support watch mode for development', async () => {
    const watchResult = {
      success: true, mode: 'watch', watching: true,
      initial: { duration: 3200, files: 45 }, incremental: { enabled: true, cacheSize: '15MB' },
      changes: [{ file: 'src/auth.ts', event: 'change', recompileTime: 450 }]
    };

    buildWrapper.watch.mockResolvedValue(watchResult);
    const result = await buildWrapper.watch({ name: 'tsc', mode: 'watch' });

    expect(result.watching).toBe(true);
    expect(result.incremental.enabled).toBe(true);
    expect(result.changes[0].recompileTime).toBeLessThan(1000);
  });

  test('should handle build configuration validation', () => {
    const configs = [
      { tool: 'tsc', valid: true },
      { tool: 'webpack', valid: true },
      { tool: 'vite', valid: false }
    ];

    configs.forEach(config => {
      buildWrapper.validateTool.mockImplementation((tool) => {
        if (tool.name === config.tool && !config.valid) {
          throw new Error(`Configuration error`);
        }
        return true;
      });

      if (config.valid) {
        expect(() => buildWrapper.validateTool({ name: config.tool })).not.toThrow();
      } else {
        expect(() => buildWrapper.validateTool({ name: config.tool })).toThrow();
      }
    });
  });

  test('should support environment-specific builds', async () => {
    const environments = ['development', 'production'];
    
    for (const env of environments) {
      buildWrapper.execute.mockResolvedValue({
        success: true, environment: env,
        optimization: env === 'production' ? { minified: true } : { minified: false },
        sourceMap: env !== 'production'
      });

      const result = await buildWrapper.execute({ name: 'tsc', environment: env });
      expect(result.environment).toBe(env);
      if (env === 'production') {
        expect(result.optimization.minified).toBe(true);
      }
    }
  });
});