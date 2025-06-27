import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.css';
await import('katex/dist/katex.min.css');

import './i18n';
import useStore from '@store/store';

if (import.meta.env.MODE === 'test') {
  // expose store for Cypress tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).useStore = useStore;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
