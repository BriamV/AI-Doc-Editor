/**
 * Pruebas unitarias para QARunner
 * Objetivo: ≥80% cobertura de código
 */

const QARunner = require('../utils/qa-runner.cjs');

describe('QARunner', () => {
  let qaRunner;
  const mockOptions = { verbose: true };

  beforeEach(() => {
    qaRunner = new QARunner(mockOptions);
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('debe inicializar correctamente con opciones', () => {
      expect(qaRunner.options).toEqual(mockOptions);
    });

    test('debe inicializar con opciones vacías por defecto', () => {
      const defaultRunner = new QARunner();
      expect(defaultRunner.options).toEqual({});
    });
  });

  describe('runStep', () => {
    test('debe ejecutar paso exitoso correctamente', async () => {
      const mockStep = {
        name: 'Test Step',
        execute: jest.fn().mockResolvedValue(true),
        errorMessage: 'Test failed'
      };

      const result = await qaRunner.runStep(mockStep, 0, 1);

      expect(result).toBe(true);
      expect(mockStep.execute).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('\n1/1 Test Step...');
    });

    test('debe manejar paso que falla', async () => {
      const mockStep = {
        name: 'Failing Step',
        execute: jest.fn().mockRejectedValue(new Error('Test error')),
        errorMessage: 'Step failed'
      };

      const result = await qaRunner.runStep(mockStep, 0, 1);

      expect(result).toBe(false);
      expect(mockStep.execute).toHaveBeenCalled();
    });

    test('debe mostrar detalles del error en modo verbose', async () => {
      const verboseRunner = new QARunner({ verbose: true });
      const mockStep = {
        name: 'Failing Step',
        execute: jest.fn().mockRejectedValue(new Error('Detailed error')),
        errorMessage: 'Step failed'
      };

      await verboseRunner.runStep(mockStep, 0, 1);

      expect(console.error).toHaveBeenCalledWith(
        'Detalles del error:', 
        'Detailed error'
      );
    });
  });

  describe('runSteps', () => {
    test('debe ejecutar todos los pasos cuando son exitosos', async () => {
      const mockSteps = [
        {
          name: 'Step 1',
          execute: jest.fn().mockResolvedValue(true),
          errorMessage: 'Step 1 failed'
        },
        {
          name: 'Step 2',
          execute: jest.fn().mockResolvedValue(true),
          errorMessage: 'Step 2 failed'
        }
      ];

      const result = await qaRunner.runSteps(mockSteps);

      expect(result).toBe(true);
      expect(mockSteps[0].execute).toHaveBeenCalled();
      expect(mockSteps[1].execute).toHaveBeenCalled();
    });

    test('debe detenerse en el primer paso que falla', async () => {
      const mockSteps = [
        {
          name: 'Step 1',
          execute: jest.fn().mockResolvedValue(true),
          errorMessage: 'Step 1 failed'
        },
        {
          name: 'Step 2',
          execute: jest.fn().mockRejectedValue(new Error('Step 2 error')),
          errorMessage: 'Step 2 failed'
        },
        {
          name: 'Step 3',
          execute: jest.fn().mockResolvedValue(true),
          errorMessage: 'Step 3 failed'
        }
      ];

      const result = await qaRunner.runSteps(mockSteps);

      expect(result).toBe(false);
      expect(mockSteps[0].execute).toHaveBeenCalled();
      expect(mockSteps[1].execute).toHaveBeenCalled();
      expect(mockSteps[2].execute).not.toHaveBeenCalled();
    });
  });

  describe('runStepsParallel', () => {
    test('debe ejecutar pasos en paralelo exitosamente', async () => {
      const mockSteps = [
        {
          name: 'Parallel Step 1',
          execute: jest.fn().mockResolvedValue(true),
          errorMessage: 'Parallel Step 1 failed'
        },
        {
          name: 'Parallel Step 2',
          execute: jest.fn().mockResolvedValue(true),
          errorMessage: 'Parallel Step 2 failed'
        }
      ];

      const result = await qaRunner.runStepsParallel(mockSteps);

      expect(result).toBe(true);
      expect(mockSteps[0].execute).toHaveBeenCalled();
      expect(mockSteps[1].execute).toHaveBeenCalled();
    });

    test('debe fallar si algún paso en paralelo falla', async () => {
      const mockSteps = [
        {
          name: 'Parallel Step 1',
          execute: jest.fn().mockResolvedValue(true),
          errorMessage: 'Parallel Step 1 failed'
        },
        {
          name: 'Parallel Step 2',
          execute: jest.fn().mockRejectedValue(new Error('Parallel error')),
          errorMessage: 'Parallel Step 2 failed'
        }
      ];

      const result = await qaRunner.runStepsParallel(mockSteps);

      expect(result).toBe(false);
    });

    test('debe reportar todos los fallos en ejecución paralela', async () => {
      const mockSteps = [
        {
          name: 'Failing Step 1',
          execute: jest.fn().mockRejectedValue(new Error('Error 1')),
          errorMessage: 'Step 1 failed'
        },
        {
          name: 'Failing Step 2',
          execute: jest.fn().mockRejectedValue(new Error('Error 2')),
          errorMessage: 'Step 2 failed'
        }
      ];

      await qaRunner.runStepsParallel(mockSteps);

      // Verificar que se reportaron ambos fallos
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('2 pasos fallaron')
      );
    });
  });
});