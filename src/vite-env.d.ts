/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

import type { User } from '@type/auth';

declare global {
  interface Window {
    app?: {
      login: (user: User) => void;
    };
  }
}
