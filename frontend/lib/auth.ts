const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

/**
 * Decode a JWT payload. JWTs use base64url ('-' and '_' instead of '+' and '/'),
 * which atob() rejects — decoding the raw segment throws for many real tokens.
 */
export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export const auth = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  setRefreshToken: (refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  setUser: (user: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  setAuth: (accessToken: string, refreshToken: string, user: any) => {
    auth.setToken(accessToken);
    auth.setRefreshToken(refreshToken);
    auth.setUser(user);
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  isAuthenticated: (): boolean => {
    return !!auth.getToken() && !!auth.getRefreshToken();
  },

  isTokenExpired: (): boolean => {
    const token = auth.getToken();
    if (!token) return true;

    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return true;

    const exp = payload.exp * 1000; // Convert to milliseconds
    // Add a small buffer (30 seconds) to account for clock skew
    return Date.now() >= exp - 30000;
  },

  getTokenExpirationTime: (): number | null => {
    const token = auth.getToken();
    if (!token) return null;

    try {
      const payload = decodeJwtPayload(token);
      if (!payload?.exp) return null;
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  },
};
