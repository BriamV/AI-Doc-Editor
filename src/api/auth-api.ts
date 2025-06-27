/**
 * Authentication API client
 * T-02: OAuth 2.0 + JWT backend integration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface LoginResponse {
  auth_url: string;
  provider: string;
  state: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'editor' | 'admin';
    provider: 'google' | 'microsoft';
  };
}

export interface UserResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'editor' | 'admin';
    provider: 'google' | 'microsoft';
  };
  authenticated: boolean;
}

class AuthAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/auth`;
  }

  /**
   * Initiate OAuth login flow
   * T-02-ST1: OAuth flow initiation
   */
  async initiateLogin(provider: 'google' | 'microsoft'): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider }),
    });

    if (!response.ok) {
      throw new Error(`Login initiation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Handle OAuth callback and get tokens
   * T-02-ST1: OAuth callback handling
   */
  async handleCallback(code: string, provider: string, state?: string): Promise<TokenResponse> {
    const params = new URLSearchParams({ code, provider });
    if (state) params.append('state', state);

    const response = await fetch(`${this.baseURL}/callback?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`OAuth callback failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Refresh access token
   * T-02-ST2: Token refresh
   */
  async refreshToken(refreshToken: string): Promise<Omit<TokenResponse, 'user'>> {
    const response = await fetch(`${this.baseURL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get current user profile
   * T-02-ST2: User profile with roles
   */
  async getCurrentUser(accessToken: string): Promise<UserResponse> {
    const response = await fetch(`${this.baseURL}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get user failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if backend is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/healthz`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const authAPI = new AuthAPI();
