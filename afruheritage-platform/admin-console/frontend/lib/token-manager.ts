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
      
      // Debug logging
      console.log('=== TOKENS STORED ===');
      console.log('Admin Token:', adminToken ? 'PRESENT' : 'MISSING');
      console.log('Admin Token Length:', adminToken ? adminToken.length : 0);
      console.log('CP Token:', cpToken ? 'PRESENT' : 'MISSING');
      console.log('CP Token Length:', cpToken ? cpToken.length : 0);
      console.log('CP Token Value:', cpToken);
      console.log('==================');
    }
  }

  static getAdminToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(this.ADMIN_TOKEN_KEY);
      console.log('Admin Token retrieved:', token ? 'PRESENT' : 'MISSING');
      return token;
    }
    return null;
  }

  static getCPToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(this.CP_TOKEN_KEY);
      console.log('CP Token retrieved:', token ? 'PRESENT' : 'MISSING');
      console.log('CP Token Value:', token);
      return token;
    }
    return null;
  }

  static clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ADMIN_TOKEN_KEY);
      localStorage.removeItem(this.CP_TOKEN_KEY);
      console.log('Tokens cleared');
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
    
    // Debug logging
    console.log('=== AUTH HEADERS ===');
    console.log('Admin Token in headers:', adminToken ? 'PRESENT' : 'MISSING');
    console.log('CP Token in headers:', cpToken ? 'PRESENT' : 'MISSING');
    console.log('Headers:', headers);
    console.log('==================');
    
    return headers;
  }

  static debugTokens() {
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem(this.ADMIN_TOKEN_KEY);
      const cpToken = localStorage.getItem(this.CP_TOKEN_KEY);
      
      console.log('=== TOKEN DEBUG ===');
      console.log('Admin Token:', adminToken ? 'PRESENT' : 'MISSING');
      console.log('Admin Token Length:', adminToken ? adminToken.length : 0);
      console.log('CP Token:', cpToken ? 'PRESENT' : 'MISSING');
      console.log('CP Token Length:', cpToken ? cpToken.length : 0);
      console.log('CP Token Value:', cpToken);
      console.log('==================');
      
      return {
        adminToken: adminToken ? 'PRESENT' : 'MISSING',
        cpToken: cpToken ? 'PRESENT' : 'MISSING',
        cpTokenValue: cpToken
      };
    }
    return null;
  }
}
