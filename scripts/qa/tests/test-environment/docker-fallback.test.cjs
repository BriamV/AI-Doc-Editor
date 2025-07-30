const ToolChecker = require('../../core/environment/ToolChecker.cjs');
const VenvManager = require('../../utils/VenvManager.cjs');

jest.mock('child_process');
jest.mock('fs');

describe('Docker Fallback & Cross-Platform (RF-007)', () => {
  let toolChecker, mockLogger, mockExecSync, mockFs;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), level: 'info' };
    mockExecSync = require('child_process').execSync;
    mockFs = require('fs');
    toolChecker = new ToolChecker(mockLogger);
    jest.clearAllMocks();
  });

  describe('Docker detection strategies', () => {
    const dockerCases = [
      { scenario: 'standard', output: 'Docker version 20.10.21', succeeds: [true], expected: { available: true, method: 'standard' }},
      { scenario: 'wsl-fallback', output: 'Docker version 20.10.21', succeeds: [false, true], expected: { available: true, method: 'wsl-fallback' }},
      { scenario: 'unavailable', succeeds: [false, false], expected: { available: false }}
    ];

    dockerCases.forEach(({ scenario, output, succeeds, expected }) => {
      test(`should handle ${scenario}`, async () => {
        let callCount = 0;
        mockExecSync.mockImplementation(() => {
          if (succeeds[callCount++]) return output;
          throw new Error('failed');
        });
        
        const result = await toolChecker.checkTool('docker', { command: 'docker --version' });
        expect(result.available).toBe(expected.available);
        if (expected.method) expect(result.detectionMethod).toBe(expected.method);
      });
    });
  });

  describe('MegaLinter fallback strategies', () => {
    const cases = [
      { available: true, expected: { available: true }},
      { available: false, expected: { available: false, fallback: 'docker' }}
    ];

    cases.forEach(({ available, expected }) => {
      test(`should handle ${available ? 'available' : 'fallback'}`, async () => {
        if (available) {
          mockExecSync.mockReturnValue('mega-linter-runner@6.22.2');
        } else {
          mockExecSync.mockImplementation(() => { throw new Error('not found'); });
        }
        
        const result = await toolChecker.checkTool('megalinter', { command: 'npm list mega-linter-runner', fallback: 'docker' });
        expect(result.available).toBe(expected.available);
        if (expected.fallback) expect(result.fallback).toBe(expected.fallback);
      });
    });
  });

  describe('Cross-platform venv paths', () => {
    const venvCases = [
      { platform: 'win32', tool: 'black', path: '.venv/Scripts/black.exe' },
      { platform: 'linux', tool: 'pylint', path: '.venv/bin/pylint' }
    ];

    venvCases.forEach(({ platform, tool, path }) => {
      test(`should detect ${tool} in ${platform} venv`, async () => {
        Object.defineProperty(process, 'platform', { value: platform });
        mockFs.existsSync.mockImplementation((p) => p === path);
        mockExecSync.mockReturnValue(`${tool} 2.0.0`);
        const result = await toolChecker.checkTool(tool, { command: `${tool} --version` });
        expect(result.available).toBe(true);
        expect(result.detectionMethod).toBe('venv');
      });
    });
  });

  describe('VenvManager cross-platform', () => {
    const cases = [
      { platform: 'win32', expectedBin: '.venv/Scripts', expectedPython: '.venv/Scripts/python.exe' },
      { platform: 'linux', expectedBin: '.venv/bin', expectedPython: '.venv/bin/python' }
    ];

    cases.forEach(({ platform, expectedBin, expectedPython }) => {
      test(`should handle ${platform}`, () => {
        Object.defineProperty(process, 'platform', { value: platform });
        const venvManager = new VenvManager(process.cwd(), mockLogger);
        expect(venvManager._getVenvBinPath('.venv')).toBe(expectedBin);
        expect(venvManager._getVenvPythonPath('.venv')).toBe(expectedPython);
      });
    });
  });

  describe('Docker error handling', () => {
    test('should handle all Docker errors gracefully', async () => {
      mockExecSync.mockImplementation(() => { throw new Error('failed'); });
      const result = await toolChecker.checkTool('docker', { command: 'docker --version' });
      expect(result.available).toBe(false);
      expect(result.error).toBe('All Docker detection methods failed');
      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Fallback chain validation', () => {
    const cases = [{ tool: 'megalinter', fallback: 'docker' }, { tool: 'snyk', fallback: 'skip' }];

    cases.forEach(({ tool, fallback }) => {
      test(`should preserve ${tool} fallback`, async () => {
        mockExecSync.mockImplementation(() => { throw new Error('not found'); });
        const result = await toolChecker.checkTool(tool, { command: `${tool} --version`, fallback });
        expect(result.available).toBe(false);
        expect(result.fallback).toBe(fallback);
      });
    });
  });

  describe('Platform-specific commands', () => {
    test('should try multiple commands on all platforms', async () => {
      mockExecSync.mockImplementation(() => { throw new Error('failed'); });
      const result = await toolChecker.checkTool('docker', { command: 'docker --version' });
      expect(result.available).toBe(false);
      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with environment checker fallback logic', () => {
    test('should integrate fallback recommendations', async () => {
      const tools = {
        megalinter: { command: 'npm list mega-linter-runner', description: 'MegaLinter', fallback: 'docker' },
        docker: { command: 'docker --version', description: 'Docker', fallback: null }
      };
      
      mockExecSync
        .mockImplementationOnce(() => { throw new Error('mega-linter not found'); })
        .mockReturnValueOnce('Docker version 20.10.21');
      
      const results = await toolChecker.checkTools(tools);
      
      const megalinterResult = results.get('megalinter');
      const dockerResult = results.get('docker');
      
      expect(megalinterResult.available).toBe(false);
      expect(megalinterResult.fallback).toBe('docker');
      expect(dockerResult.available).toBe(true);
    });
  });
});