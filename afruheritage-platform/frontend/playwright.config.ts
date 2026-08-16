import { defineConfig, devices } from '@playwright/test'

const FRONTEND_BASE_URL = process.env.UAT_FRONTEND_BASE_URL || 'http://127.0.0.1:3002'
const API_BASE_URL = process.env.UAT_API_BASE_URL || 'http://127.0.0.1:8100'

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: FRONTEND_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `echo "Frontend at ${FRONTEND_BASE_URL}, API at ${API_BASE_URL}"`,
      url: FRONTEND_BASE_URL,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
