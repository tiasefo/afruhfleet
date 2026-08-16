export const FRONTEND_BASE_URL = process.env.UAT_FRONTEND_BASE_URL || 'http://127.0.0.1:3002'
export const API_BASE_URL = process.env.UAT_API_BASE_URL || 'http://127.0.0.1:8100'

export const TENANT_A_ID = process.env.TENANT_A_ID || '63f1b4ac-8cf3-41c7-9ba1-a31211d259be'
export const TENANT_A_ADMIN_EMAIL = process.env.TENANT_A_ADMIN_EMAIL || 'pr7-a@afruheritage.com'
export const TENANT_A_ADMIN_PASSWORD = process.env.TENANT_A_ADMIN_PASSWORD || 'UatTest123!'

export const TENANT_B_ID = process.env.TENANT_B_ID || 'f4c513b7-380d-491c-af95-5fbc6c72c260'
export const TENANT_B_ADMIN_EMAIL = process.env.TENANT_B_ADMIN_EMAIL || 'pr7-b@afruheritage.com'
export const TENANT_B_ADMIN_PASSWORD = process.env.TENANT_B_ADMIN_PASSWORD || 'UatTest123!'

export const SELECTOR_TIMEOUT = 30_000

export function logFailedResponses(page: import('@playwright/test').Page) {
  page.on('response', (resp) => {
    if (resp.status() >= 400) {
      console.error(`[FAIL] ${resp.request().method()} ${resp.url()} → ${resp.status()}`)
    }
  })
}
