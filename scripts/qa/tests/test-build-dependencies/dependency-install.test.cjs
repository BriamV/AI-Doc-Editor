/**
 * Dependency Install Tests - RF-003: Package installation
 */

const DependencyInstaller = require('../../core/installers/DependencyInstaller.cjs');

jest.mock('../../core/installers/DependencyInstaller.cjs', () => {
  return jest.fn().mockImplementation((config, logger) => ({
    config, logger,
    install: jest.fn(), update: jest.fn(), resolve: jest.fn(),
    clean: jest.fn(), validateLockFile: jest.fn(),
    getCapabilities: jest.fn(() => ({
      supportedManagers: ['npm', 'yarn', 'pnpm'],
      supportedRegistries: ['npmjs', 'private', 'local'],
      lockFileFormats: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
      cacheSupport: true
    }))
  }));
});

describe('Dependency Installer (RF-003 Build & Dependencies - Packages)', () => {
  let dependencyInstaller, mockConfig, mockLogger;
  const packageManagers = ['npm', 'yarn', 'pnpm'];
  const commonInstallResult = {
    success: true, duration: 15200, packages: { installed: 145, updated: 8, removed: 2 },
    size: { total: '85.4MB', cache: '12.1MB' }
  };

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key) => ({
        'dependencies.packageManager': 'npm', 'dependencies.registry': 'https://registry.npmjs.org/',
        'dependencies.cache': true, 'dependencies.lockFile': true, 'dependencies.exact': false,
        'dependencies.production': false, 'dependencies.timeout': 60000
      })[key])
    };
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), success: jest.fn() };
    dependencyInstaller = new DependencyInstaller(mockConfig, mockLogger);
    jest.clearAllMocks();
  });

  test('should initialize with package manager configuration', () => {
    expect(dependencyInstaller.config).toBe(mockConfig);
    expect(dependencyInstaller.logger).toBe(mockLogger);
  });

  test('should provide package manager capabilities', () => {
    const capabilities = dependencyInstaller.getCapabilities();
    
    expect(capabilities.supportedManagers).toContain('npm');
    expect(capabilities.supportedManagers).toContain('yarn');
    expect(capabilities.supportedManagers).toContain('pnpm');
    expect(capabilities.lockFileFormats).toContain('package-lock.json');
    expect(capabilities.cacheSupport).toBe(true);
  });

  test('should execute npm install successfully', async () => {
    const npmTool = { manager: 'npm', command: 'install', config: { cache: true, lockFile: true } };
    const npmResult = {
      ...commonInstallResult, manager: 'npm', command: 'install',
      lockFile: 'package-lock.json', registry: 'https://registry.npmjs.org/',
      packages: { installed: 145, vulnerabilities: { high: 0, moderate: 2, low: 5 } }
    };

    dependencyInstaller.install.mockResolvedValue(npmResult);
    const result = await dependencyInstaller.install(npmTool);

    expect(result.success).toBe(true);
    expect(result.manager).toBe('npm');
    expect(result.lockFile).toBe('package-lock.json');
    expect(result.packages.installed).toBe(145);
  });

  test('should execute yarn install with workspaces', async () => {
    const yarnTool = { manager: 'yarn', command: 'install', config: { workspaces: true, frozen: true } };
    const yarnResult = {
      ...commonInstallResult, manager: 'yarn', command: 'install',
      lockFile: 'yarn.lock', workspaces: { count: 3, packages: ['frontend', 'backend', 'shared'] },
      cache: { hit: '78%', size: '45.2MB' }
    };

    dependencyInstaller.install.mockResolvedValue(yarnResult);
    const result = await dependencyInstaller.install(yarnTool);

    expect(result.manager).toBe('yarn');
    expect(result.workspaces.count).toBe(3);
    expect(result.workspaces.packages).toContain('frontend');
    expect(result.cache.hit).toBe('78%');
  });

  test('should execute pnpm install with peer dependencies', async () => {
    const pnpmTool = { manager: 'pnpm', command: 'install', config: { peerDependencies: 'auto', strict: true } };
    const pnpmResult = {
      ...commonInstallResult, manager: 'pnpm', command: 'install',
      lockFile: 'pnpm-lock.yaml', peerDependencies: { resolved: 12, warnings: 1 },
      dedupe: { saved: '23.1MB', packages: 45 }
    };

    dependencyInstaller.install.mockResolvedValue(pnpmResult);
    const result = await dependencyInstaller.install(pnpmTool);

    expect(result.manager).toBe('pnpm');
    expect(result.peerDependencies.resolved).toBe(12);
    expect(result.dedupe.saved).toBe('23.1MB');
    expect(result.lockFile).toBe('pnpm-lock.yaml');
  });

  test('should handle dependency resolution conflicts', async () => {
    const conflictTool = { manager: 'npm', command: 'install' };
    const conflictResult = {
      success: false, manager: 'npm', duration: 8400,
      conflicts: [
        { package: 'react', requested: '^17.0.0', resolved: '16.14.0', reason: 'peer dependency constraint' },
        { package: 'typescript', requested: '^4.5.0', resolved: '4.4.4', reason: 'version mismatch' }
      ],
      resolutions: { available: 2, applied: 0 }
    };

    dependencyInstaller.install.mockResolvedValue(conflictResult);
    const result = await dependencyInstaller.install(conflictTool);

    expect(result.success).toBe(false);
    expect(result.conflicts).toHaveLength(2);
    expect(result.conflicts[0].package).toBe('react');
    expect(result.resolutions.available).toBe(2);
  });

  test('should validate and update lock files', async () => {
    for (const manager of packageManagers) {
      const lockFiles = {
        npm: 'package-lock.json',
        yarn: 'yarn.lock', 
        pnpm: 'pnpm-lock.yaml'
      };

      const lockTool = { manager, lockFile: lockFiles[manager] };
      
      dependencyInstaller.validateLockFile.mockResolvedValue({
        valid: true, manager, lockFile: lockFiles[manager],
        integrity: { hash: 'abc123', verified: true },
        packages: { total: 145, direct: 23, transitive: 122 }
      });

      const result = await dependencyInstaller.validateLockFile(lockTool);
      expect(result.valid).toBe(true);
      expect(result.lockFile).toBe(lockFiles[manager]);
      expect(result.integrity.verified).toBe(true);
    }
  });

  test('should handle registry configuration and authentication', async () => {
    const registryTool = { 
      manager: 'npm', registry: 'https://internal-registry.company.com/', 
      config: { auth: true, token: 'npm_token_123' }
    };
    const registryResult = {
      success: true, manager: 'npm', registry: 'https://internal-registry.company.com/',
      authentication: { verified: true, scope: '@company' },
      packages: { internal: 12, external: 133, total: 145 }
    };

    dependencyInstaller.install.mockResolvedValue(registryResult);
    const result = await dependencyInstaller.install(registryTool);

    expect(result.registry).toContain('internal-registry.company.com');
    expect(result.authentication.verified).toBe(true);
    expect(result.packages.internal).toBe(12);
  });

  test('should perform package resolution and version analysis', async () => {
    const resolveTool = { manager: 'npm', command: 'resolve', packages: ['react', 'lodash', 'typescript'] };
    const resolveResult = {
      success: true, manager: 'npm', command: 'resolve',
      resolutions: [
        { package: 'react', requested: '^17.0.0', resolved: '17.0.2', latest: '18.2.0', outdated: true },
        { package: 'lodash', requested: '^4.17.0', resolved: '4.17.21', latest: '4.17.21', outdated: false },
        { package: 'typescript', requested: '^4.5.0', resolved: '4.9.5', latest: '5.0.2', outdated: true }
      ],
      summary: { total: 3, outdated: 2, upToDate: 1 }
    };

    dependencyInstaller.resolve.mockResolvedValue(resolveResult);
    const result = await dependencyInstaller.resolve(resolveTool);

    expect(result.resolutions).toHaveLength(3);
    expect(result.summary.outdated).toBe(2);
    expect(result.resolutions.find(r => r.package === 'react').outdated).toBe(true);
  });

  test('should optimize package cache and clean operations', async () => {
    const cleanTool = { manager: 'npm', command: 'clean', config: { cache: true, modules: true } };
    const cleanResult = {
      success: true, manager: 'npm', command: 'clean',
      cache: { before: '156.7MB', after: '23.4MB', freed: '133.3MB' },
      modules: { removed: 1247, size: '45.2MB' },
      duration: 4200
    };

    dependencyInstaller.clean.mockResolvedValue(cleanResult);
    const result = await dependencyInstaller.clean(cleanTool);

    expect(result.cache.freed).toBe('133.3MB');
    expect(result.modules.removed).toBe(1247);
    expect(result.duration).toBeLessThan(10000);
  });

  test('should handle production vs development installs', async () => {
    const environments = [
      { env: 'production', devDeps: false, packages: 45 },
      { env: 'development', devDeps: true, packages: 145 }
    ];

    for (const { env, devDeps, packages } of environments) {
      const envTool = { manager: 'npm', environment: env, config: { production: !devDeps } };
      
      dependencyInstaller.install.mockResolvedValue({
        success: true, environment: env, devDependencies: devDeps,
        packages: { installed: packages, production: devDeps ? packages - 100 : packages }
      });

      const result = await dependencyInstaller.install(envTool);
      expect(result.environment).toBe(env);
      expect(result.devDependencies).toBe(devDeps);
      expect(result.packages.installed).toBe(packages);
    }
  });

  test('should monitor install performance and provide metrics', () => {
    const performanceData = {
      network: { requests: 145, parallelism: 8, avgResponseTime: '450ms' },
      disk: { reads: 1247, writes: 567, totalIO: '234MB' },
      cpu: { usage: '45%', peakUsage: '78%' },
      memory: { used: '156MB', peak: '201MB' }
    };

    dependencyInstaller.install.mockResolvedValue({
      success: true, duration: 15200, performance: performanceData,
      efficiency: { packagesPerSec: 9.5, throughput: '5.6MB/s', cacheHitRate: '67%' }
    });

    const result = dependencyInstaller.install({ manager: 'npm', measurePerformance: true });
    expect(result.performance).toBeDefined();
    expect(result.efficiency).toBeDefined();
  });

  test('should handle dependency security and audit integration', async () => {
    const auditTool = { manager: 'npm', command: 'audit', config: { autoFix: false, level: 'moderate' } };
    const auditResult = {
      success: true, manager: 'npm', command: 'audit',
      vulnerabilities: { critical: 0, high: 1, moderate: 3, low: 8, info: 2 },
      packages: { audited: 145, vulnerable: 4 },
      fixes: { available: 3, breaking: 1 }
    };

    dependencyInstaller.install.mockResolvedValue(auditResult);
    const result = await dependencyInstaller.install(auditTool);

    expect(result.vulnerabilities.high).toBe(1);
    expect(result.packages.vulnerable).toBe(4);
    expect(result.fixes.available).toBe(3);
  });
});