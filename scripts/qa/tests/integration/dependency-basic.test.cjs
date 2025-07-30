/**
 * Dependency Detection Basic Tests
 * T-11: Build & Dependency Validators - Package Manager Detection (Basic Functionality)
 * RNF-001 Compliant: ≤212 LOC
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getPackageManagerService } = require('../../core/services/PackageManagerService.cjs');

describe('Package Manager Detection Basic (T-11)', () => {
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

    test('handles priority order correctly', async () => {
      // Test the documented priority: yarn > pnpm > npm
      const scenarios = [
        {
          files: ['yarn.lock', 'pnpm-lock.yaml', 'package-lock.json'],
          expected: 'yarn'
        },
        {
          files: ['pnpm-lock.yaml', 'package-lock.json'],
          expected: 'pnpm'
        },
        {
          files: ['package-lock.json'],
          expected: 'npm'
        }
      ];

      for (const scenario of scenarios) {
        // Clean up previous files
        fs.readdirSync(tempDir).forEach(file => {
          if (file !== 'package.json') {
            fs.unlinkSync(path.join(tempDir, file));
          }
        });

        // Reset service
        packageManagerService._initialized = false;
        packageManagerService._manager = null;
        packageManagerService._initializationPromise = null;

        // Create lock files
        scenario.files.forEach(file => {
          const content = file === 'yarn.lock' ? '# yarn lockfile v1\n' :
                         file === 'pnpm-lock.yaml' ? 'lockfileVersion: 5.4\n' :
                         '{"lockfileVersion": 2}';
          fs.writeFileSync(path.join(tempDir, file), content);
        });

        fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

        await packageManagerService.initialize();
        const manager = packageManagerService.getManager();
        expect(manager).toBe(scenario.expected);
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

    test('handles empty lock files', async () => {
      // Arrange: Create empty lock files
      fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '');
      fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name": "test"}');

      // Act
      await packageManagerService.initialize();
      const manager = packageManagerService.getManager();

      // Assert: Should still detect based on file existence
      expect(manager).toBe('yarn');
    });

    test('handles invalid package.json', async () => {
      // Arrange: Create invalid package.json
      fs.writeFileSync(path.join(tempDir, 'package.json'), 'invalid json');
      fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '# yarn lockfile v1\n');

      // Act & Assert: Should handle gracefully or throw meaningful error
      try {
        await packageManagerService.initialize();
        const manager = packageManagerService.getManager();
        expect(manager).toBe('yarn'); // Should still work based on lock file
      } catch (error) {
        expect(error.message).toContain('package.json');
      }
    });
  });
});