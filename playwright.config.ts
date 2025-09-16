import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : [['html'], ['list']],

  // Global setup and teardown
  globalSetup: './playwright/global-setup.ts',
  globalTeardown: './playwright/global-teardown.ts',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
    // Increase timeouts for stability
  },

  // Global expect configuration
  expect: {
    timeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Browser launch args for stability (similar to Cypress config)
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },

    // Uncomment for cross-browser testing when needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile configurations are intentionally disabled for the desktop-only scope
  ],

  webServer: process.env.CI ? undefined : {
    // In CI: Services are pre-started by workflow, don't start webServer
    // In local dev: Start full-stack development server for real E2E testing
    command: 'yarn dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true, // Allow reusing existing dev server
    timeout: 180 * 1000, // Full-stack startup requires more time
    env: {
      MODE: 'test',
    },
  },
});