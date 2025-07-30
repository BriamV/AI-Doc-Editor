const ToolChecker = require('../../core/environment/ToolChecker.cjs');

jest.mock('child_process');
jest.mock('fs');

describe('Tool Availability Validation (RF-007)', () => {
  let toolChecker, mockLogger, mockExecSync, mockFs;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), level: 'info' };
    mockExecSync = require('child_process').execSync;
    mockFs = require('fs');
    toolChecker = new ToolChecker(mockLogger);
    jest.clearAllMocks();
  });

  describe('Critical tools detection', () => {
    const criticalTools = [
      { tool: 'git', output: 'git version 2.34.1', version: '2.34.1' },
      { tool: 'node', output: 'v18.16.0', version: '18.16.0' },
      { tool: 'npm', output: '9.5.1', version: '9.5.1' },
      { tool: 'yarn', output: '1.22.19', version: '1.22.19' }
    ];
    
    criticalTools.forEach(({ tool, output, version }) => {
      test(`should detect ${tool}`, async () => {
        mockExecSync.mockReturnValue(output);
        const result = await toolChecker.checkTool(tool, { command: `${tool} --version`, critical: true });
        expect(result.available).toBe(true);
        expect(result.version).toBe(version);
      });
    });
  });

  describe('Optional tools with fallbacks', () => {
    const optionalTools = [
      { tool: 'megalinter', output: 'mega-linter-runner@6.22.2', fallback: 'docker' },
      { tool: 'snyk', output: '1.1200.0', fallback: 'skip' },
      { tool: 'docker', output: 'Docker version 20.10.21', fallback: null }
    ];
    
    optionalTools.forEach(({ tool, output, fallback }) => {
      test(`should detect ${tool}`, async () => {
        mockExecSync.mockReturnValue(output);
        const result = await toolChecker.checkTool(tool, { command: `${tool} --version`, fallback });
        expect(result.available).toBe(true);
        expect(result.fallback).toBe(fallback);
      });
    });
  });

  describe('Python venv detection', () => {
    const pythonTools = [
      { tool: 'black', platform: 'win32', path: '.venv/Scripts/black.exe', output: 'black, 23.3.0' },
      { tool: 'pylint', platform: 'linux', path: '.venv/bin/pylint', output: 'pylint 2.17.4' }
    ];
    
    pythonTools.forEach(({ tool, platform, path, output }) => {
      test(`should detect ${tool} in ${platform} venv`, async () => {
        Object.defineProperty(process, 'platform', { value: platform });
        mockFs.existsSync.mockImplementation((p) => p === path);
        mockExecSync.mockReturnValue(output);
        const result = await toolChecker.checkTool(tool, { command: `${tool} --version` });
        expect(result.available).toBe(true);
        expect(result.detectionMethod).toBe('venv');
      });
    });
  });

  describe('Special detection methods', () => {
    test('should detect Spectral file-based', async () => {
      const path = 'node_modules/@stoplight/spectral-cli/package.json';
      mockFs.existsSync.mockImplementation((p) => p === path);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ version: '6.11.0' }));
      const result = await toolChecker.checkTool('spectral', { command: `ls ${path}` });
      expect(result.available).toBe(true);
      expect(result.detectionMethod).toBe('file-based');
    });

    test('should handle Docker WSL fallback', async () => {
      mockExecSync
        .mockImplementationOnce(() => { throw new Error('failed'); })
        .mockImplementationOnce(() => 'Docker version 20.10.21');
      const result = await toolChecker.checkTool('docker', { command: 'docker --version' });
      expect(result.available).toBe(true);
      expect(result.detectionMethod).toBe('wsl-fallback');
    });
  });

  describe('Tool unavailability', () => {
    test('should handle missing optional tool', async () => {
      mockExecSync.mockImplementation(() => { throw new Error('Command failed'); });
      const result = await toolChecker.checkTool('missing', { command: 'missing --version' });
      expect(result.available).toBe(false);
      expect(result.error).toBe('Command failed');
    });

    test('should throw for missing critical tool', async () => {
      mockExecSync.mockImplementation(() => { throw new Error('Command failed'); });
      const tools = { git: { command: 'git --version', critical: true, description: 'Git', installUrl: 'https://git.com' }};
      await expect(toolChecker.checkCriticalTools(tools)).rejects.toThrow('Critical tool missing: git');
    });
  });

  describe('Parallel tool checking', () => {
    test('should check multiple tools', async () => {
      const tools = {
        git: { command: 'git --version' },
        node: { command: 'node --version' },
        docker: { command: 'docker --version' }
      };
      mockExecSync
        .mockReturnValueOnce('git version 2.34.1')
        .mockReturnValueOnce('v18.16.0')
        .mockReturnValueOnce('Docker version 20.10.21');
      const results = await toolChecker.checkTools(tools);
      expect(results.size).toBe(3);
      expect(results.get('git').available).toBe(true);
      expect(results.get('node').available).toBe(true);
      expect(results.get('docker').available).toBe(true);
    });
  });

  describe('Logging format', () => {
    const logCases = [
      { available: true, tool: 'git', version: '2.34.1', expectedLog: '✅ git: 2.34.1' },
      { available: false, tool: 'missing', expectedLog: '🔶 missing: not available' }
    ];
    
    logCases.forEach(({ available, tool, version, expectedLog }) => {
      test(`should log ${tool} ${available ? 'success' : 'failure'}`, async () => {
        if (available) {
          mockExecSync.mockReturnValue(`${tool} version ${version}`);
        } else {
          mockExecSync.mockImplementation(() => { throw new Error('failed'); });
        }
        const result = await toolChecker.checkTool(tool, { command: `${tool} --version` });
        expect(result.available).toBe(available);
        if (available) {
          expect(mockLogger.info).toHaveBeenCalledWith(expectedLog);
        } else {
          expect(mockLogger.warn).toHaveBeenCalledWith(expectedLog);
        }
      });
    });
  });
});