/**
 * Dependency Detection Commands Tests
 * T-11: Build & Dependency Validators - Command Generation & Advanced Features
 * RNF-001 Compliant: ≤212 LOC
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getPackageManagerService } = require('../../core/services/PackageManagerService.cjs');

describe('Package Manager Commands & Advanced (T-11)', () => {
  let tempDir;
  let originalCwd;
  let packageManagerService;

  beforeEach(async () => {
    // Create temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Get fresh instance for each test
    packageManagerService = getPackageManagerService();
    // Reset the service for clean state
    if (packageManagerService._initialized) {
      packageManagerService._initialized = false;
      packageManagerService._manager = null;
      packageManagerService._initializationPromise = null;
    }
  });

  afterEach(() => {
    process.chdir(originalCwd);
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Command Generation', () => {
    test('generates correct install commands for each package manager', async () => {
      const testCases = [
        { lockFile: 'yarn.lock', lockContent: '# yarn lockfile v1\n', expected: 'yarn install' },
        { lockFile: 'package-lock.json', lockContent: '{"lockfileVersion": 2}', expected: 'npm install' },
        { lockFile: 'pnpm-lock.yaml', lockContent: 'lockfileVersion: 5.4\n', expected: 'pnpm install' }
      ];

      for (const testCase of testCases) {
        // Clean up previous test
        fs.readdirSync(tempDir).forEach(file => {
          if (file !== 'package.json') {
            fs.unlinkSync(path.join(tempDir, file));
          }
        });
        
        // Reset service
        packageManagerService._initialized = false;
        packageManagerService._manager = null;
        packageManagerService._initializationPromise = null;

        // Arrange
        fs.writeFileSync(path.join(tempDir, testCase.lockFile), testCase.lockContent);
        fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

        // Act
        await packageManagerService.initialize();
        const installCommand = packageManagerService.getInstallCommand();

        // Assert
        expect(installCommand).toBe(testCase.expected);
      }
    });

    test('generates correct optimization args for each package manager', async () => {
      const testCases = [
        { 
          lockFile: 'yarn.lock', 
          lockContent: '# yarn lockfile v1\n', 
          expectedArgs: ['--prefer-offline', '--silent'] 
        },
        { 
          lockFile: 'package-lock.json', 
          lockContent: '{"lockfileVersion": 2}', 
          expectedArgs: ['--prefer-offline', '--no-audit', '--silent'] 
        },
        { 
          lockFile: 'pnpm-lock.yaml', 
          lockContent: 'lockfileVersion: 5.4\n', 
          expectedArgs: ['--prefer-offline', '--silent'] 
        }
      ];

      for (const testCase of testCases) {
        // Clean up and reset
        fs.readdirSync(tempDir).forEach(file => {
          if (file !== 'package.json') {
            fs.unlinkSync(path.join(tempDir, file));
          }
        });
        packageManagerService._initialized = false;
        packageManagerService._manager = null;
        packageManagerService._initializationPromise = null;

        // Arrange
        fs.writeFileSync(path.join(tempDir, testCase.lockFile), testCase.lockContent);
        fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

        // Act
        await packageManagerService.initialize();
        const optimizationArgs = packageManagerService.getOptimizationArgs();

        // Assert
        expect(optimizationArgs).toEqual(testCase.expectedArgs);
      }
    });

    test('generates dev dependency install commands', async () => {
      // Test yarn dev install
      fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '# yarn lockfile v1\n');
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      await packageManagerService.initialize();
      
      if (typeof packageManagerService.getDevInstallCommand === 'function') {
        const devCommand = packageManagerService.getDevInstallCommand('eslint');
        expect(devCommand).toContain('yarn');
        expect(devCommand).toContain('eslint');
      }
    });
  });

  describe('Concurrency Safety', () => {
    test('handles concurrent initialization safely', async () => {
      // Arrange
      fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '# yarn lockfile v1\n');
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      // Act: Initialize concurrently
      const promises = [
        packageManagerService.initialize(),
        packageManagerService.initialize(),
        packageManagerService.initialize()
      ];

      await Promise.all(promises);

      // Assert: All should return same result
      const manager1 = packageManagerService.getManager();
      const manager2 = packageManagerService.getManager();
      const manager3 = packageManagerService.getManager();

      expect(manager1).toBe('yarn');
      expect(manager2).toBe('yarn');
      expect(manager3).toBe('yarn');
    });

    test('handles rapid successive calls', async () => {
      fs.writeFileSync(path.join(tempDir, 'package-lock.json'), '{}');
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      await packageManagerService.initialize();
      const manager1 = packageManagerService.getManager();
      const manager2 = packageManagerService.getManager();

      expect(manager1).toBe(manager2);
    });
  });

  describe('Real-world Integration', () => {
    test('detects package manager in actual AI-Doc-Editor project structure', async () => {
      // Arrange: Set up in actual project directory temporarily
      const projectRoot = path.resolve(__dirname, '../../../..');
      const originalTempDir = tempDir;
      
      process.chdir(projectRoot);
      
      // Reset service for real project
      packageManagerService._initialized = false;
      packageManagerService._manager = null;
      packageManagerService._initializationPromise = null;

      try {
        // Act
        await packageManagerService.initialize();
        const manager = packageManagerService.getManager();
        const installCommand = packageManagerService.getInstallCommand();

        // Assert: Should detect yarn (project uses yarn.lock)
        expect(manager).toBe('yarn');
        expect(installCommand).toBe('yarn install');
      } finally {
        // Cleanup: Return to temp directory
        process.chdir(originalTempDir);
      }
    });

    test('validates service methods consistency', async () => {
      fs.writeFileSync(path.join(tempDir, 'pnpm-lock.yaml'), 'lockfileVersion: 5.4\n');
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      await packageManagerService.initialize();
      
      expect(packageManagerService.getManager()).toBe('pnpm');
      expect(packageManagerService.getInstallCommand()).toContain('pnpm');
      expect(Array.isArray(packageManagerService.getOptimizationArgs())).toBe(true);
    });
  });

  test('caches detection results for performance', async () => {
    fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '# yarn lockfile v1\n');
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

    const start1 = Date.now();
    await packageManagerService.initialize();
    const firstCallTime = Date.now() - start1;

    const start2 = Date.now();
    await packageManagerService.initialize();
    const secondCallTime = Date.now() - start2;

    expect(secondCallTime).toBeLessThan(firstCallTime);
    expect(packageManagerService.getManager()).toBe('yarn');
  });
});