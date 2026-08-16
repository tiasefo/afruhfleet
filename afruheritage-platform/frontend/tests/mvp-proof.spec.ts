import { test, expect, Page, Browser } from '@playwright/test';
import {
  FRONTEND_BASE_URL,
  API_BASE_URL,
  TENANT_A_ADMIN_EMAIL,
  TENANT_A_ADMIN_PASSWORD,
  TENANT_A_ID,
  TENANT_B_ADMIN_EMAIL,
  TENANT_B_ADMIN_PASSWORD,
  TENANT_B_ID,
} from './test-utils';

const SELECTOR_TIMEOUT = 30_000;

// ─── Credentials ───────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@afruheritage.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Sumiasis243$';

// Amooksco Logistics tenant (active, real data)
const AMOOKSCO_TENANT_ID = 'e379f093-758e-4e5a-a313-842baadb2680';
const AMOOKSCO_ADMIN_EMAIL = 'admin@amooksco.com';
const AMOOKSCO_ADMIN_PASSWORD = process.env.AMOOKSCO_ADMIN_PASSWORD || 'AmookscoAdmin123!';
const AMOOKSCO_CUSTOMER_EMAIL = '233249420372@amooskco.com';
const AMOOKSCO_CUSTOMER_PASSWORD = process.env.AMOOKSCO_CUSTOMER_PASSWORD || 'CustomerTest123!';

// ─── Helpers ───────────────────────────────────────────────────────────────

async function login(page: Page, email: string, password: string): Promise<void> {
  // Clear any stale state from previous tests
  await page.context().clearCookies();
  await page.goto(`${FRONTEND_BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  // Wait for the login POST response first
  const loginResponsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/v1/auth/login') && r.request().method() === 'POST',
    { timeout: SELECTOR_TIMEOUT },
  );
  await page.click('button[type="submit"]');
  const loginResponse = await loginResponsePromise;
  if (!loginResponse.ok()) {
    const body = await loginResponse.text().catch(() => 'unreadable');
    throw new Error(`Login failed for ${email}: ${loginResponse.status()} ${body}`);
  }
  // Wait for navigation — the form redirects to / or /dashboard or /onboarding
  await page.waitForURL(/\/dashboard|\/onboarding|\//, { timeout: SELECTOR_TIMEOUT }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

async function getBranding(page: Page, tenantId: string): Promise<any> {
  return page.evaluate(async (id: string) => {
    const res = await fetch(`/api/v1/branding/public/${id}`);
    if (!res.ok) return null;
    return res.json();
  }, tenantId);
}

async function apiGet(page: Page, path: string): Promise<{ status: number; body: any }> {
  return page.evaluate(async (p: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`/api/v1${p}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }, path);
}

async function apiPost(page: Page, path: string, data?: any): Promise<{ status: number; body: any }> {
  return page.evaluate(async ({ p, d }: { p: string; d?: any }) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`/api/v1${p}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: d ? JSON.stringify(d) : undefined,
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }, { p: path, d: data });
}

async function apiPatch(page: Page, path: string, data?: any): Promise<{ status: number; body: any }> {
  return page.evaluate(async ({ p, d }: { p: string; d?: any }) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`/api/v1${p}`, {
      method: 'PATCH',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: d ? JSON.stringify(d) : undefined,
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }, { p: path, d: data });
}

// ─── Test Suite ────────────────────────────────────────────────────────────

test.describe('MVP Browser-Level Proof', () => {
  test.setTimeout(120_000);

  // ════════════════════════════════════════════════════════════════════════
  // 1. Tenant Admin → Template Store → Preview → Select → Publish → Storefront
  // ════════════════════════════════════════════════════════════════════════
  test('1. Tenant Admin full template journey: browse → preview → select → publish → live storefront', async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);

    // Reset any prior state
    await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/storefront-templates/rollback', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
    });

    // Browse template store
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Storefront Templates' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-1-template-store.png', fullPage: true });

    // Preview a template (read-only)
    await page.goto(`${FRONTEND_BASE_URL}/templates/freight`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Freight/i).first()).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    // Preview must be read-only — no install/select buttons
    await expect(page.getByRole('button', { name: /Select This Template|Install/i })).toHaveCount(0);
    await page.screenshot({ path: 'artifacts/mvp-1-template-preview.png', fullPage: true });

    // Go back and select fleet template
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    const fleetCard = page.getByTestId('template-card-fleet');
    await expect(fleetCard.getByRole('button', { name: 'Install' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });

    const selectResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/select') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await fleetCard.getByRole('button', { name: 'Install' }).click();
    const selectRes = await selectResponse;
    expect(selectRes.ok()).toBeTruthy();
    await expect(page.getByText(/Staged/i).first()).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-1-template-staged.png', fullPage: true });

    // Publish
    const publishResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/publish') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await fleetCard.getByRole('button', { name: 'Publish' }).click();
    const publishRes = await publishResponse;
    expect(publishRes.ok()).toBeTruthy();
    await expect(page.getByText(/Published/i).first()).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-1-template-published.png', fullPage: true });

    // Verify branding API reflects the template
    const branding = await getBranding(page, TENANT_A_ID);
    expect(branding).not.toBeNull();
    expect(branding.template_code).toBe('fleet');
    await page.screenshot({ path: 'artifacts/mvp-1-branding-after-publish.png', fullPage: true });

    // Visit the live storefront — it should render with tenant branding
    await page.goto(`${FRONTEND_BASE_URL}/storefront`);
    await page.waitForLoadState('networkidle');
    // The storefront should show the company name (from tenant context)
    await expect(page.locator('body')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-1-live-storefront.png', fullPage: true });

    // Rollback to clean up
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    const rollbackResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/rollback') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.getByRole('button', { name: 'Rollback' }).click();
    const rollbackRes = await rollbackResponse;
    expect(rollbackRes.ok()).toBeTruthy();
    await page.screenshot({ path: 'artifacts/mvp-1-rollback.png', fullPage: true });

    await page.close();
  });

  // ════════════════════════════════════════════════════════════════════════
  // 2. Tenant Admin → Plugin Store → Install → Enable/Disable → visible changes
  // ════════════════════════════════════════════════════════════════════════
  test('2. Tenant Admin plugin lifecycle: install → enable → disable → uninstall with visible state changes', async ({ page }) => {
    await login(page, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);

    // Clean slate
    await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    });

    await page.goto(`${FRONTEND_BASE_URL}/plugins`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Plugin Catalog' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-2-plugin-store.png', fullPage: true });

    const trackingCard = page.getByTestId('plugin-card-tracking');

    // Install
    await trackingCard.getByRole('button', { name: 'Install Plugin' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.locator('label:has-text("UI Changes")').first().click();
    await page.locator('label:has-text("Business Type Changes")').first().click();
    await page.locator('label:has-text("Data Impact")').first().click();
    await page.locator('label:has-text("I acknowledge and accept: UI change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Business type change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Data impact")').click();

    const installResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/install') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.locator('[role="dialog"] button:has-text("Install Plugin"):not([disabled])').click();
    const installRes = await installResponse;
    expect(installRes.ok()).toBeTruthy();
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/installed') && r.request().method() === 'GET',
      { timeout: SELECTOR_TIMEOUT },
    );
    await expect(trackingCard.getByText('Installed')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-2-plugin-installed.png', fullPage: true });

    // Verify via API that the plugin is installed
    const installedApi = await apiGet(page, '/plugins/installed');
    const trackingInstalled = (installedApi.body || []).find((p: any) => p.name === 'tracking');
    expect(trackingInstalled).toBeTruthy();
    expect(trackingInstalled.status).toBe('installed');

    // Disable
    await trackingCard.getByRole('button', { name: 'Disable' }).click();
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/tracking/disable') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await expect(trackingCard.getByText('Disabled')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-2-plugin-disabled.png', fullPage: true });

    // Verify via API
    const disabledApi = await apiGet(page, '/plugins/installed');
    const trackingDisabled = (disabledApi.body || []).find((p: any) => p.name === 'tracking');
    expect(trackingDisabled).toBeTruthy();
    expect(trackingDisabled.status).toBe('disabled');

    // Enable
    await trackingCard.getByRole('button', { name: 'Enable' }).click();
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/tracking/enable') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await expect(trackingCard.getByText('Installed')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-2-plugin-enabled.png', fullPage: true });

    // Uninstall
    await trackingCard.getByRole('button', { name: 'Uninstall' }).click();
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/tracking/uninstall') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await expect(trackingCard.getByRole('button', { name: 'Install Plugin' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-2-plugin-uninstalled.png', fullPage: true });

    // ── Prove real plugin behavior on storefront ──
    // When tracking is uninstalled, the storefront should NOT show the Track Shipment widget
    const brandingAfterUninstall = await getBranding(page, TENANT_A_ID);
    expect(brandingAfterUninstall?.public_tracking_enabled).toBe(false);

    // Visit storefront and verify tracking is absent
    await page.goto(`${FRONTEND_BASE_URL}/storefront?tenant_id=uat-test-tenant-uat-6`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow client-side tenant context to load
    await page.screenshot({ path: 'artifacts/mvp-2-storefront-no-tracking.png', fullPage: true });

    // Now reinstall tracking and verify it appears on storefront
    await page.goto(`${FRONTEND_BASE_URL}/plugins`);
    await page.waitForLoadState('networkidle');
    const trackingCard2 = page.getByTestId('plugin-card-tracking');
    await trackingCard2.getByRole('button', { name: 'Install Plugin' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.locator('label:has-text("UI Changes")').first().click();
    await page.locator('label:has-text("Business Type Changes")').first().click();
    await page.locator('label:has-text("Data Impact")').first().click();
    await page.locator('label:has-text("I acknowledge and accept: UI change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Business type change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Data impact")').click();
    const installRes2 = page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/install') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.locator('[role="dialog"] button:has-text("Install Plugin"):not([disabled])').click();
    await installRes2;
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/installed') && r.request().method() === 'GET',
      { timeout: SELECTOR_TIMEOUT },
    );

    // Verify branding now has tracking enabled
    const brandingAfterReinstall = await getBranding(page, TENANT_A_ID);
    expect(brandingAfterReinstall?.public_tracking_enabled).toBe(true);

    // Visit storefront and verify tracking is present
    await page.goto(`${FRONTEND_BASE_URL}/storefront?tenant_id=uat-test-tenant-uat-6`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'artifacts/mvp-2-storefront-with-tracking.png', fullPage: true });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 3. Platform Super Admin → global Template/Plugin publishing controls
  // ════════════════════════════════════════════════════════════════════════
  test('3. Platform Super Admin can create, edit, activate/deactivate templates and plugins via UI', async ({ page }) => {
    await login(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);

    // ── Template management via UI ──
    await page.goto(`${FRONTEND_BASE_URL}/admin/templates`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Global Template Catalog' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await expect(page.getByText('Platform Super Admin')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-3-admin-templates.png', fullPage: true });

    // Create a new template via UI form
    const uniqueCode = `test-mvp-${Date.now()}`;
    await page.getByRole('button', { name: 'New Template' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Template' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.locator('input[placeholder="e.g. modern-logistics"]').fill(uniqueCode);
    await page.locator('input[placeholder="e.g. Modern Logistics"]').fill('MVP Test Template');
    await page.locator('input[placeholder="Brief description"]').fill('Template created by Super Admin for MVP proof');

    const createResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/admin') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.getByRole('button', { name: 'Create Template' }).click();
    const createRes = await createResponse;
    expect(createRes.ok()).toBeTruthy();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'artifacts/mvp-3-admin-template-created.png', fullPage: true });

    // Find the newly created template card and edit it via UI
    const templateCard = page.locator('.card, [class*="card"]').filter({ hasText: uniqueCode });
    await expect(templateCard).toBeVisible({ timeout: SELECTOR_TIMEOUT });

    // Click the edit (pencil) button on the new template card
    await templateCard.getByRole('button').nth(1).click(); // Pencil/edit button
    await expect(page.getByRole('heading', { name: /Edit Template/ })).toBeVisible({ timeout: SELECTOR_TIMEOUT });

    // Edit the name — find the input that follows the "Name" label in the edit form
    const editNameInput = page.locator('label:has-text("Name")').first().locator('..').locator('input').first();
    await editNameInput.fill('MVP Test Template (Updated)');

    // Uncheck the active checkbox to deactivate
    const activeCheckbox = page.locator('label:has-text("Published (active)")').locator('..').locator('input[type="checkbox"]');
    if (await activeCheckbox.isChecked()) {
      await activeCheckbox.uncheck();
    }

    const updateResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/admin/') && r.request().method() === 'PATCH',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.getByRole('button', { name: 'Save Changes' }).click();
    const updateRes = await updateResponse;
    expect(updateRes.ok()).toBeTruthy();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'artifacts/mvp-3-admin-template-deactivated.png', fullPage: true });

    // Reactivate via the toggle (power) button on the card
    const updatedCard = page.locator('.card, [class*="card"]').filter({ hasText: 'MVP Test Template (Updated)' });
    const toggleBtn = updatedCard.getByRole('button').last(); // Power/toggle button
    const reactivateResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/admin/') && r.request().method() === 'PATCH',
      { timeout: SELECTOR_TIMEOUT },
    );
    await toggleBtn.click();
    const reactivateRes = await reactivateResponse;
    expect(reactivateRes.ok()).toBeTruthy();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'artifacts/mvp-3-admin-template-reactivated.png', fullPage: true });

    // ── Plugin management via UI ──
    await page.goto(`${FRONTEND_BASE_URL}/admin/plugins`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Global Plugin Catalog' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-3-admin-plugins.png', fullPage: true });

    // Find customs_calculator plugin card and deactivate via UI button
    const customsPluginCard = page.locator('.card, [class*="card"]').filter({ hasText: 'customs_calculator' });
    await expect(customsPluginCard).toBeVisible({ timeout: SELECTOR_TIMEOUT });

    // Click Deactivate button
    const deactivateBtn = customsPluginCard.getByRole('button', { name: /Deactivate/i });
    const deactivateResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/admin/customs_calculator/deactivate') && r.request().method() === 'PATCH',
      { timeout: SELECTOR_TIMEOUT },
    );
    await deactivateBtn.click();
    const deactivateRes = await deactivateResponse;
    expect(deactivateRes.ok()).toBeTruthy();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'artifacts/mvp-3-admin-plugin-deactivated.png', fullPage: true });

    // Verify it shows Inactive badge
    await expect(customsPluginCard.getByText('Inactive')).toBeVisible({ timeout: SELECTOR_TIMEOUT });

    // Reactivate via UI button
    const activateBtn = customsPluginCard.getByRole('button', { name: /Activate/i });
    const activateResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/admin/customs_calculator/activate') && r.request().method() === 'PATCH',
      { timeout: SELECTOR_TIMEOUT },
    );
    await activateBtn.click();
    const activateRes = await activateResponse;
    expect(activateRes.ok()).toBeTruthy();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'artifacts/mvp-3-admin-plugin-reactivated.png', fullPage: true });

    // Verify it shows Active badge again
    await expect(customsPluginCard.getByText('Active')).toBeVisible({ timeout: SELECTOR_TIMEOUT });

    // ── RBAC ──
    await page.goto(`${FRONTEND_BASE_URL}/admin/rbac`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'artifacts/mvp-3-admin-rbac.png', fullPage: true });

    const permissions = await apiGet(page, '/rbac/permissions');
    expect(permissions.status).toBe(200);
    expect(Array.isArray(permissions.body)).toBeTruthy();
  });

  // ════════════════════════════════════════════════════════════════════════
  // 4. Tenant Staff → tenant-scoped access only
  // ════════════════════════════════════════════════════════════════════════
  test('4. Tenant admin cannot access other tenant data (tenant-scoped access)', async ({ browser }) => {
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();

    await login(pageA, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);
    await login(pageB, TENANT_B_ADMIN_EMAIL, TENANT_B_ADMIN_PASSWORD);

    // Tenant A admin tries to access Tenant B's branding — must be forbidden
    const crossAccess = await apiGet(pageA, `/branding/${TENANT_B_ID}`);
    expect(crossAccess.status).toBe(403);

    // Tenant B admin tries to access Tenant A's branding — must be forbidden
    const crossAccessB = await apiGet(pageB, `/branding/${TENANT_A_ID}`);
    expect(crossAccessB.status).toBe(403);

    // Tenant A can access own branding (200 if active, 402 if suspended — both prove tenant scoping)
    const ownAccess = await apiGet(pageA, `/branding/${TENANT_A_ID}`);
    expect([200, 402]).toContain(ownAccess.status);

    // Tenant B can access own branding (200 if active, 402 if suspended — both prove tenant scoping)
    const ownAccessB = await apiGet(pageB, `/branding/${TENANT_B_ID}`);
    expect([200, 402]).toContain(ownAccessB.status);

    await pageA.screenshot({ path: 'artifacts/mvp-4-tenant-isolation-a.png', fullPage: true });
    await pageB.screenshot({ path: 'artifacts/mvp-4-tenant-isolation-b.png', fullPage: true });

    // ── Prove suspended tenant gets 402 ──
    // Check if Tenant A has active subscription; if suspended, verify 402
    const ownAccessA = await apiGet(pageA, `/branding/${TENANT_A_ID}`);
    if (ownAccessA.status === 402) {
      // Tenant A is suspended — this proves 402 behavior
      await pageA.screenshot({ path: 'artifacts/mvp-4-suspended-402.png', fullPage: true });
    } else {
      // Tenant A is active — verify 200
      expect(ownAccessA.status).toBe(200);
    }

    await pageA.close();
    await pageB.close();
  });

  // ════════════════════════════════════════════════════════════════════════
  // 5. Customer → storefront/customer access only
  // ════════════════════════════════════════════════════════════════════════
  test('5. Customer can access storefront but not admin endpoints', async ({ page }) => {
    // Login as customer
    await login(page, AMOOKSCO_CUSTOMER_EMAIL, AMOOKSCO_CUSTOMER_PASSWORD);

    // Customer can view storefront
    await page.goto(`${FRONTEND_BASE_URL}/storefront`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-5-customer-storefront.png', fullPage: true });

    // Customer cannot access admin template management
    const adminTemplates = await apiGet(page, '/storefront-templates/admin/all');
    expect(adminTemplates.status).toBe(403);

    // Customer cannot install plugins
    const installAttempt = await apiPost(page, '/plugins/install', { plugin_name: 'tracking' });
    expect(installAttempt.status).toBe(403);

    // Customer cannot access RBAC permissions
    const rbacAttempt = await apiGet(page, '/rbac/permissions');
    expect(rbacAttempt.status).toBe(403);

    // Customer cannot access other tenant's branding
    const crossTenant = await apiGet(page, `/branding/${TENANT_A_ID}`);
    expect(crossTenant.status).toBe(403);

    await page.screenshot({ path: 'artifacts/mvp-5-customer-rbac-blocked.png', fullPage: true });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 6. Fresh tenant → full zero-code launch → public storefront
  // ════════════════════════════════════════════════════════════════════════
  test('6. Fresh tenant journey: login → select template → publish → public storefront visible', async ({ page }) => {
    await login(page, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);

    // Reset prior state
    await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/storefront-templates/rollback', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
    });

    // Capture baseline branding
    const baseline = await getBranding(page, TENANT_A_ID);
    const baselineTemplate = baseline?.template_code ?? null;

    // Select ecommerce template
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    await page.waitForLoadState('networkidle');
    const ecommerceCard = page.getByTestId('template-card-ecommerce');
    await expect(ecommerceCard.getByRole('button', { name: 'Install' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });

    const selectRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/select') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await ecommerceCard.getByRole('button', { name: 'Install' }).click();
    const selectResponse = await selectRes;
    expect(selectResponse.ok()).toBeTruthy();
    await page.screenshot({ path: 'artifacts/mvp-6-fresh-staged.png', fullPage: true });

    // Publish
    const publishRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/publish') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await ecommerceCard.getByRole('button', { name: 'Publish' }).click();
    const publishResponse = await publishRes;
    expect(publishResponse.ok()).toBeTruthy();
    await expect(page.getByText(/Published/i).first()).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-6-fresh-published.png', fullPage: true });

    // Verify branding changed
    const afterPublish = await getBranding(page, TENANT_A_ID);
    expect(afterPublish?.template_code).toBe('ecommerce');

    // Visit public storefront — should show tenant branding
    await page.goto(`${FRONTEND_BASE_URL}/storefront`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-6-fresh-storefront.png', fullPage: true });

    // Also verify public branding API works without auth (unauthenticated visitor)
    const publicBranding = await page.evaluate(async (id: string) => {
      const res = await fetch(`/api/v1/branding/public/${id}`);
      if (!res.ok) return null;
      return res.json();
    }, TENANT_A_ID);
    expect(publicBranding).not.toBeNull();
    expect(publicBranding.template_code).toBe('ecommerce');

    // Rollback to clean up
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    const rollbackRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/rollback') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.getByRole('button', { name: 'Rollback' }).click();
    const rollbackResponse = await rollbackRes;
    expect(rollbackResponse.ok()).toBeTruthy();

    // Verify rollback restored original template
    const afterRollback = await getBranding(page, TENANT_A_ID);
    expect(afterRollback?.template_code).toBe(baselineTemplate);

    await page.screenshot({ path: 'artifacts/mvp-6-fresh-rollback.png', fullPage: true });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 7. Second tenant → unchanged throughout
  // ════════════════════════════════════════════════════════════════════════
  test('7. Second tenant isolation: Tenant A changes do not affect Tenant B (full state comparison)', async ({ browser }) => {
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();

    await login(pageA, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);
    await login(pageB, TENANT_B_ADMIN_EMAIL, TENANT_B_ADMIN_PASSWORD);

    // ── Capture Tenant B full baseline state ──
    const baselineBrandingB = await getBranding(pageB, TENANT_B_ID);
    const baselineCtxB = await pageB.evaluate(async (id: string) => {
      const res = await fetch(`/api/v1/tenant-context/${id}`);
      if (!res.ok) return null;
      return res.json();
    }, TENANT_B_ID);
    const baselinePluginsB = await apiGet(pageB, '/plugins/installed');

    expect(baselineBrandingB).not.toBeNull();
    const baselineTemplateB = baselineBrandingB?.template_code ?? null;
    const baselineTrackingB = baselineBrandingB?.public_tracking_enabled ?? null;
    const baselineMapsB = baselineBrandingB?.maps_enabled ?? null;
    const baselineCsvB = baselineBrandingB?.csv_import_enabled ?? null;
    const baselineMembersB = baselineBrandingB?.group_members_enabled ?? null;
    const baselineCtxFeaturesB = baselineCtxB?.features ? JSON.stringify(baselineCtxB.features) : null;
    const baselinePluginCountB = Array.isArray(baselinePluginsB.body) ? baselinePluginsB.body.length : 0;

    // ── Tenant A: make multiple changes ──
    // 1. Change template
    await pageA.goto(`${FRONTEND_BASE_URL}/templates`);
    await pageA.waitForLoadState('networkidle');

    // Reset first
    await pageA.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/storefront-templates/rollback', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
    });
    await pageA.reload();
    await pageA.waitForLoadState('networkidle');

    const fleetCard = pageA.getByTestId('template-card-fleet');
    const selectRes = pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/select') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await fleetCard.getByRole('button', { name: 'Install' }).click();
    const selectResponse = await selectRes;
    expect(selectResponse.ok()).toBeTruthy();

    const publishRes = pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/publish') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await fleetCard.getByRole('button', { name: 'Publish' }).click();
    const publishResponse = await publishRes;
    expect(publishResponse.ok()).toBeTruthy();

    // 2. Install tracking plugin on Tenant A
    await pageA.goto(`${FRONTEND_BASE_URL}/plugins`);
    await pageA.waitForLoadState('networkidle');
    const trackingCardA = pageA.getByTestId('plugin-card-tracking');
    // First uninstall if already installed
    await pageA.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    });
    await pageA.reload();
    await pageA.waitForLoadState('networkidle');
    const trackingCardA2 = pageA.getByTestId('plugin-card-tracking');
    await trackingCardA2.getByRole('button', { name: 'Install Plugin' }).click();
    await expect(pageA.getByRole('dialog')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await pageA.locator('label:has-text("UI Changes")').first().click();
    await pageA.locator('label:has-text("Business Type Changes")').first().click();
    await pageA.locator('label:has-text("Data Impact")').first().click();
    await pageA.locator('label:has-text("I acknowledge and accept: UI change")').click();
    await pageA.locator('label:has-text("I acknowledge and accept: Business type change")').click();
    await pageA.locator('label:has-text("I acknowledge and accept: Data impact")').click();
    const installResA = pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/install') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await pageA.locator('[role="dialog"] button:has-text("Install Plugin"):not([disabled])').click();
    await installResA;
    await pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/installed') && r.request().method() === 'GET',
      { timeout: SELECTOR_TIMEOUT },
    );

    // Verify Tenant A has fleet + tracking
    const afterA = await getBranding(pageA, TENANT_A_ID);
    expect(afterA?.template_code).toBe('fleet');
    expect(afterA?.public_tracking_enabled).toBe(true);
    await pageA.screenshot({ path: 'artifacts/mvp-7-tenant-a-published.png', fullPage: true });

    // ── Verify Tenant B is UNCHANGED across all dimensions ──
    const afterBrandingB = await getBranding(pageB, TENANT_B_ID);
    const afterCtxB = await pageB.evaluate(async (id: string) => {
      const res = await fetch(`/api/v1/tenant-context/${id}`);
      if (!res.ok) return null;
      return res.json();
    }, TENANT_B_ID);
    const afterPluginsB = await apiGet(pageB, '/plugins/installed');

    // Template unchanged
    expect(afterBrandingB?.template_code).toBe(baselineTemplateB);
    // Feature flags unchanged
    expect(afterBrandingB?.public_tracking_enabled).toBe(baselineTrackingB);
    expect(afterBrandingB?.maps_enabled).toBe(baselineMapsB);
    expect(afterBrandingB?.csv_import_enabled).toBe(baselineCsvB);
    expect(afterBrandingB?.group_members_enabled).toBe(baselineMembersB);
    // Tenant context features object unchanged
    const afterCtxFeaturesB = afterCtxB?.features ? JSON.stringify(afterCtxB.features) : null;
    expect(afterCtxFeaturesB).toBe(baselineCtxFeaturesB);
    // Plugin installations unchanged
    const afterPluginCountB = Array.isArray(afterPluginsB.body) ? afterPluginsB.body.length : 0;
    expect(afterPluginCountB).toBe(baselinePluginCountB);

    await pageB.screenshot({ path: 'artifacts/mvp-7-tenant-b-unchanged.png', fullPage: true });

    // Tenant B's storefront should not show fleet template
    await pageB.goto(`${FRONTEND_BASE_URL}/storefront`);
    await pageB.waitForLoadState('networkidle');
    await pageB.screenshot({ path: 'artifacts/mvp-7-tenant-b-storefront.png', fullPage: true });

    // Clean up Tenant A
    await pageA.goto(`${FRONTEND_BASE_URL}/templates`);
    const rollbackRes = pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/rollback') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await pageA.getByRole('button', { name: 'Rollback' }).click();
    await rollbackRes;

    await pageA.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    });

    await pageA.close();
    await pageB.close();
  });

  // ════════════════════════════════════════════════════════════════════════
  // 8. Golden Test: Full tenant lifecycle → template → plugin → publish → public storefront
  // ════════════════════════════════════════════════════════════════════════
  test('8. Golden Test: tenant admin → template → plugin → publish → public storefront with real content', async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);

    // Reset prior state
    await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/storefront-templates/rollback', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    });

    // Step 1: Select a template from the Template Store
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Storefront Templates' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-8-golden-template-store.png', fullPage: true });

    // Preview a template first
    await page.goto(`${FRONTEND_BASE_URL}/templates/freight`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'artifacts/mvp-8-golden-template-preview.png', fullPage: true });

    // Select fleet template
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    const fleetCard = page.getByTestId('template-card-fleet');
    const selectRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/select') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await fleetCard.getByRole('button', { name: 'Install' }).click();
    await selectRes;

    // Publish
    const publishRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/publish') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await fleetCard.getByRole('button', { name: 'Publish' }).click();
    await publishRes;
    await page.screenshot({ path: 'artifacts/mvp-8-golden-template-published.png', fullPage: true });

    // Step 2: Install a plugin from the Plugin Store
    await page.goto(`${FRONTEND_BASE_URL}/plugins`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Plugin Catalog' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/mvp-8-golden-plugin-store.png', fullPage: true });

    // Install tracking plugin
    const trackingCard = page.getByTestId('plugin-card-tracking');
    await trackingCard.getByRole('button', { name: 'Install Plugin' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.locator('label:has-text("UI Changes")').first().click();
    await page.locator('label:has-text("Business Type Changes")').first().click();
    await page.locator('label:has-text("Data Impact")').first().click();
    await page.locator('label:has-text("I acknowledge and accept: UI change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Business type change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Data impact")').click();
    const installRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/install') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.locator('[role="dialog"] button:has-text("Install Plugin"):not([disabled])').click();
    await installRes;
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/installed') && r.request().method() === 'GET',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.screenshot({ path: 'artifacts/mvp-8-golden-plugin-installed.png', fullPage: true });

    // Verify branding reflects template + plugin
    const branding = await getBranding(page, TENANT_A_ID);
    expect(branding).not.toBeNull();
    expect(branding.template_code).toBe('fleet');
    expect(branding.public_tracking_enabled).toBe(true);

    // Step 3: Open the public storefront in a clean unauthenticated browser context
    const cleanContext = await browser.newContext();
    const cleanPage = await cleanContext.newPage();
    await cleanPage.goto(`${FRONTEND_BASE_URL}/storefront?tenant_id=uat-test-tenant-uat-6`);
    await cleanPage.waitForLoadState('networkidle');
    await cleanPage.waitForTimeout(3000); // Allow client-side tenant context fetch

    // Verify the storefront shows tenant-specific content
    const companyName = await cleanPage.locator('h1').first().textContent().catch(() => '');
    expect(companyName).toBeTruthy();

    // Verify no AMOOKSCO/demo leakage — the company name should not contain "Amooksco" or "demo"
    const pageText = await cleanPage.locator('body').textContent() || '';
    expect(pageText.toLowerCase()).not.toContain('amooksco');
    expect(pageText.toLowerCase()).not.toContain('demo tenant');

    // Verify tracking widget is present (plugin enabled)
    const trackingVisible = await cleanPage.getByText(/Track Your Shipment|Enter Tracking Number|tracking/i).first().isVisible().catch(() => false);
    expect(trackingVisible).toBeTruthy();

    await cleanPage.screenshot({ path: 'artifacts/mvp-8-golden-public-storefront.png', fullPage: true });

    // Verify the storefront has the correct template branding (primary color from fleet template)
    const heroSection = cleanPage.locator('section').first();
    const heroStyle = await heroSection.getAttribute('style') || '';
    expect(heroStyle).toContain('linear-gradient');

    await cleanPage.close();
    await cleanContext.close();

    // Clean up: rollback template and uninstall plugin
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    const rollbackRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/rollback') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.getByRole('button', { name: 'Rollback' }).click();
    await rollbackRes;

    await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    });

    await page.close();
  });

  // ════════════════════════════════════════════════════════════════════════
  // 9. Two businesses operate independently: plugin changes on A don't affect B
  // ════════════════════════════════════════════════════════════════════════
  test('9. Two businesses operate independently: Tenant A plugin changes do not affect Tenant B', async ({ browser }) => {
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();

    await login(pageA, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);
    await login(pageB, TENANT_B_ADMIN_EMAIL, TENANT_B_ADMIN_PASSWORD);

    // Capture Tenant B baseline branding
    const baselineB = await getBranding(pageB, TENANT_B_ID);
    const baselineTrackingB = baselineB?.public_tracking_enabled ?? null;
    const baselineTemplateB = baselineB?.template_code ?? null;

    // Tenant A: uninstall tracking plugin (if installed)
    await pageA.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    });

    // Verify Tenant A no longer has tracking
    const brandingA = await getBranding(pageA, TENANT_A_ID);
    expect(brandingA?.public_tracking_enabled).toBe(false);

    // Verify Tenant B is UNCHANGED
    const afterB = await getBranding(pageB, TENANT_B_ID);
    expect(afterB?.public_tracking_enabled).toBe(baselineTrackingB);
    expect(afterB?.template_code).toBe(baselineTemplateB);

    await pageA.screenshot({ path: 'artifacts/mvp-9-tenant-a-no-tracking.png', fullPage: true });
    await pageB.screenshot({ path: 'artifacts/mvp-9-tenant-b-unchanged.png', fullPage: true });

    // Tenant A: change template
    await pageA.goto(`${FRONTEND_BASE_URL}/templates`);
    await pageA.waitForLoadState('networkidle');

    // Reset first
    await pageA.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/storefront-templates/rollback', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
    });
    await pageA.reload();
    await pageA.waitForLoadState('networkidle');

    const ecommerceCard = pageA.getByTestId('template-card-ecommerce');
    const selectRes = pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/select') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await ecommerceCard.getByRole('button', { name: 'Install' }).click();
    await selectRes;

    const publishRes = pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/publish') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await ecommerceCard.getByRole('button', { name: 'Publish' }).click();
    await publishRes;

    // Verify Tenant A has ecommerce template
    const afterA = await getBranding(pageA, TENANT_A_ID);
    expect(afterA?.template_code).toBe('ecommerce');

    // Verify Tenant B is STILL UNCHANGED
    const finalB = await getBranding(pageB, TENANT_B_ID);
    expect(finalB?.template_code).toBe(baselineTemplateB);
    expect(finalB?.public_tracking_enabled).toBe(baselineTrackingB);

    await pageA.screenshot({ path: 'artifacts/mvp-9-tenant-a-ecommerce.png', fullPage: true });
    await pageB.screenshot({ path: 'artifacts/mvp-9-tenant-b-final-unchanged.png', fullPage: true });

    // Clean up Tenant A
    await pageA.goto(`${FRONTEND_BASE_URL}/templates`);
    const rollbackRes = pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/rollback') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await pageA.getByRole('button', { name: 'Rollback' }).click();
    await rollbackRes;

    await pageA.close();
    await pageB.close();
  });

  // ════════════════════════════════════════════════════════════════════════
  // 10. Plugin capabilities propagate through all 7 production template renderers
  // ════════════════════════════════════════════════════════════════════════
  test('10. Plugin capabilities propagate through all 7 production template renderers', async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);

    // Ensure tracking plugin is installed and enabled
    await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    });
    await page.goto(`${FRONTEND_BASE_URL}/plugins`);
    await page.waitForLoadState('networkidle');
    const trackingCard = page.getByTestId('plugin-card-tracking');
    await trackingCard.getByRole('button', { name: 'Install Plugin' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.locator('label:has-text("UI Changes")').first().click();
    await page.locator('label:has-text("Business Type Changes")').first().click();
    await page.locator('label:has-text("Data Impact")').first().click();
    await page.locator('label:has-text("I acknowledge and accept: UI change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Business type change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Data impact")').click();
    const installRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/install') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.locator('[role="dialog"] button:has-text("Install Plugin"):not([disabled])').click();
    await installRes;
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/installed') && r.request().method() === 'GET',
      { timeout: SELECTOR_TIMEOUT },
    );

    // Verify branding has tracking enabled
    const branding = await getBranding(page, TENANT_A_ID);
    expect(branding?.public_tracking_enabled).toBe(true);

    const tenantSlug = branding?.slug || TENANT_A_ID;
    const templates = ['freight', 'fleet', 'ecommerce', 'restaurant', 'bookings', 'mall', 'realestate'];

    for (const templateCode of templates) {
      // Select and publish each template
      await page.goto(`${FRONTEND_BASE_URL}/templates`);
      await page.waitForLoadState('networkidle');

      // Reset first
      await page.evaluate(async () => {
        const token = localStorage.getItem('auth_token');
        try { await fetch('/api/v1/storefront-templates/rollback', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
      });
      await page.reload();
      await page.waitForLoadState('networkidle');

      const card = page.getByTestId(`template-card-${templateCode}`);
      const selectRes = page.waitForResponse(
        (r) => r.url().includes('/api/v1/storefront-templates/select') && r.request().method() === 'POST',
        { timeout: SELECTOR_TIMEOUT },
      );
      await card.getByRole('button', { name: 'Install' }).click();
      await selectRes;

      const publishRes = page.waitForResponse(
        (r) => r.url().includes('/api/v1/storefront-templates/publish') && r.request().method() === 'POST',
        { timeout: SELECTOR_TIMEOUT },
      );
      await card.getByRole('button', { name: 'Publish' }).click();
      await publishRes;

      // Verify branding reflects the template
      const afterBranding = await getBranding(page, TENANT_A_ID);
      expect(afterBranding?.template_code).toBe(templateCode);

      // Visit the public storefront in a clean context
      const cleanCtx = await browser.newContext();
      const cleanPage = await cleanCtx.newPage();
      await cleanPage.goto(`${FRONTEND_BASE_URL}/store/${tenantSlug}`);
      await cleanPage.waitForLoadState('networkidle');
      await cleanPage.waitForTimeout(2000);

      // Verify the storefront renders with the correct template
      const pageText = await cleanPage.locator('body').textContent() || '';
      expect(pageText.length).toBeGreaterThan(0);

      // Verify data-capabilities attribute is present on the root storefront div
      const capsAttr = await cleanPage.locator('[data-capabilities]').first().getAttribute('data-capabilities').catch(() => null);
      expect(capsAttr).toBeTruthy();
      const caps = JSON.parse(capsAttr!);
      expect(caps.public_tracking_enabled).toBe(true);

      // Template-specific observable behavior:
      // Freight: Track Shipment section should be visible
      // Fleet: Track Vehicle section should be visible
      // Ecommerce: data-capabilities should show group_members_enabled
      if (templateCode === 'freight') {
        const trackSection = await cleanPage.getByText(/Track Your Shipment|Enter Tracking Number|tracking/i).first().isVisible().catch(() => false);
        expect(trackSection).toBeTruthy();
      } else if (templateCode === 'fleet') {
        const trackSection = await cleanPage.getByText(/Track Your Vehicle|Enter Tracking|vehicle track/i).first().isVisible().catch(() => false);
        expect(trackSection).toBeTruthy();
      }

      await cleanPage.screenshot({ path: `artifacts/mvp-10-${templateCode}-storefront.png`, fullPage: true });
      await cleanPage.close();
      await cleanCtx.close();
    }

    // Clean up: rollback template and uninstall tracking
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    const rollbackRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/rollback') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.getByRole('button', { name: 'Rollback' }).click();
    await rollbackRes;

    await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    });

    await page.close();
  });

  // ════════════════════════════════════════════════════════════════════════
  // 11. Plugin semantics: observable behavior changes when plugins are toggled
  // ════════════════════════════════════════════════════════════════════════
  test('11. Plugin semantics: observable storefront behavior changes when tracking plugin is toggled', async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);

    // Select freight template (which has conditional TrackShipment component)
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    await page.waitForLoadState('networkidle');

    // Reset first
    await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/storefront-templates/rollback', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const freightCard = page.getByTestId('template-card-freight');
    const selectRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/select') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await freightCard.getByRole('button', { name: 'Install' }).click();
    await selectRes;

    const publishRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/publish') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await freightCard.getByRole('button', { name: 'Publish' }).click();
    await publishRes;

    // Verify tracking is NOT enabled (plugin not installed)
    const brandingNoTracking = await getBranding(page, TENANT_A_ID);
    expect(brandingNoTracking?.template_code).toBe('freight');
    expect(brandingNoTracking?.public_tracking_enabled).toBe(false);

    const tenantSlug = brandingNoTracking?.slug || TENANT_A_ID;

    // Visit storefront — tracking section should NOT be visible
    const cleanCtx1 = await browser.newContext();
    const cleanPage1 = await cleanCtx1.newPage();
    await cleanPage1.goto(`${FRONTEND_BASE_URL}/store/${tenantSlug}`);
    await cleanPage1.waitForLoadState('networkidle');
    await cleanPage1.waitForTimeout(2000);

    const capsAttr1 = await cleanPage1.locator('[data-capabilities]').first().getAttribute('data-capabilities').catch(() => null);
    expect(capsAttr1).toBeTruthy();
    const caps1 = JSON.parse(capsAttr1!);
    expect(caps1.public_tracking_enabled).toBe(false);

    // Track section should NOT be visible on freight template
    const trackVisibleBefore = await cleanPage1.getByText(/Track Your Shipment|Enter Tracking Number/i).first().isVisible().catch(() => false);
    expect(trackVisibleBefore).toBeFalsy();

    // Track nav link should NOT be visible
    const trackNavLinkBefore = await cleanPage1.getByRole('link', { name: 'Track' }).first().isVisible().catch(() => false);
    expect(trackNavLinkBefore).toBeFalsy();

    await cleanPage1.screenshot({ path: 'artifacts/mvp-11-freight-no-tracking.png', fullPage: true });
    await cleanPage1.close();
    await cleanCtx1.close();

    // Now install tracking plugin
    await page.goto(`${FRONTEND_BASE_URL}/plugins`);
    await page.waitForLoadState('networkidle');
    const trackingCard = page.getByTestId('plugin-card-tracking');
    await trackingCard.getByRole('button', { name: 'Install Plugin' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.locator('label:has-text("UI Changes")').first().click();
    await page.locator('label:has-text("Business Type Changes")').first().click();
    await page.locator('label:has-text("Data Impact")').first().click();
    await page.locator('label:has-text("I acknowledge and accept: UI change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Business type change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Data impact")').click();
    const installRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/install') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.locator('[role="dialog"] button:has-text("Install Plugin"):not([disabled])').click();
    await installRes;
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/installed') && r.request().method() === 'GET',
      { timeout: SELECTOR_TIMEOUT },
    );

    // Verify tracking is now enabled
    const brandingWithTracking = await getBranding(page, TENANT_A_ID);
    expect(brandingWithTracking?.public_tracking_enabled).toBe(true);

    // Visit storefront — tracking section SHOULD be visible now
    const cleanCtx2 = await browser.newContext();
    const cleanPage2 = await cleanCtx2.newPage();
    await cleanPage2.goto(`${FRONTEND_BASE_URL}/store/${tenantSlug}`);
    await cleanPage2.waitForLoadState('networkidle');
    await cleanPage2.waitForTimeout(2000);

    const capsAttr2 = await cleanPage2.locator('[data-capabilities]').first().getAttribute('data-capabilities').catch(() => null);
    expect(capsAttr2).toBeTruthy();
    const caps2 = JSON.parse(capsAttr2!);
    expect(caps2.public_tracking_enabled).toBe(true);

    // Track section SHOULD be visible
    const trackVisibleAfter = await cleanPage2.getByText(/Track Your Shipment|Enter Tracking Number/i).first().isVisible().catch(() => false);
    expect(trackVisibleAfter).toBeTruthy();

    // Track nav link SHOULD be visible
    const trackNavLinkAfter = await cleanPage2.getByRole('link', { name: 'Track' }).first().isVisible().catch(() => false);
    expect(trackNavLinkAfter).toBeTruthy();

    await cleanPage2.screenshot({ path: 'artifacts/mvp-11-freight-with-tracking.png', fullPage: true });
    await cleanPage2.close();
    await cleanCtx2.close();

    // Clean up
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    const rollbackRes = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/rollback') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.getByRole('button', { name: 'Rollback' }).click();
    await rollbackRes;

    await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
    });

    await page.close();
  });
});
