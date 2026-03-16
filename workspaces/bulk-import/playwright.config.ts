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

// APP_MODE: 'legacy' (app-legacy) or 'nfs' (app with new frontend system)
const appMode = process.env.APP_MODE || 'legacy';
const startCommand = appMode === 'legacy' ? 'yarn start:legacy' : 'yarn start';

// Config paths (absolute to work from any cwd)
const baseConfig = `${__dirname}/app-config.yaml`;
const testConfigDir = `${__dirname}/e2e-tests/test_yamls`;

const LOCALES = ['en', 'de', 'es', 'fr', 'it', 'ja'] as const;
const FRONTEND_PORT_BASE = 3000;
const BACKEND_PORT_BASE = 7007;

export default defineConfig({
  timeout: 2 * 60 * 1000,

  expect: {
    timeout: 5000,
  },

  webServer: process.env.PLAYWRIGHT_URL
    ? []
    : LOCALES.map((locale, i) => ({
        command: `${startCommand} --config ${baseConfig} --config ${testConfigDir}/app-config-e2e-${locale}.yaml`,
        url: `http://localhost:${
          BACKEND_PORT_BASE + i
        }/.backstage/health/v1/readiness`,
        timeout: 120000,
        reuseExistingServer: false,
        cwd: __dirname,
      })),

  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['html', { open: 'never', outputFolder: `e2e-test-report-${appMode}` }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  outputDir: `node_modules/.cache/e2e-test-results-${appMode}`,

  testDir: 'e2e-tests',

  projects: LOCALES.map((locale, i) => ({
    name: locale,
    use: {
      channel: 'chrome' as const,
      locale,
      baseURL: `http://localhost:${FRONTEND_PORT_BASE + i}`,
    },
  })),
});
