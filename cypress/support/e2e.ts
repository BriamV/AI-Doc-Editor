// cypress/support/e2e.ts

// Importa los tipos necesarios desde el store de tu aplicación.
// La ruta debe ser relativa desde este archivo al archivo del store.
import { StoreApi } from 'zustand';
import { StoreState } from '../../src/store/store';

// Extiende la interfaz global Window para que TypeScript reconozca `useStore`.
declare global {
  interface Window {
    useStore: StoreApi<StoreState>;
  }
}

