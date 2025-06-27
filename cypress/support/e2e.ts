// cypress/support/e2e.ts

// Extiende la interfaz global Window para que TypeScript reconozca la interfaz de prueba `app`.
declare global {
  interface Window {
    app: {
      login: (user: {
        id: string;
        email: string;
        name: string;
        role: 'admin' | 'user';
        provider: string;
      }) => void;
    };
  }
}

// Añadir un export vacío convierte este archivo en un módulo, lo que es necesario
// para aumentar el alcance global de TypeScript.
export {};


