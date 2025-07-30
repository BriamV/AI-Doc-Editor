const { StackDetector } = require('../../core/context/StackDetector.cjs');
const fs = require('fs');

jest.mock('../../core/context/StackDetector.cjs');
jest.mock('fs');

describe('StackDetector', () => {
  let stackDetector;

  beforeEach(() => {
    stackDetector = new StackDetector();
    stackDetector.detectTypeScript = jest.fn();
    stackDetector.detectJavaScript = jest.fn();
    stackDetector.detectPython = jest.fn();
    stackDetector.detectFrameworks = jest.fn();
    stackDetector.analyzeDependencies = jest.fn();
    stackDetector.parseConfigFiles = jest.fn();
    stackDetector.handleMultiLanguage = jest.fn();
    stackDetector.checkVersionCompatibility = jest.fn();
    stackDetector.recommendTools = jest.fn();
    
    fs.existsSync = jest.fn();
    fs.readFileSync = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TypeScript/JavaScript detection', () => {
    test('should detect TypeScript project', () => {
      fs.existsSync.mockImplementation((path) => {
        return path === 'tsconfig.json' || path === 'package.json';
      });
      
      fs.readFileSync.mockImplementation((path) => {
        if (path === 'tsconfig.json') return '{"compilerOptions": {"target": "ES2020"}}';
        if (path === 'package.json') return '{"dependencies": {"typescript": "^5.0.0"}}';
      });
      
      stackDetector.detectTypeScript.mockReturnValue({
        detected: true,
        version: '5.0.0',
        config: 'tsconfig.json',
        target: 'ES2020',
        features: ['strict-mode', 'decorators']
      });
      
      const result = stackDetector.detectTypeScript();
      
      expect(result.detected).toBe(true);
      expect(result.version).toBe('5.0.0');
      expect(result.config).toBe('tsconfig.json');
    });

    test('should detect JavaScript project', () => {
      fs.existsSync.mockImplementation((path) => {
        return path === 'package.json';
      });
      
      fs.readFileSync.mockReturnValue('{"main": "index.js", "type": "module"}');
      
      stackDetector.detectJavaScript.mockReturnValue({
        detected: true,
        type: 'module',
        main: 'index.js',
        features: ['es6-modules', 'async-await']
      });
      
      const result = stackDetector.detectJavaScript();
      
      expect(result.detected).toBe(true);
      expect(result.type).toBe('module');
    });
  });

  describe('Python stack identification', () => {
    test('should detect Python project with requirements.txt', () => {
      fs.existsSync.mockImplementation((path) => {
        return path === 'requirements.txt' || path === 'setup.py';
      });
      
      fs.readFileSync.mockReturnValue('fastapi==0.104.1\npydantic==2.5.0\nuvicorn==0.24.0');
      
      stackDetector.detectPython.mockReturnValue({
        detected: true,
        version: '3.11',
        packageManager: 'pip',
        dependencies: ['fastapi', 'pydantic', 'uvicorn'],
        configFiles: ['requirements.txt', 'setup.py']
      });
      
      const result = stackDetector.detectPython();
      
      expect(result.detected).toBe(true);
      expect(result.packageManager).toBe('pip');
      expect(result.dependencies).toContain('fastapi');
    });

    test('should detect Python project with pyproject.toml', () => {
      fs.existsSync.mockImplementation((path) => {
        return path === 'pyproject.toml';
      });
      
      fs.readFileSync.mockReturnValue('[tool.poetry]\nname = "myproject"\n[tool.poetry.dependencies]\nfastapi = "^0.104.0"');
      
      stackDetector.detectPython.mockReturnValue({
        detected: true,
        version: '3.11',
        packageManager: 'poetry',
        dependencies: ['fastapi'],
        configFiles: ['pyproject.toml']
      });
      
      const result = stackDetector.detectPython();
      
      expect(result.detected).toBe(true);
      expect(result.packageManager).toBe('poetry');
    });
  });

  describe('Framework detection (React, FastAPI)', () => {
    test('should detect React frontend framework', () => {
      fs.readFileSync.mockReturnValue('{"dependencies": {"react": "^18.2.0", "react-dom": "^18.2.0"}}');
      
      stackDetector.detectFrameworks.mockReturnValue({
        frontend: {
          framework: 'react',
          version: '18.2.0',
          features: ['hooks', 'jsx', 'typescript-support'],
          buildTool: 'vite'
        },
        backend: null
      });
      
      const result = stackDetector.detectFrameworks();
      
      expect(result.frontend.framework).toBe('react');
      expect(result.frontend.version).toBe('18.2.0');
      expect(result.frontend.features).toContain('hooks');
    });

    test('should detect FastAPI backend framework', () => {
      fs.readFileSync.mockReturnValue('fastapi==0.104.1\npydantic==2.5.0\nuvicorn==0.24.0');
      
      stackDetector.detectFrameworks.mockReturnValue({
        frontend: null,
        backend: {
          framework: 'fastapi',
          version: '0.104.1',
          features: ['async-support', 'automatic-docs', 'pydantic-validation'],
          server: 'uvicorn'
        }
      });
      
      const result = stackDetector.detectFrameworks();
      
      expect(result.backend.framework).toBe('fastapi');
      expect(result.backend.version).toBe('0.104.1');
      expect(result.backend.features).toContain('async-support');
    });

    test('should detect full-stack React + FastAPI', () => {
      stackDetector.detectFrameworks.mockReturnValue({
        frontend: { framework: 'react', version: '18.2.0', features: ['hooks', 'jsx'], buildTool: 'vite' },
        backend: { framework: 'fastapi', version: '0.104.1', features: ['async-support', 'automatic-docs'], server: 'uvicorn' }
      });
      
      const result = stackDetector.detectFrameworks();
      
      expect(result.frontend.framework).toBe('react');
      expect(result.backend.framework).toBe('fastapi');
    });
  });

  describe('Dependencies analysis', () => {
    test('should analyze frontend dependencies', () => {
      const packageJson = {
        dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0', zustand: '^4.4.0' },
        devDependencies: { '@types/react': '^18.2.0', vite: '^4.4.0', jest: '^29.5.0' }
      };
      
      stackDetector.analyzeDependencies.mockReturnValue({
        runtime: ['react', 'react-dom', 'zustand'],
        development: ['@types/react', 'vite', 'jest'],
        security: { vulnerabilities: 0, outdated: 1 },
        bundleSize: { estimated: '2.5MB', critical: false }
      });
      
      const result = stackDetector.analyzeDependencies(packageJson);
      
      expect(result.runtime).toContain('react');
      expect(result.development).toContain('jest');
      expect(result.security.vulnerabilities).toBe(0);
    });

    test('should analyze backend dependencies', () => {
      const requirements = ['fastapi==0.104.1', 'pydantic==2.5.0', 'pytest==7.4.0'];
      
      stackDetector.analyzeDependencies.mockReturnValue({
        runtime: ['fastapi', 'pydantic'],
        development: ['pytest'],
        security: { vulnerabilities: 0, outdated: 0 },
        performance: { asyncSupport: true, criticalDeps: ['fastapi'] }
      });
      
      const result = stackDetector.analyzeDependencies(requirements);
      
      expect(result.runtime).toContain('fastapi');
      expect(result.development).toContain('pytest');
      expect(result.performance.asyncSupport).toBe(true);
    });
  });

  describe('Configuration file parsing', () => {
    test('should parse TypeScript configuration', () => {
      const tsConfig = {
        compilerOptions: { target: 'ES2020', module: 'ESNext', strict: true, esModuleInterop: true }
      };
      
      stackDetector.parseConfigFiles.mockReturnValue({
        typescript: { target: 'ES2020', module: 'ESNext', strict: true, features: ['strict-mode', 'es-modules'] }
      });
      
      const result = stackDetector.parseConfigFiles(['tsconfig.json']);
      
      expect(result.typescript.target).toBe('ES2020');
      expect(result.typescript.strict).toBe(true);
    });

    test('should parse Vite configuration', () => {
      stackDetector.parseConfigFiles.mockReturnValue({
        vite: { plugins: ['react', 'typescript'], build: { target: 'ES2020', outDir: 'dist' }, server: { port: 3000 } }
      });
      
      const result = stackDetector.parseConfigFiles(['vite.config.ts']);
      
      expect(result.vite.plugins).toContain('react');
      expect(result.vite.server.port).toBe(3000);
    });
  });

  describe('Multi-language projects', () => {
    test('should handle TypeScript + Python stack', () => {
      stackDetector.handleMultiLanguage.mockReturnValue({
        languages: ['typescript', 'python'],
        architecture: 'full-stack',
        frameworks: {
          frontend: { name: 'react', language: 'typescript' },
          backend: { name: 'fastapi', language: 'python' }
        },
        integration: { api: 'rest', communication: 'http' }
      });
      
      const result = stackDetector.handleMultiLanguage();
      
      expect(result.languages).toContain('typescript');
      expect(result.languages).toContain('python');
      expect(result.architecture).toBe('full-stack');
    });
  });

  describe('Version compatibility', () => {
    test('should check TypeScript version compatibility', () => {
      stackDetector.checkVersionCompatibility.mockReturnValue({
        typescript: { version: '5.0.0', compatible: true, issues: [] },
        react: { version: '18.2.0', compatible: true, issues: [] },
        node: { version: '18.16.0', compatible: true, issues: [] }
      });
      
      const result = stackDetector.checkVersionCompatibility();
      
      expect(result.typescript.compatible).toBe(true);
      expect(result.react.compatible).toBe(true);
    });

    test('should detect version incompatibilities', () => {
      stackDetector.checkVersionCompatibility.mockReturnValue({
        typescript: { version: '3.9.0', compatible: false, issues: ['outdated-version'] },
        react: { version: '16.14.0', compatible: false, issues: ['missing-hooks-support'] }
      });
      
      const result = stackDetector.checkVersionCompatibility();
      
      expect(result.typescript.compatible).toBe(false);
      expect(result.react.issues).toContain('missing-hooks-support');
    });
  });

  describe('Tool recommendations', () => {
    test('should recommend tools for TypeScript + React', () => {
      const stackInfo = { languages: ['typescript'], frameworks: { frontend: { name: 'react' } } };
      
      stackDetector.recommendTools.mockReturnValue({
        linting: ['eslint', '@typescript-eslint/parser'],
        testing: ['jest', '@testing-library/react'],
        building: ['vite', 'tsc'],
        security: ['snyk', 'audit']
      });
      
      const result = stackDetector.recommendTools(stackInfo);
      
      expect(result.linting).toContain('eslint');
      expect(result.testing).toContain('jest');
      expect(result.building).toContain('vite');
    });

    test('should recommend tools for Python + FastAPI', () => {
      const stackInfo = { languages: ['python'], frameworks: { backend: { name: 'fastapi' } } };
      
      stackDetector.recommendTools.mockReturnValue({
        linting: ['flake8', 'mypy'],
        testing: ['pytest', 'pytest-asyncio'],
        security: ['bandit', 'safety'],
        formatting: ['black', 'isort']
      });
      
      const result = stackDetector.recommendTools(stackInfo);
      
      expect(result.linting).toContain('flake8');
      expect(result.testing).toContain('pytest');
      expect(result.security).toContain('bandit');
    });
  });
});