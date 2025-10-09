/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

import type { User } from '@type/auth';

// Extend ImportMeta to include Vite's env property
interface ImportMetaEnv {
  readonly VITE_ENABLE_TESTING?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly DEV?: string;
  readonly MODE: string;
  readonly PROD: boolean;
  readonly SSR: boolean;
  // Add more env variables as needed
  [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    app?: {
      login: (user: User) => void;
    };
  }
}
