import { defineConfig } from '@playwright/test';

const configFile =
  process.env.CONFIG_FILE === 'dev'
    ? '../../app-config-dev.yaml'
    : '../../app-config.yaml';

export default defineConfig({
  timeout: 2 * 60 * 1000,

  expect: {
    timeout: 5000,
  },

  webServer: process.env.PLAYWRIGHT_URL
    ? []
    : [
        {
          command: 'yarn start --config ../../app-config.yaml',
          port: 3000,
          reuseExistingServer: true,
        },
        {
          command: 'yarn start --config ../../app-config-dev.yaml',
          port: 3001,
          reuseExistingServer: true,
        },
      ],

  retries: process.env.CI ? 2 : 0,

  reporter: [['html', { open: 'never', outputFolder: 'e2e-test-report' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  outputDir: 'node_modules/.cache/e2e-test-results',

  projects: [
    {
      name: 'en',
      testDir: 'packages/app/e2e-tests',
      testIgnore: '**/quick-start-developer.spec.ts',
      use: {
        channel: 'chrome',
        locale: 'en',
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'fr',
      testDir: 'packages/app/e2e-tests',
      testIgnore: '**/quick-start-developer.spec.ts',
      use: {
        channel: 'chrome',
        locale: 'fr',
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'dev-config',
      testDir: 'packages/app/e2e-tests',
      testMatch: '**/quick-start-developer.spec.ts',
      use: {
        channel: 'chrome',
        locale: 'en',
        baseURL: 'http://localhost:3001',
      },
    },
    {
      name: 'dev-config-fr',
      testDir: 'packages/app/e2e-tests',
      testMatch: '**/quick-start-developer.spec.ts',
      use: {
        channel: 'chrome',
        locale: 'fr',
        baseURL: 'http://localhost:3001',
      },
    },
  ],
});
