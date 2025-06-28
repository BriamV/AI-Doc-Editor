/// <reference types="vite/client" />

import type { User } from '@type/auth';

declare global {
  interface Window {
    app?: {
      login: (user: User) => void;
    };
  }
}
