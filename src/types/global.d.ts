// Global window augmentations for E2E and testing helpers

import type { User } from '@type/auth';

declare global {
  interface Window {
    idbKeyval?: {
      get: (name: string) => Promise<unknown>;
      set: (name: string, value: unknown) => Promise<void>;
    };
    app?: {
      login: (user: User) => void;
    };
  }
}

export {};
