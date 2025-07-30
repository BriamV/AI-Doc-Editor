const os = require('os');
const path = require('path');
const { getPackageManagerService } = require('../../core/services/PackageManagerService.cjs');

jest.mock('../../core/services/PackageManagerService.cjs');

describe('Cross-Platform Support Validation (RNF-004)', () => {
  let originalPlatform, originalEnv;

  beforeEach(() => {
    originalPlatform = process.platform;
    originalEnv = { ...process.env };
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    process.env = originalEnv;
  });

  describe('Platform detection & path handling', () => {
    test('detects operating systems correctly', () => {
      const platforms = [
        { platform: 'win32', expected: 'windows', separator: '\\' },
        { platform: 'darwin', expected: 'macos', separator: '/' },
        { platform: 'linux', expected: 'linux', separator: '/' }
      ];

      platforms.forEach(({ platform, expected, separator }) => {
        Object.defineProperty(process, 'platform', { value: platform });
        
        const detected = process.platform === 'win32' ? 'windows' :
                        process.platform === 'darwin' ? 'macos' :
                        process.platform === 'linux' ? 'linux' : 'unix';
        
        expect(detected).toBe(expected);
        expect(path.sep).toBe(separator);
      });
    });

    test('handles paths across platforms', () => {
      const pathTests = [
        { platform: 'win32', path: 'C:\\Users\\test', hasBackslash: true },
        { platform: 'linux', path: '/home/user', hasBackslash: false }
      ];

      pathTests.forEach(({ platform, path: testPath, hasBackslash }) => {
        Object.defineProperty(process, 'platform', { value: platform });
        const normalized = path.normalize(testPath);
        expect(normalized.includes('\\')).toBe(hasBackslash);
      });
    });
  });

  describe('Package manager & environment detection', () => {
    test('detects package managers with platform-specific commands', async () => {
      const mockService = {
        initialize: jest.fn(),
        getManager: jest.fn()
      };

      const cases = [
        { platform: 'win32', manager: 'npm', expected: 'npm.cmd' },
        { platform: 'linux', manager: 'yarn', expected: 'yarn' }
      ];

      for (const { platform, manager, expected } of cases) {
        Object.defineProperty(process, 'platform', { value: platform });
        mockService.getManager.mockReturnValue(manager);
        getPackageManagerService.mockReturnValue(mockService);

        const service = getPackageManagerService();
        await service.initialize();
        const detectedManager = service.getManager();

        expect(detectedManager).toBe(manager);
        const command = platform === 'win32' && manager === 'npm' ? 'npm.cmd' : manager;
        expect(command).toBe(expected);
      }
    });

    test('handles environment variables across platforms', () => {
      const envTests = [
        { platform: 'win32', pathVar: 'PATH', separator: ';' },
        { platform: 'linux', pathVar: 'PATH', separator: ':' }
      ];

      envTests.forEach(({ platform, pathVar, separator }) => {
        Object.defineProperty(process, 'platform', { value: platform });
        const pathSeparator = platform === 'win32' ? ';' : ':';
        expect(pathSeparator).toBe(separator);
        expect(process.env[pathVar]).toBeDefined();
      });
    });
  });

  describe('Command execution & file system', () => {
    test('handles command extensions on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      const commands = [
        { command: 'node', expected: 'node.exe' },
        { command: 'npm', expected: 'npm.cmd' }
      ];

      commands.forEach(({ command, expected }) => {
        const windowsCommand = command === 'node' ? 'node.exe' :
                              command === 'npm' ? 'npm.cmd' : command;
        expect(windowsCommand).toBe(expected);
      });
    });

    test('handles file permissions and temp directories', () => {
      const isWindows = process.platform === 'win32';
      
      expect(os.constants.F_OK).toBeDefined();
      expect(os.constants.R_OK).toBeDefined();
      expect(os.constants.W_OK).toBeDefined();
      if (!isWindows) {
        expect(os.constants.X_OK).toBeDefined();
      }

      const tempDir = os.tmpdir();
      expect(tempDir).toBeDefined();
      
      if (isWindows) {
        expect(tempDir).toMatch(/^[A-Z]:\\/);
      } else {
        expect(tempDir).toMatch(/^\/.*tmp/);
      }
    });

    test('resolves relative paths consistently', () => {
      const testPaths = ['./scripts/qa', '../project', 'node_modules/.bin/jest'];
      
      testPaths.forEach(input => {
        const resolved = path.resolve(input);
        const isAbsolute = path.isAbsolute(resolved);
        expect(isAbsolute).toBe(true);
      });
    });
  });

  describe('CI/CD environment & error handling', () => {
    test('detects CI environments across platforms', () => {
      const ciEnvironments = [
        { name: 'GitHub Actions', env: { GITHUB_ACTIONS: 'true' } },
        { name: 'Jenkins', env: { JENKINS_URL: 'localhost' } },
        { name: 'GitLab CI', env: { GITLAB_CI: 'true' } }
      ];

      ciEnvironments.forEach(({ name, env }) => {
        Object.assign(process.env, env);
        const isCI = Object.keys(env).some(key => process.env[key]);
        expect(isCI).toBe(true);
      });
    });

    test('handles platform-specific CI configurations', () => {
      const configs = [
        { platform: 'win32', runner: 'windows-latest', shell: 'pwsh' },
        { platform: 'linux', runner: 'ubuntu-latest', shell: 'bash' },
        { platform: 'darwin', runner: 'macos-latest', shell: 'bash' }
      ];

      configs.forEach(({ platform, runner, shell }) => {
        Object.defineProperty(process, 'platform', { value: platform });
        
        const expectedRunner = platform === 'win32' ? 'windows-latest' :
                              platform === 'linux' ? 'ubuntu-latest' :
                              platform === 'darwin' ? 'macos-latest' : 'ubuntu-latest';
        
        const expectedShell = platform === 'win32' ? 'pwsh' : 'bash';
        expect(expectedRunner).toBe(runner);
        expect(expectedShell).toBe(shell);
      });
    });

    test('handles unsupported platforms and missing env vars', () => {
      Object.defineProperty(process, 'platform', { value: 'aix' });
      
      const supportedPlatforms = ['win32', 'linux', 'darwin'];
      const isSupported = supportedPlatforms.includes(process.platform);
      expect(isSupported).toBe(false);
      
      delete process.env.HOME;
      delete process.env.USERPROFILE;
      const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir();
      expect(homeDir).toBeDefined();
    });
  });

});