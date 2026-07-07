// Token management utility
export class TokenManager {
  static readonly ADMIN_TOKEN_KEY = 'admin_token';
  static readonly CP_TOKEN_KEY = 'cp_token';

  static setTokens(adminToken: string, cpToken?: string | null) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ADMIN_TOKEN_KEY, adminToken);
      if (cpToken) {
        localStorage.setItem(this.CP_TOKEN_KEY, cpToken);
      } else {
        localStorage.removeItem(this.CP_TOKEN_KEY);
      }
      
      // Tokens stored silently
    }
  }

  static getAdminToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ADMIN_TOKEN_KEY);
    }
    return null;
  }

  static getCPToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.CP_TOKEN_KEY);
    }
    return null;
  }

  static clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ADMIN_TOKEN_KEY);
      localStorage.removeItem(this.CP_TOKEN_KEY);
    }
  }

  static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const adminToken = this.getAdminToken();
    const cpToken = this.getCPToken();
    
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    
    if (cpToken) {
      headers['X-CP-Token'] = cpToken;
    }
    
    return headers;
  }

  static debugTokens() {
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem(this.ADMIN_TOKEN_KEY);
      const cpToken = localStorage.getItem(this.CP_TOKEN_KEY);
      
      return {
        adminToken: adminToken ? 'PRESENT' : 'MISSING',
        cpToken: cpToken ? 'PRESENT' : 'MISSING',
      };
    }
    return null;
  }
}
