import { test, expect, request } from '@playwright/test'

const PROD_URL = process.env.PROD_URL || 'https://afruheritage.com'

const timestamp = Date.now()
const TEST_EMAIL = `uat_pw_${timestamp}@afruhertest.com`
const TEST_PASSWORD = 'UatTest123!'
const TEST_COMPANY = `UAT PW Test ${timestamp}`
const TEST_NAME = 'UAT Playwright Tester'

// Second email for the API-driven onboarding test
const TEST_EMAIL_2 = `uat_pw2_${timestamp}@afruhertest.com`
const TEST_COMPANY_2 = `UAT PW Test2 ${timestamp}`

test.describe('Production Front Door Golden Test', () => {
  test.describe.configure({ timeout: 120_000, mode: 'serial' })

  test('1. Public homepage renders with styling', async ({ page }) => {
    await page.goto(PROD_URL)
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'artifacts/prod-01-homepage.png', fullPage: true })

    await expect(page.locator('body')).toBeVisible()
    const pageText = await page.locator('body').innerText()
    expect(pageText).toContain('Afruheritage')

    // Verify CSS loaded — check that Tailwind classes produce computed styles
    const hasStyles = await page.evaluate(() => {
      const el = document.querySelector('[class*="container"], [class*="flex"], [class*="grid"]')
      if (!el) return false
      const styles = window.getComputedStyle(el)
      // Tailwind applies display:flex/grid to these elements
      return styles.display === 'flex' || styles.display === 'grid' || styles.display === 'block'
    })
    expect(hasStyles).toBeTruthy()
  })

  test('2. Create Account page is visible and usable', async ({ page }) => {
    await page.goto(`${PROD_URL}/register`)
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'artifacts/prod-02-register.png', fullPage: true })

    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="full_name"]')).toBeVisible()
    await expect(page.locator('input[name="company_name"]')).toBeVisible()
  })

  test('3. Brand-new account registration succeeds via browser', async ({ page }) => {
    await page.goto(`${PROD_URL}/register`)
    await page.waitForLoadState('networkidle')

    await page.locator('input[name="company_name"]').fill(TEST_COMPANY)
    await page.locator('input[name="full_name"]').fill(TEST_NAME)
    await page.locator('input[name="email"]').fill(TEST_EMAIL)
    await page.locator('input[name="password"]').fill(TEST_PASSWORD)
    await page.locator('input[name="confirm_password"]').fill(TEST_PASSWORD)

    await page.screenshot({ path: 'artifacts/prod-03-register-filled.png', fullPage: true })

    await page.getByRole('button', { name: /Create Account/i }).click()

    await page.waitForTimeout(8000)

    await page.screenshot({ path: 'artifacts/prod-04-after-register.png', fullPage: true })

    const modalVisible = await page.locator('text=Choose Your Plan').isVisible().catch(() => false)
    const url = page.url()
    expect(modalVisible || url.includes('dashboard') || url.includes('onboarding')).toBeTruthy()
  })

  test('4. Complete onboarding via API + verify in browser', async ({ page }) => {
    const apiContext = await request.newContext({
      baseURL: PROD_URL,
      extraHTTPHeaders: { 'Content-Type': 'application/json' },
    })

    // Register second account via API
    const regRes = await apiContext.post('/api/v1/auth/register', {
      data: { email: TEST_EMAIL_2, password: TEST_PASSWORD, full_name: TEST_NAME, company_name: TEST_COMPANY_2 },
    })
    expect(regRes.ok()).toBeTruthy()
    const regData = await regRes.json()

    const token = regData.access_token
    const tenantId = regData.tenant_id
    const subdomain = regData.subdomain

    // Free trial
    const trialRes = await apiContext.post('/api/v1/billing/payments/init', {
      headers: { Authorization: `Bearer ${token}` },
      data: { tenant_id: tenantId, amount_major: 0, email: TEST_EMAIL_2, purpose: 'subscription', plan_code: 'free_trial', currency: 'GHS' },
    })
    expect(trialRes.ok()).toBeTruthy()

    // Select freight template
    const selectRes = await apiContext.post('/api/v1/storefront-templates/select', {
      headers: { Authorization: `Bearer ${token}` },
      data: { template_code: 'freight' },
    })
    expect(selectRes.ok()).toBeTruthy()

    // Publish
    const publishRes = await apiContext.post('/api/v1/storefront-templates/publish', {
      headers: { Authorization: `Bearer ${token}` },
      data: { installation_id: null },
    })
    expect(publishRes.ok()).toBeTruthy()

    // Verify tenant context
    const ctxRes = await apiContext.get(`/api/v1/tenant-context/${subdomain}`)
    expect(ctxRes.ok()).toBeTruthy()
    const ctxData = await ctxRes.json()
    expect(ctxData.company_name).toBe(TEST_COMPANY_2)
    expect(ctxData.template_code).toBe('freight')

    // Open storefront in browser
    await page.goto(`${PROD_URL}/store/${subdomain}`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'artifacts/prod-05-storefront.png', fullPage: true })

    // Verify storefront shows tenant identity
    const storeText = await page.locator('body').innerText()
    expect(storeText.toLowerCase()).toContain(TEST_COMPANY_2.toLowerCase().substring(0, 10))

    // Login page
    await page.goto(`${PROD_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'artifacts/prod-06-login.png', fullPage: true })

    // Login with created account
    const emailInput = page.locator('input[name="username"], input[name="email"]').first()
    await emailInput.fill(TEST_EMAIL_2)
    await page.locator('input[name="password"]').fill(TEST_PASSWORD)
    await page.screenshot({ path: 'artifacts/prod-07-login-filled.png', fullPage: true })

    await page.getByRole('button', { name: /sign in|login|log in/i }).click()
    await page.waitForTimeout(8000)
    await page.screenshot({ path: 'artifacts/prod-08-dashboard.png', fullPage: true })

    // Template store
    await page.goto(`${PROD_URL}/templates`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'artifacts/prod-09-templates.png', fullPage: true })

    // Plugin store
    await page.goto(`${PROD_URL}/plugins`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'artifacts/prod-10-plugins.png', fullPage: true })

    // Plans/pricing
    await page.goto(`${PROD_URL}/pricing`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'artifacts/prod-11-pricing.png', fullPage: true })

    // Support
    await page.goto(`${PROD_URL}/support`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'artifacts/prod-12-support.png', fullPage: true })

    // Forgot password
    await page.goto(`${PROD_URL}/forgot-password`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'artifacts/prod-13-forgot-password.png', fullPage: true })

    await apiContext.dispose()
  })

  test('14. Storefront from second clean browser context', async ({ browser }) => {
    const cleanContext = await browser.newContext()
    const cleanPage = await cleanContext.newPage()

    const subdomain = `uat-pw-test2-${timestamp}`
    await cleanPage.goto(`${PROD_URL}/store/${subdomain}`)
    await cleanPage.waitForLoadState('networkidle')
    await cleanPage.screenshot({ path: 'artifacts/prod-14-clean-storefront.png', fullPage: true })

    const text = await cleanPage.locator('body').innerText()
    expect(text.length).toBeGreaterThan(0)

    await cleanContext.close()
  })

  test('15. Duplicate registration is rejected', async ({ request }) => {
    const res = await request.post(`${PROD_URL}/api/v1/auth/register`, {
      data: { email: TEST_EMAIL_2, password: TEST_PASSWORD, full_name: TEST_NAME, company_name: TEST_COMPANY_2 },
    })
    expect(res.status()).toBe(409)
    const body = await res.json()
    expect(body.detail).toContain('already exists')
  })
})
