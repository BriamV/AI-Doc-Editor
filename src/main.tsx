import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.css';
await import('katex/dist/katex.min.css');

import './i18n';
import useStore from '@store/store';
import type { User } from '@type/auth';

// Expose a dedicated testing interface for Cypress.
// This is always available in DEV mode, test environments, and CI for E2E tests
// CI environments are detected via process.env.CI that GitHub Actions sets automatically
// The explicit setting ensures it's always available for Cypress tests regardless of environment

// Garantizamos que window.app esté disponible en cualquier entorno de pruebas
if (
  import.meta.env.DEV || 
  import.meta.env.VITE_ENABLE_TESTING === 'true' || 
  (typeof process !== 'undefined' && process.env?.CI === 'true') ||
  // Ensure it's always available when Cypress is running
  (typeof window !== 'undefined' && (window as any).Cypress)
) {
  // This relies on the global declaration in `cypress/support/e2e.ts`.
  window.app = {
    login: (user: User) => {
      useStore.getState().setUser(user);
    },
  };
  
  console.log('🧪 Test helpers exposed on window.app');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
