/**
 * Authentication type definitions
 * T-02: OAuth 2.0 + JWT types
 */

export type AuthProvider = 'google' | 'microsoft';
export type UserRole = 'editor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: AuthProvider;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  provider: AuthProvider;
}

export interface LoginResponse {
  authUrl: string;
  provider: AuthProvider;
  state: string;
}

export interface CallbackRequest {
  code: string;
  state?: string;
  provider: AuthProvider;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserProfileResponse {
  user: User;
  authenticated: boolean;
}

// OAuth provider configurations
export interface OAuthConfig {
  google: {
    clientId: string;
    redirectUri: string;
    scope: string[];
  };
  microsoft: {
    clientId: string;
    redirectUri: string;
    scope: string[];
  };
}

// Role-based access control
export interface RolePermissions {
  editor: string[];
  admin: string[];
}

export const DEFAULT_PERMISSIONS: RolePermissions = {
  editor: ['document:read', 'document:write', 'document:create', 'profile:read', 'profile:update'],
  admin: [
    'document:read',
    'document:write',
    'document:create',
    'document:delete',
    'profile:read',
    'profile:update',
    'user:read',
    'user:update',
    'settings:read',
    'settings:update',
  ],
};
