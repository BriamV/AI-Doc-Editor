import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.css';
await import('katex/dist/katex.min.css');

import './i18n';
import useStore from '@store/store';
import type { User } from '@store/store';

// Extend the Window interface to include our testing API
declare global {
  interface Window {
    app?: {
      login: (user: User) => void;
    };
  }
}

if (import.meta.env.DEV) {
  window.app = {
    // Function to set the user state for testing purposes
    login: (user: User) => {
      useStore.getState().setUser(user);
    },
    // You can add other testing utilities here in the future
  };
}

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);