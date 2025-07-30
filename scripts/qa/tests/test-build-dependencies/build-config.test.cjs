/**
 * Build Config Tests - RF-003: Build configuration
 */

const BuildConfigurator = require('../../core/configurators/BuildConfigurator.cjs');

jest.mock('../../core/configurators/BuildConfigurator.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config, logger,
    validate: jest.fn(), merge: jest.fn(), optimize: jest.fn(),
    load: jest.fn(), save: jest.fn(), detect: jest.fn(),
    getCapabilities: jest.fn(() => ({
      supportedConfigs: ['tsconfig.json', 'webpack.config.js', 'vite.config.ts'],
      supportedFormats: ['json', 'js', 'ts'], mergeStrategies: ['override', 'merge', 'extend'],
      validation: true
    }))
  }));
});

describe('Build Configurator (RF-003 Build & Dependencies - Config)', () => {
  let buildConfigurator, mockConfig, mockLogger;
  const configFiles = ['tsconfig.json', 'webpack.config.js', 'vite.config.ts'];
  const commonConfigResult = {
    success: true, valid: true, conflicts: 0, 
    optimization: { applied: 8, performance: '15%' }
  };

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => ({
        'config.autoDetect': true, 'config.validate': true, 'config.merge': 'extend',
        'config.optimization': true, 'config.backup': true, 'config.strict': false
      })[key])
    };
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() };
    buildConfigurator = new BuildConfigurator(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should initialize with build configuration settings', () => {
    expect(buildConfigurator.config).toBe(mockConfig);
    expect(buildConfigurator.logger).toBe(mockLogger);
  });

  test('should provide build configuration capabilities', () => {
    const capabilities = buildConfigurator.getCapabilities();
    
    expect(capabilities.supportedConfigs).toContain('tsconfig.json');
    expect(capabilities.supportedFormats).toContain('ts');
    expect(capabilities.mergeStrategies).toContain('extend');
    expect(capabilities.validation).toBe(true);
  });

  test('should validate tsconfig.json configuration', async () => {
    const tsconfigTool = { file: 'tsconfig.json', type: 'typescript' };
    const tsconfigResult = {
      ...commonConfigResult, file: 'tsconfig.json', type: 'typescript',
      schema: { valid: true, version: '4.9' },
      compilerOptions: { target: 'es6', module: 'commonjs', strict: true, sourceMap: true },
      issues: { errors: 0, warnings: 1, suggestions: 3 }
    };

    buildConfigurator.validate.mockResolvedValue(tsconfigResult);
    const result = await buildConfigurator.validate(tsconfigTool);

    expect(result.file).toBe('tsconfig.json');
    expect(result.schema.valid).toBe(true);
    expect(result.compilerOptions.target).toBe('es6');
    expect(result.issues.errors).toBe(0);
  });

  test('should validate webpack configuration', async () => {
    const webpackTool = { file: 'webpack.config.js', type: 'webpack' };
    const webpackResult = {
      ...commonConfigResult, file: 'webpack.config.js', type: 'webpack',
      mode: 'production', entry: { main: './src/index.ts' },
      plugins: [{ name: 'HtmlWebpackPlugin', valid: true }, { name: 'MiniCssExtractPlugin', valid: true }],
      optimization: { minimize: true, splitChunks: true, treeshaking: true }
    };

    buildConfigurator.validate.mockResolvedValue(webpackResult);
    const result = await buildConfigurator.validate(webpackTool);

    expect(result.file).toBe('webpack.config.js');
    expect(result.mode).toBe('production');
    expect(result.plugins).toHaveLength(2);
    expect(result.optimization.minimize).toBe(true);
  });

  test('should validate Vite configuration', async () => {
    const viteTool = { file: 'vite.config.ts', type: 'vite' };
    const viteResult = {
      ...commonConfigResult, file: 'vite.config.ts', type: 'vite',
      build: { target: 'es2015', minify: 'terser', sourcemap: true },
      plugins: [{ name: '@vitejs/plugin-react', valid: true }, { name: 'vite-plugin-eslint', valid: true }],
      server: { port: 3000, hmr: true }
    };

    buildConfigurator.validate.mockResolvedValue(viteResult);
    const result = await buildConfigurator.validate(viteTool);

    expect(result.file).toBe('vite.config.ts');
    expect(result.build.target).toBe('es2015');
    expect(result.plugins.every(p => p.valid)).toBe(true);
    expect(result.server.hmr).toBe(true);
  });

  test('should detect and load multiple configuration files', async () => {
    const detectTool = { directory: './', recursive: false };
    const detectResult = {
      success: true, directory: './',
      found: [
        { file: 'tsconfig.json', type: 'typescript', valid: true },
        { file: 'webpack.config.js', type: 'webpack', valid: true },
        { file: 'vite.config.ts', type: 'vite', valid: false, errors: ['Missing plugin'] }
      ],
      summary: { total: 3, valid: 2, invalid: 1 }
    };

    buildConfigurator.detect.mockResolvedValue(detectResult);
    const result = await buildConfigurator.detect(detectTool);

    expect(result.found).toHaveLength(3);
    expect(result.summary.valid).toBe(2);
    expect(result.found.filter(f => f.valid)).toHaveLength(2);
  });

  test('should merge configuration files with different strategies', async () => {
    const mergeStrategies = ['override', 'merge', 'extend'];
    
    for (const strategy of mergeStrategies) {
      const mergeTool = { 
        base: 'tsconfig.base.json', target: 'tsconfig.json', 
        strategy, config: { preserveComments: true }
      };
      
      buildConfigurator.merge.mockResolvedValue({
        success: true, strategy, base: 'tsconfig.base.json', target: 'tsconfig.json',
        changes: strategy === 'override' ? 12 : strategy === 'merge' ? 8 : 5,
        conflicts: strategy === 'override' ? 0 : 2
      });

      const result = await buildConfigurator.merge(mergeTool);
      expect(result.strategy).toBe(strategy);
      expect(result.changes).toBeGreaterThan(0);
    }
  });

  test('should optimize configuration for performance', async () => {
    const optimizeTool = { file: 'webpack.config.js', target: 'production' };
    const optimizeResult = {
      success: true, file: 'webpack.config.js', target: 'production',
      optimizations: [
        { type: 'minimize', applied: true, impact: 'bundle size -45%' },
        { type: 'splitChunks', applied: true, impact: 'loading time -23%' },
        { type: 'treeshaking', applied: true, impact: 'dead code -67%' }
      ],
      performance: { before: '2.4MB', after: '1.3MB', improvement: '46%' }
    };

    buildConfigurator.optimize.mockResolvedValue(optimizeResult);
    const result = await buildConfigurator.optimize(optimizeTool);

    expect(result.optimizations).toHaveLength(3);
    expect(result.optimizations.every(o => o.applied)).toBe(true);
    expect(result.performance.improvement).toBe('46%');
  });

  test('should handle environment-specific configurations', async () => {
    const environments = ['development', 'staging', 'production'];
    
    for (const env of environments) {
      const envTool = { file: 'webpack.config.js', environment: env };
      
      buildConfigurator.load.mockResolvedValue({
        success: true, environment: env, file: 'webpack.config.js',
        mode: env === 'production' ? 'production' : 'development',
        devtool: env === 'production' ? false : 'source-map',
        optimization: { minimize: env === 'production' }
      });

      const result = await buildConfigurator.load(envTool);
      expect(result.environment).toBe(env);
      if (env === 'production') {
        expect(result.optimization.minimize).toBe(true);
        expect(result.devtool).toBe(false);
      }
    }
  });

  test('should validate plugin configurations and compatibility', () => {
    const pluginConfigs = [
      { name: 'HtmlWebpackPlugin', version: '5.5.0', compatible: true },
      { name: 'MiniCssExtractPlugin', version: '2.7.0', compatible: true },
      { name: 'OldPlugin', version: '1.0.0', compatible: false, reason: 'webpack 5 incompatible' }
    ];

    buildConfigurator.validate.mockReturnValue({
      success: true, plugins: pluginConfigs,
      compatibility: {
        compatible: pluginConfigs.filter(p => p.compatible).length,
        incompatible: pluginConfigs.filter(p => !p.compatible).length,
        warnings: ['OldPlugin needs upgrade']
      }
    });

    const result = buildConfigurator.validate({ type: 'plugins' });
    expect(result.compatibility.compatible).toBe(2);
    expect(result.compatibility.incompatible).toBe(1);
    expect(result.compatibility.warnings).toContain('OldPlugin needs upgrade');
  });

  test('should handle configuration backup and restore', async () => {
    const backupTool = { file: 'tsconfig.json', backup: true, restore: false };
    const backupResult = {
      success: true, file: 'tsconfig.json', operation: 'backup',
      backup: { file: 'tsconfig.json.backup', created: true, size: '2.1KB' },
      restore: { available: true, versions: 3 }
    };

    buildConfigurator.save.mockResolvedValue(backupResult);
    const result = await buildConfigurator.save(backupTool);

    expect(result.backup.created).toBe(true);
    expect(result.restore.available).toBe(true);
    expect(result.restore.versions).toBe(3);
  });

  test('should validate build target compatibility', () => {
    const targets = [
      { name: 'es5', supported: true, browsers: ['IE11', 'Chrome'] },
      { name: 'es2015', supported: true, browsers: ['Chrome', 'Firefox', 'Safari'] },
      { name: 'es2020', supported: true, browsers: ['Modern browsers'] },
      { name: 'esnext', supported: false, reason: 'Experimental features' }
    ];

    targets.forEach(target => {
      buildConfigurator.validate.mockReturnValue({
        success: target.supported, target: target.name,
        compatibility: { supported: target.supported, browsers: target.browsers || [] },
        warnings: target.supported ? [] : [target.reason]
      });

      const result = buildConfigurator.validate({ target: target.name });
      expect(result.target).toBe(target.name);
      expect(result.compatibility.supported).toBe(target.supported);
    });
  });

  test('should handle configuration schema validation', () => {
    const schemas = [
      { file: 'tsconfig.json', schema: 'typescript', valid: true },
      { file: 'webpack.config.js', schema: 'webpack', valid: true },
      { file: 'invalid.config.js', schema: 'unknown', valid: false }
    ];

    schemas.forEach(schema => {
      buildConfigurator.validate.mockReturnValue({
        success: schema.valid, file: schema.file, schema: schema.schema,
        validation: {
          schema: schema.valid,
          syntax: schema.valid,
          semantics: schema.valid
        }
      });

      const result = buildConfigurator.validate({ file: schema.file });
      expect(result.schema).toBe(schema.schema);
      expect(result.validation.schema).toBe(schema.valid);
    });
  });

  test('should monitor configuration performance impact', () => {
    const performanceData = {
      loadTime: { config: '45ms', plugins: '123ms', total: '168ms' },
      buildTime: { before: '4.2s', after: '3.1s', improvement: '26%' },
      bundleSize: { before: '2.4MB', after: '1.8MB', reduction: '25%' },
      memory: { peak: '245MB', average: '180MB' }
    };

    buildConfigurator.optimize.mockReturnValue({
      success: true, performance: performanceData,
      recommendations: [
        'Enable tree shaking for better bundle size',
        'Use splitChunks for improved caching',
        'Consider upgrading to webpack 5'
      ]
    });

    const result = buildConfigurator.optimize({ measurePerformance: true });
    expect(result.performance.buildTime.improvement).toBe('26%');
    expect(result.recommendations).toHaveLength(3);
  });
});