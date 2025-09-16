import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // Log task for debugging
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });

      return config;
    },
    env: {
      MODE: 'test',
    },
    // Memory and performance optimization
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 5,
    // Browser launch args for stability
    chromeWebSecurity: false,
    experimentalStudio: false,
    // Increase timeouts for more stable tests
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 20000,
    // Retry failed tests
    retries: {
      runMode: 3,
      openMode: 1,
    },
    // Video recording for debugging (disabled for performance)
    video: false,
    screenshotOnRunFailure: true,
    // Wait strategies
    waitForAnimations: true,
    animationDistanceThreshold: 5,
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
