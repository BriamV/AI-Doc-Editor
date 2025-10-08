import { defaultAPIEndpoint } from '@constants/auth';
import { StoreSlice } from './store';
import { User } from '../types/auth';
import { getEnvVar } from '../utils/env';

export interface AuthSlice {
  apiKey?: string;
  apiEndpoint: string;
  apiCalls: number;
  apiPopupTotal: number;
  firstVisit: boolean;
  // T-02: OAuth + JWT authentication
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  testMode: boolean; // Dual-mode: track if using test authentication
  setApiKey: (apiKey: string) => void;
  setApiEndpoint: (apiEndpoint: string) => void;
  setFirstVisit: (firstVisit: boolean) => void;
  setApiCalls: (apiCalls: number) => void;
  setApiPopupTotal: (apiPopupTotal: number) => void;
  // T-02: JWT token management
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const createAuthSlice: StoreSlice<AuthSlice> = set => ({
  apiKey: getEnvVar('VITE_OPENAI_API_KEY') || undefined,
  apiEndpoint: defaultAPIEndpoint,
  apiCalls: 0,
  firstVisit: true,
  apiPopupTotal: -1,
  // T-02: OAuth + JWT initial state
  isAuthenticated: false,
  accessToken: undefined,
  refreshToken: undefined,
  user: undefined,
  testMode: false,
  setApiKey: (apiKey: string) => {
    set((prev: AuthSlice) => ({
      ...prev,
      apiKey: apiKey,
    }));
  },
  setApiEndpoint: (apiEndpoint: string) => {
    set((prev: AuthSlice) => ({
      ...prev,
      apiEndpoint: apiEndpoint,
    }));
  },
  setApiCalls: (apiCalls: number) => {
    set((prev: AuthSlice) => ({
      ...prev,
      apiCalls: apiCalls,
    }));
  },
  setFirstVisit: (firstVisit: boolean) => {
    set((prev: AuthSlice) => ({
      ...prev,
      firstVisit: firstVisit,
    }));
  },
  setApiPopupTotal: (apiPopupTotal: number) => {
    set((prev: AuthSlice) => ({
      ...prev,
      apiPopupTotal: apiPopupTotal,
    }));
  },
  // T-02: JWT token management methods
  setTokens: (accessToken: string, refreshToken: string) => {
    set((prev: AuthSlice) => ({
      ...prev,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    }));
  },
  setUser: (user: User) => {
    set((prev: AuthSlice) => ({
      ...prev,
      user,
      isAuthenticated: true,
      testMode: user.test_mode || false, // Track test mode from user object
    }));
  },
  logout: () => {
    // Clear localStorage when logging out
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('test_mode');

    set((prev: AuthSlice) => ({
      ...prev,
      accessToken: undefined,
      refreshToken: undefined,
      user: undefined,
      isAuthenticated: false,
      testMode: false,
    }));
  },
});
