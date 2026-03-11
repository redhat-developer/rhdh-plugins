import { defineConfig } from '@playwright/test';

const LOCALES = ['en', 'fr', 'it', 'ja', 'de', 'es'] as const;

const testDir = 'packages/app/e2e-tests';

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
    // Main config: all locales, default port 3000, exclude developer spec
    ...LOCALES.map(locale => ({
      name: locale,
      testDir,
      testIgnore: '**/quick-start-developer.spec.ts',
      use: {
        channel: 'chrome' as const,
        locale,
        baseURL: 'http://localhost:3000',
      },
    })),
    // Dev config: all locales, port 3001, developer spec only
    ...LOCALES.map(locale => ({
      name: `dev-config-${locale}`,
      testDir,
      testMatch: '**/quick-start-developer.spec.ts',
      use: {
        channel: 'chrome' as const,
        locale,
        baseURL: 'http://localhost:3001',
      },
    })),
  ],
});
