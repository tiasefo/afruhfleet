import { test, expect, Page, Browser } from '@playwright/test';
import {
  FRONTEND_BASE_URL,
  TENANT_A_ADMIN_EMAIL,
  TENANT_A_ADMIN_PASSWORD,
  TENANT_A_ID,
  TENANT_B_ADMIN_EMAIL,
  TENANT_B_ADMIN_PASSWORD,
  TENANT_B_ID,
} from './test-utils';

const SELECTOR_TIMEOUT = 30_000;

async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${FRONTEND_BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  const meResponsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/v1/auth/me') && r.request().method() === 'GET' && r.ok(),
    { timeout: SELECTOR_TIMEOUT },
  );
  await page.click('button[type="submit"]');
  await meResponsePromise;
  await page.waitForURL(/\/dashboard/, { timeout: SELECTOR_TIMEOUT }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

async function getBranding(page: Page, tenantId: string): Promise<any> {
  return page.evaluate(async (id: string) => {
    const res = await fetch(`/api/v1/branding/public/${id}`);
    if (!res.ok) return null;
    return res.json();
  }, tenantId);
}

test.describe('M2: Marketplace Template Store & Plugin Store UIs', () => {
  test.setTimeout(120_000);

  test('template store selection, rollback and cross-tenant isolation', async ({ browser }) => {
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();

    await login(pageA, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);
    await login(pageB, TENANT_B_ADMIN_EMAIL, TENANT_B_ADMIN_PASSWORD);

    const baselineB = await getBranding(pageB, TENANT_B_ID);
    // Reset any leftover state from previous runs
    await pageA.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/storefront-templates/rollback', { method: 'POST', credentials: 'same-origin', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({}) }); } catch {}
    });

    const baselineA = await getBranding(pageA, TENANT_A_ID);
    const originalTemplateA = baselineA?.template_code ?? null;

    // Template Store — browse
    await pageA.goto(`${FRONTEND_BASE_URL}/templates`);
    await pageA.waitForLoadState('networkidle');
    await expect(pageA.getByText('Storefront Templates')).toBeVisible();
    await pageA.screenshot({ path: 'artifacts/m2-template-store-browse.png', fullPage: true });

    const freightCard = pageA.getByTestId('template-card-freight');
    const fleetCard = pageA.getByTestId('template-card-fleet');

    await expect(freightCard.getByRole('button', { name: 'Install' })).toBeVisible();

    // Stage Fleet for Tenant A
    const selectResponsePromise = pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/select') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await fleetCard.getByRole('button', { name: 'Install' }).click();
    const selectResponse = await selectResponsePromise;
    if (!selectResponse.ok()) {
      const body = await selectResponse.text().catch(() => 'unreadable');
      console.log(`Select response: ${selectResponse.status()} ${selectResponse.statusText()} body: ${body}`);
    }
    expect(selectResponse.ok()).toBeTruthy();
    await expect(pageA.getByText(/Staged Vanta Fleet/i).first()).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await pageA.screenshot({ path: 'artifacts/m2-template-fleet-staged.png', fullPage: true });

    // Publish to make it live
    const publishResponsePromise = pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/publish') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await fleetCard.getByRole('button', { name: 'Publish' }).click();
    const publishResponse = await publishResponsePromise;
    expect(publishResponse.ok()).toBeTruthy();
    await expect(pageA.getByText(/Published.*storefront/i).first()).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await pageA.screenshot({ path: 'artifacts/m2-template-fleet-published.png', fullPage: true });

    const afterSelectA = await getBranding(pageA, TENANT_A_ID);
    expect(afterSelectA.template_code).toBe('fleet');

    // Preview page is read-only — no "Select" or "Install" button
    await pageA.goto(`${FRONTEND_BASE_URL}/templates/fleet`);
    await expect(pageA.getByText(/Vanta Fleet/i).first()).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    // Verify read-only: no select/install button on preview page
    await expect(pageA.getByRole('button', { name: /Select This Template|Install/i })).toHaveCount(0);
    await pageA.screenshot({ path: 'artifacts/m2-template-preview.png', fullPage: true });

    // Rollback
    await pageA.goto(`${FRONTEND_BASE_URL}/templates`);
    await expect(pageA.getByRole('button', { name: 'Rollback' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    const rollbackResponsePromise = pageA.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/rollback') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await pageA.getByRole('button', { name: 'Rollback' }).click();
    const rollbackResponse = await rollbackResponsePromise;
    expect(rollbackResponse.ok()).toBeTruthy();
    await expect(pageA.getByText(/Rolled back/i).first()).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await pageA.screenshot({ path: 'artifacts/m2-template-rollback.png', fullPage: true });

    const afterRollbackA = await getBranding(pageA, TENANT_A_ID);
    expect(afterRollbackA.template_code).toBe(originalTemplateA);

    // Cross-tenant isolation
    const afterB = await getBranding(pageB, TENANT_B_ID);
    expect(afterB.template_code).toBe(baselineB?.template_code);
    expect(afterB.public_tracking_enabled).toBe(baselineB?.public_tracking_enabled);

    await pageA.close();
    await pageB.close();
  });

  test('plugin store install, disable, enable, uninstall lifecycle', async ({ page }) => {
    await login(page, TENANT_A_ADMIN_EMAIL, TENANT_A_ADMIN_PASSWORD);

    // Ensure the tracking plugin is not installed at the start of this lifecycle test
    await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      try { await fetch('/api/v1/plugins/tracking/uninstall', { method: 'POST', credentials: 'same-origin', headers: { 'Authorization': `Bearer ${token}` } }); } catch {}
    });

    await page.goto(`${FRONTEND_BASE_URL}/plugins`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Plugin Catalog' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/m2-plugin-store-browse.png', fullPage: true });

    // Find the tracking plugin card and install
    const trackingCard = page.getByTestId('plugin-card-tracking');
    await trackingCard.getByRole('button', { name: 'Install Plugin' }).click();

    // Consent dialog
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    // Toggle the three consent switches by clicking their labels
    await page.locator('label:has-text("UI Changes")').first().click();
    await page.locator('label:has-text("Business Type Changes")').first().click();
    await page.locator('label:has-text("Data Impact")').first().click();

    // Risk acknowledgment checkboxes
    await page.locator('label:has-text("I acknowledge and accept: UI change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Business type change")').click();
    await page.locator('label:has-text("I acknowledge and accept: Data impact")').click();

    await page.screenshot({ path: 'artifacts/m2-plugin-consent-dialog.png', fullPage: true });

    // Set up response listeners BEFORE clicking install
    const installResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/install') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await page.locator('[role="dialog"] button:has-text("Install Plugin"):not([disabled])').click();

    const installResponse = await installResponsePromise;
    expect(installResponse.ok()).toBeTruthy();

    // Wait for the silent refresh of installed plugins list
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/installed') && r.request().method() === 'GET',
      { timeout: SELECTOR_TIMEOUT },
    );
    await expect(trackingCard.getByText('Installed')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/m2-plugin-installed.png', fullPage: true });

    // Disable
    await trackingCard.getByRole('button', { name: 'Disable' }).click();
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/tracking/disable') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await expect(trackingCard.getByText('Disabled')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/m2-plugin-disabled.png', fullPage: true });

    // Enable
    await trackingCard.getByRole('button', { name: 'Enable' }).click();
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/tracking/enable') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await expect(trackingCard.getByText('Installed')).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/m2-plugin-enabled.png', fullPage: true });

    // Uninstall
    await trackingCard.getByRole('button', { name: 'Uninstall' }).click();
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/plugins/tracking/uninstall') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await expect(trackingCard.getByRole('button', { name: 'Install Plugin' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/m2-plugin-uninstalled.png', fullPage: true });
  });

  test('rollback without a completed installation fails gracefully', async ({ page }) => {
    await login(page, TENANT_B_ADMIN_EMAIL, TENANT_B_ADMIN_PASSWORD);

    // Check if Tenant B has any completed installations via the installations API.
    // If so, rollback once to clear the completed state. This is a single
    // deterministic reset action, not a loop.
    const installations = await page.evaluate(async () => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/storefront-templates/installations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return { installations: [] };
      return res.json();
    });
    const hasCompleted = (installations?.installations || []).some(
      (i: any) => i.status === 'completed'
    );
    if (hasCompleted) {
      await page.evaluate(async () => {
        const token = localStorage.getItem('auth_token');
        await fetch('/api/v1/storefront-templates/rollback', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      });
    }

    // Now navigate to the templates page and click rollback.
    // With no completed installation, this should fail gracefully.
    await page.goto(`${FRONTEND_BASE_URL}/templates`);
    await expect(page.getByRole('heading', { name: 'Storefront Templates' })).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    const rollbackBtn = page.getByRole('button', { name: 'Rollback' });
    await expect(rollbackBtn).toBeEnabled({ timeout: SELECTOR_TIMEOUT });
    const rollbackResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/storefront-templates/rollback') && r.request().method() === 'POST',
      { timeout: SELECTOR_TIMEOUT },
    );
    await rollbackBtn.click();
    const rollbackResponse = await rollbackResponsePromise;
    // The API should return an error (400) since there is no completed installation to rollback.
    expect(rollbackResponse.ok()).toBeFalsy();
    await expect(page.getByText(/Failed to rollback|No installation to rollback|No previous|No completed|already rolled back/i).first()).toBeVisible({ timeout: SELECTOR_TIMEOUT });
    await page.screenshot({ path: 'artifacts/m2-rollback-failure.png', fullPage: true });
  });
});
