import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.css';
await import('katex/dist/katex.min.css');

import './i18n';
import useStore from '@store/store';

if (import.meta.env.DEV) {
  // Expose a dedicated testing interface on the window object for Cypress
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).app = {
    // Function to set the user state for testing purposes
    login: (user: any) => {
      useStore.getState().setUser(user);
    },
    // We can add other testing utilities here in the future
  };
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
