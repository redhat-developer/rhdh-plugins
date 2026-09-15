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

const appMode = process.env.APP_MODE || 'legacy';
const startCommand = appMode === 'legacy' ? 'yarn start:legacy' : 'yarn start';
const baseConfig = `${__dirname}/app-config.yaml`;
const rbacE2eConfig = `${__dirname}/app-config.e2e-rbac.yaml`;

/**
 * Isolated Playwright config for RBAC permission gating e2e.
 * Starts the app with permission.enabled so authorize calls hit the network
 * and the per-scenario route mock can apply deny matrices.
 */
export default defineConfig({
  timeout: 3 * 60 * 1000,

  expect: {
    timeout: 15_000,
  },

  webServer: process.env.PLAYWRIGHT_URL
    ? []
    : {
        command: `${startCommand} --config ${baseConfig} --config ${rbacE2eConfig}`,
        port: 3000,
        reuseExistingServer: !process.env.CI,
        cwd: __dirname,
        timeout: 4 * 60 * 1000,
        env: {
          NOTEBOOKS_ENABLED: 'true',
          NOTEBOOKS_QUERY_MODEL: 'gpt-4',
          NOTEBOOKS_QUERY_PROVIDER_ID: 'openai',
        },
      },

  retries: process.env.CI ? 2 : 0,

  reporter: [
    [
      'html',
      {
        open: 'never',
        outputFolder: `e2e-test-report-rbac-${appMode}`,
      },
    ],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    permissions: ['clipboard-read', 'clipboard-write'],
    channel: 'chrome',
    locale: 'en-US',
  },

  outputDir: `node_modules/.cache/e2e-test-results-rbac-${appMode}`,

  testDir: 'e2e-tests',
  testMatch: '**/lightspeed.permissions.test.ts',
  fullyParallel: false,
});
