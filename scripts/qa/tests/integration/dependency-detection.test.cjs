/**
 * Dependency Detection Tests
 * T-11: Build & Dependency Validators - Package Manager Detection
 * 
 * Validates that PackageManagerService correctly detects yarn/npm/pnpm
 * according to WorkPlan QA CLI.md T-11 requirements
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getPackageManagerService } = require('../../core/services/PackageManagerService.cjs');

describe('Package Manager Detection (T-11)', () => {
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

  describe('Lock File Detection', () => {
    test('detects yarn when yarn.lock exists', async () => {
      // Arrange: Create yarn.lock file
      fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '# yarn lockfile v1\n');
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      // Act
      await packageManagerService.initialize();
      const manager = packageManagerService.getManager();
      const installCommand = packageManagerService.getInstallCommand();

      // Assert
      expect(manager).toBe('yarn');
      expect(installCommand).toBe('yarn install');
    });

    test('detects npm when package-lock.json exists', async () => {
      // Arrange: Create package-lock.json file
      fs.writeFileSync(path.join(tempDir, 'package-lock.json'), '{"lockfileVersion": 2}');
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      // Act
      await packageManagerService.initialize();
      const manager = packageManagerService.getManager();
      const installCommand = packageManagerService.getInstallCommand();

      // Assert
      expect(manager).toBe('npm');
      expect(installCommand).toBe('npm install');
    });

    test('detects pnpm when pnpm-lock.yaml exists', async () => {
      // Arrange: Create pnpm-lock.yaml file
      fs.writeFileSync(path.join(tempDir, 'pnpm-lock.yaml'), 'lockfileVersion: 5.4\n');
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      // Act
      await packageManagerService.initialize();
      const manager = packageManagerService.getManager();
      const installCommand = packageManagerService.getInstallCommand();

      // Assert
      expect(manager).toBe('pnpm');
      expect(installCommand).toBe('pnpm install');
    });

    test('falls back to npm when no lock files exist', async () => {
      // Arrange: Only package.json, no lock files
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      // Act
      await packageManagerService.initialize();
      const manager = packageManagerService.getManager();
      const installCommand = packageManagerService.getInstallCommand();

      // Assert
      expect(manager).toBe('npm');
      expect(installCommand).toBe('npm install');
    });

    test('prioritizes yarn over npm when both lock files exist', async () => {
      // Arrange: Create both yarn.lock and package-lock.json
      fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '# yarn lockfile v1\n');
      fs.writeFileSync(path.join(tempDir, 'package-lock.json'), '{"lockfileVersion": 2}');
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      // Act
      await packageManagerService.initialize();
      const manager = packageManagerService.getManager();

      // Assert
      expect(manager).toBe('yarn');
    });
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
  });

  describe('Error Handling', () => {
    test('handles missing package.json gracefully', async () => {
      // Arrange: No package.json in directory
      
      // Act & Assert
      await expect(packageManagerService.initialize()).rejects.toThrow();
    });

    test('handles corrupted lock files gracefully', async () => {
      // Arrange: Create corrupted yarn.lock
      fs.writeFileSync(path.join(tempDir, 'yarn.lock'), 'corrupted content');
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      // Act
      await packageManagerService.initialize();
      const manager = packageManagerService.getManager();

      // Assert: Should still detect as yarn based on file presence
      expect(manager).toBe('yarn');
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
  });
});