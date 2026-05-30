// Token debugging utility
export function debugTokens() {
  if (typeof window !== 'undefined') {
    const adminToken = localStorage.getItem('admin_token');
    const cpToken = localStorage.getItem('cp_token');
    
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

export function testTokenStorage() {
  if (typeof window !== 'undefined') {
    // Test storing tokens
    const testAdminToken = 'test-admin-token-123';
    const testCpToken = 'test-cp-token-456';
    
    localStorage.setItem('admin_token', testAdminToken);
    localStorage.setItem('cp_token', testCpToken);
    
    // Test retrieving tokens
    const retrievedAdminToken = localStorage.getItem('admin_token');
    const retrievedCpToken = localStorage.getItem('cp_token');
    
    console.log('=== TOKEN STORAGE TEST ===');
    console.log('Stored Admin Token:', testAdminToken);
    console.log('Retrieved Admin Token:', retrievedAdminToken);
    console.log('Stored CP Token:', testCpToken);
    console.log('Retrieved CP Token:', retrievedCpToken);
    console.log('Admin Token Match:', testAdminToken === retrievedAdminToken);
    console.log('CP Token Match:', testCpToken === retrievedCpToken);
    console.log('========================');
    
    return {
      adminTokenMatch: testAdminToken === retrievedAdminToken,
      cpTokenMatch: testCpToken === retrievedCpToken
    };
  }
  return null;
}
