import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.css';
await import('katex/dist/katex.min.css');

import './i18n';
import useStore from '@store/store';
import type { User } from '@type/auth';

if (import.meta.env.DEV) {
  // Expose a dedicated testing interface on the window object for Cypress.
  // This relies on the global declaration in `cypress/support/e2e.ts`.
  window.app = {
    login: (user: User) => {
      useStore.getState().setUser(user);
    },
  };
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);