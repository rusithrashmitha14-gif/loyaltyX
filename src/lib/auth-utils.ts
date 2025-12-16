// Authentication utility functions for frontend

export interface Business {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  status: string;
  data: {
    business: Business;
    token: string;
  };
  message: string;
}

export interface SignupResponse {
  status: string;
  data: Business;
  message: string;
}

// JWT token utilities
export const TOKEN_KEY = 'loyaltyx_token';

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

// Decode JWT token to get business info (client-side only)
export function getBusinessFromToken(): Business | null {
  const token = getToken();
  if (!token) return null;

  try {
    // Decode JWT payload (client-side only - no verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.businessId,
      email: payload.email,
      name: '', // Name is not in JWT payload
      createdAt: '', // CreatedAt is not in JWT payload
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// API call functions
export async function signupBusiness(
  name: string,
  email: string,
  password: string
): Promise<SignupResponse> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Signup failed');
  }

  return data;
}

export async function loginBusiness(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data;
}

// Navigation utilities
export function redirectToDashboard(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard';
  }
}

export function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function logout(): void {
  removeToken();
  redirectToLogin();
}












