import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : [['html'], ['list']],

  // Global timeout for CI environments (prevent hanging)
  globalTimeout: process.env.CI ? 240000 : undefined, // 4 minutes max in CI

  // Global setup and teardown
  globalSetup: './playwright/global-setup.ts',
  globalTeardown: './playwright/global-teardown.ts',

  // Ensure test login buttons are available by setting environment
  env: {
    VITE_ENABLE_TESTING: 'true',
    MODE: 'test',
  },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
    // Increase timeouts for stability
    // Ensure test login buttons are available
    extraHTTPHeaders: {
      'x-test-mode': 'true',
    },
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
        // Conditional browser launch args for security
        launchOptions: {
          args: (() => {
            const baseArgs: string[] = [];

            // Only disable sandbox in CI environments where it's necessary
            // Local development should maintain security restrictions
            if (process.env.CI || process.env.GITHUB_ACTIONS) {
              // CI environments may require sandbox disabled
              baseArgs.push('--no-sandbox', '--disable-setuid-sandbox');
            }

            // Always include security-conscious flags
            baseArgs.push(
              '--disable-background-timer-throttling',
              '--disable-renderer-backgrounding',
              '--disable-backgrounding-occluded-windows'
            );

            return baseArgs;
          })(),
        },
        // Enable test mode for all tests
        storageState: {
          cookies: [],
          origins: [
            {
              origin: 'http://localhost:5173',
              localStorage: [
                { name: 'test_mode', value: 'true' },
                { name: 'enable_testing', value: 'true' },
              ],
            },
          ],
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
    command: 'yarn all:dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true, // Allow reusing existing dev server
    timeout: 180 * 1000, // Full-stack startup requires more time
    env: {
      MODE: 'test',
      VITE_ENABLE_TESTING: 'true', // Enable test login buttons for E2E tests
    },
  },
});