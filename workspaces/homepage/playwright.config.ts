/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { defineConfig } from '@playwright/test';

const LOCALES = ['en', 'de', 'es', 'fr', 'it', 'ja'] as const;
// APP_MODE: 'legacy' (app-legacy) or 'nfs' (app with new frontend system)
const appMode = process.env.APP_MODE || 'legacy';
const startCommand = appMode === 'legacy' ? 'yarn start:legacy' : 'yarn start';

// Single e2e test suite (packages/app/e2e-tests) runs for both legacy and nfs via APP_MODE
const testDir = 'e2e-tests';

const baseConfig = `${__dirname}/app-config.yaml`;
const adminConfig = `${__dirname}/app-config-admin.yaml`;
const developerConfig = `${__dirname}/app-config-developer.yaml`;

export default defineConfig({
  // E2E tests run full app + login + locale; beforeAll can take 30–60s
  timeout: 120 * 1000,

  expect: {
    timeout: 5000,
  },

  webServer: process.env.PLAYWRIGHT_URL
    ? []
    : [
        {
          command: `${startCommand} --config ${baseConfig}`,
          port: 3000,
          reuseExistingServer: true,
          cwd: __dirname,
        },
        {
          command: `${startCommand} --config ${baseConfig} --config ${adminConfig}`,
          port: 3001,
          reuseExistingServer: true,
          cwd: __dirname,
        },
        {
          command: `${startCommand} --config ${baseConfig} --config ${developerConfig}`,
          port: 3002,
          reuseExistingServer: true,
          cwd: __dirname,
        },
      ],

  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['html', { open: 'never', outputFolder: `e2e-test-report-${appMode}` }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    permissions: ['clipboard-read', 'clipboard-write'],
  },

  outputDir: `node_modules/.cache/e2e-test-results-${appMode}`,

  testDir,

  projects: [
    // en: run all tests (no grep)
    {
      name: 'en',
      use: {
        channel: 'chrome' as const,
        locale: 'en',
      },
    },
    // de, es, fr, it, ja: run only Cards tests (locale-specific content)
    ...LOCALES.filter(locale => locale !== 'en').map(locale => ({
      name: locale,
      testMatch: '**/homepageCards.test.ts',
      use: {
        channel: 'chrome' as const,
        locale,
      },
    })),
  ],
});
