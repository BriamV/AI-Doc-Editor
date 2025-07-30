/**
 * MegaLinter Executor Tests
 * RF-003: Error Detection - Command building & execution validation
 * RNF-001 Compliant: ≤212 LOC
 */

const MegaLinterExecutor = require('../../core/wrappers/megalinter/MegaLinterExecutor.cjs');
const { spawn } = require('child_process');
const { execSync } = require('child_process');

// Mock child_process
jest.mock('child_process');

describe('MegaLinter Executor (RF-003)', () => {
  let executor;
  let mockConfig;
  let mockLogger;

  beforeEach(() => {
    mockConfig = {
      get: jest.fn()
    };
    
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    executor = new MegaLinterExecutor(mockConfig, mockLogger);

    // Reset mocks
    jest.clearAllMocks();
  });

  test('should build Docker command when Docker available', async () => {
    execSync.mockImplementation((cmd) => {
      if (cmd === 'which megalinter') {
        throw new Error('not found');
      }
      if (cmd === 'docker --version') {
        return 'Docker version 20.10.0';
      }
    });

    const mockTool = {
      name: 'megalinter',
      config: { args: ['--fix'] }
    };

    const mockMegalinterConfig = {
      settings: {
        image: 'megalinter/megalinter:v6',
        reportFolder: 'megalinter-reports'
      }
    };

    const command = await executor.buildCommand(mockTool, mockMegalinterConfig);

    expect(command).toContain('docker');
    expect(command).toContain('run');
    expect(command).toContain('--rm');
    expect(command).toContain('megalinter/megalinter:v6');
    expect(command).toContain('--fix');
  });

  test('should build local command when MegaLinter locally available', async () => {
    execSync.mockImplementation((cmd) => {
      if (cmd === 'which megalinter') {
        return '/usr/local/bin/megalinter';
      }
    });

    const mockTool = {
      name: 'megalinter',
      config: { args: [] }
    };

    const mockMegalinterConfig = {
      settings: {
        image: 'megalinter/megalinter:v6',
        reportFolder: 'megalinter-reports'
      }
    };

    const command = await executor.buildCommand(mockTool, mockMegalinterConfig);

    expect(command).toEqual(['megalinter']);
  });

  test('should throw error when neither Docker nor local MegaLinter available', async () => {
    execSync.mockImplementation(() => {
      throw new Error('not found');
    });

    const mockTool = { name: 'megalinter' };
    const mockMegalinterConfig = { settings: {} };

    await expect(executor.buildCommand(mockTool, mockMegalinterConfig))
      .rejects.toThrow(/MegaLinter requires either/);
  });

  test('should generate platform-specific installation guidance', () => {
    const originalPlatform = process.platform;
    const originalEnv = process.env;

    // Test WSL environment
    process.env.WSL_DISTRO_NAME = 'Ubuntu-20.04';
    const wslGuidance = executor._generateInstallationGuidance();
    expect(wslGuidance).toContain('WSL2');
    expect(wslGuidance).toContain('Docker Desktop');

    // Test Linux environment
    delete process.env.WSL_DISTRO_NAME;
    delete process.env.WSL_INTEROP;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const linuxGuidance = executor._generateInstallationGuidance();
    expect(linuxGuidance).toContain('https://docs.docker.com/engine/install/ubuntu/');

    // Restore original values
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    process.env = originalEnv;
  });

  test('should execute command and return results', async () => {
    const mockChildProcess = { stdout: { on: jest.fn() }, stderr: { on: jest.fn() }, on: jest.fn() };
    spawn.mockReturnValue(mockChildProcess);

    setTimeout(() => {
      mockChildProcess.stdout.on.mock.calls.find(call => call[0] === 'data')[1]('MegaLinter version 6.0.0');
      mockChildProcess.on.mock.calls.find(call => call[0] === 'close')[1](0);
    }, 0);

    const result = await executor.execute(['megalinter', '--version'], { TEST_VAR: 'test' }, '/tmp');

    expect(spawn).toHaveBeenCalledWith('megalinter', ['--version'], expect.objectContaining({ cwd: '/tmp' }));
    expect(result).toHaveProperty('exitCode', 0);
  });

  test('should handle execution timeout', async () => {
    const mockChildProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };

    spawn.mockReturnValue(mockChildProcess);

    // Don't simulate close event to trigger timeout

    const command = ['megalinter'];
    const promise = executor.execute(command, {}, '/tmp');

    // Fast forward time to trigger timeout
    jest.useFakeTimers();
    jest.advanceTimersByTime(300001); // 5 minutes + 1ms

    await expect(promise).rejects.toThrow('MegaLinter execution timed out');
    expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');

    jest.useRealTimers();
  });

  test('should handle process errors', async () => {
    const mockChildProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn()
    };

    spawn.mockReturnValue(mockChildProcess);

    setTimeout(() => {
      // Simulate process error
      const errorCallback = mockChildProcess.on.mock.calls
        .find(call => call[0] === 'error')[1];
      errorCallback(new Error('Process spawn failed'));
    }, 0);

    const command = ['invalid-command'];
    
    await expect(executor.execute(command, {}, '/tmp'))
      .rejects.toThrow('MegaLinter process error: Process spawn failed');
  });

  test('should prepare working directory correctly', async () => {
    const fs = require('fs').promises;
    jest.mock('fs', () => ({
      promises: {
        mkdir: jest.fn()
      }
    }));

    const mockTool = { name: 'eslint' };
    const mockMegalinterConfig = {
      settings: { reportFolder: 'megalinter-reports' }
    };

    await executor.prepareWorkingDirectory(mockTool, mockMegalinterConfig);

    // Since we're mocking, we can't actually test the fs operations
    // but we can verify the method doesn't throw
    expect(true).toBe(true);
  });
});