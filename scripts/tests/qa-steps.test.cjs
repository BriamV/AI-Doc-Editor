/**
 * Pruebas unitarias para QASteps
 * Objetivo: ≥80% cobertura de código
 */

const QASteps = require('../utils/qa-steps.cjs');

describe('QASteps', () => {
  let qaSteps;
  const mockRootDir = '/test/root';
  const mockOptions = { autoInstall: false };

  beforeEach(() => {
    qaSteps = new QASteps(mockRootDir, mockOptions);
  });

  describe('constructor', () => {
    test('debe inicializar correctamente con parámetros válidos', () => {
      expect(qaSteps.rootDir).toBe(mockRootDir);
      expect(qaSteps.options).toEqual(mockOptions);
      expect(qaSteps.frontendSteps).toBeDefined();
      expect(qaSteps.backendSteps).toBeDefined();
      expect(qaSteps.securitySteps).toBeDefined();
    });
  });

  describe('getSteps', () => {
    test('debe retornar array con todos los pasos', () => {
      const steps = qaSteps.getSteps();
      
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      
      // Verificar estructura de pasos
      steps.forEach(step => {
        expect(step).toHaveProperty('name');
        expect(step).toHaveProperty('category');
        expect(step).toHaveProperty('execute');
        expect(step).toHaveProperty('errorMessage');
        expect(typeof step.execute).toBe('function');
      });
    });

    test('debe incluir pasos de todas las categorías', () => {
      const steps = qaSteps.getSteps();
      const categories = steps.map(step => step.category);
      
      expect(categories).toContain('frontend');
      expect(categories).toContain('backend');
      expect(categories).toContain('security');
    });
  });

  describe('getStepsByCategory', () => {
    test('debe filtrar pasos por categoría frontend', () => {
      const frontendSteps = qaSteps.getStepsByCategory('frontend');
      
      expect(Array.isArray(frontendSteps)).toBe(true);
      frontendSteps.forEach(step => {
        expect(step.category).toBe('frontend');
      });
    });

    test('debe filtrar pasos por categoría backend', () => {
      const backendSteps = qaSteps.getStepsByCategory('backend');
      
      expect(Array.isArray(backendSteps)).toBe(true);
      backendSteps.forEach(step => {
        expect(step.category).toBe('backend');
      });
    });

    test('debe retornar array vacío para categoría inexistente', () => {
      const nonExistentSteps = qaSteps.getStepsByCategory('nonexistent');
      
      expect(Array.isArray(nonExistentSteps)).toBe(true);
      expect(nonExistentSteps.length).toBe(0);
    });
  });

  describe('getStepsInfo', () => {
    test('debe retornar información estadística completa', () => {
      const info = qaSteps.getStepsInfo();
      
      expect(info).toHaveProperty('total');
      expect(info).toHaveProperty('categories');
      expect(info).toHaveProperty('byCategory');
      
      expect(typeof info.total).toBe('number');
      expect(info.total).toBeGreaterThan(0);
      
      expect(typeof info.categories).toBe('object');
      expect(typeof info.byCategory).toBe('object');
      
      expect(info.byCategory).toHaveProperty('frontend');
      expect(info.byCategory).toHaveProperty('backend');
      expect(info.byCategory).toHaveProperty('security');
    });

    test('debe contar correctamente los pasos por categoría', () => {
      const info = qaSteps.getStepsInfo();
      const totalByCategory = 
        info.byCategory.frontend + 
        info.byCategory.backend + 
        info.byCategory.security;
      
      expect(totalByCategory).toBe(info.total);
    });
  });

  describe('_validateSteps', () => {
    test('debe validar pasos correctos sin errores', () => {
      const validSteps = [
        {
          name: 'Test Step',
          category: 'test',
          execute: () => {},
          errorMessage: 'Test failed'
        }
      ];
      
      expect(() => {
        qaSteps._validateSteps(validSteps);
      }).not.toThrow();
    });

    test('debe lanzar error para paso sin propiedades requeridas', () => {
      const invalidSteps = [
        {
          name: 'Test Step'
          // Faltan propiedades requeridas
        }
      ];
      
      expect(() => {
        qaSteps._validateSteps(invalidSteps);
      }).toThrow();
    });

    test('debe lanzar error para execute que no es función', () => {
      const invalidSteps = [
        {
          name: 'Test Step',
          category: 'test',
          execute: 'not a function', // Debe ser función
          errorMessage: 'Test failed'
        }
      ];
      
      expect(() => {
        qaSteps._validateSteps(invalidSteps);
      }).toThrow();
    });
  });
});