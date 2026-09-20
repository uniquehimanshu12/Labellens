import { Inspector } from '../types';
import { CURRENT_INSPECTOR } from '../data/demoData';

const AUTH_KEY = 'labellens_auth_user';

export const authService = {
  getCurrentUser(): Inspector | null {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Auth error:', e);
    }
    // Default logged in with prototype inspector credentials
    return CURRENT_INSPECTOR;
  },

  login(inspectorId: string, password: string): { success: boolean; error?: string; user?: Inspector } {
    const cleanId = inspectorId.trim().toUpperCase();
    
    // Prototype credentials requirement from user prompt:
    // Inspector ID: INS-1042, Password: demo123
    if (cleanId === 'INS-1042' && password === 'demo123') {
      const user: Inspector = CURRENT_INSPECTOR;
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return { success: true, user };
    }

    // Allow flexible test credentials if starting with INS-
    if (cleanId.startsWith('INS-') && password.length >= 4) {
      const user: Inspector = {
        id: cleanId,
        name: cleanId === 'INS-1042' ? 'Rahul Sharma' : `Inspector ${cleanId.replace('INS-', '')}`,
        role: 'Field Inspector',
        department: 'Consumer Affairs — Prototype',
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return { success: true, user };
    }

    return {
      success: false,
      error: 'Invalid credentials. For prototype use Inspector ID: INS-1042 and Password: demo123',
    };
  },

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },
};
