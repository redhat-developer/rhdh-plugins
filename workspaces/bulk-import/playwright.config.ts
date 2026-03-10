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

const baseConfig = '../../app-config.yaml';
const configPath = '../app-legacy/e2e-tests/test_yamls';

export default defineConfig({
  timeout: 2 * 60 * 1000,
  fullyParallel: false,

  expect: {
    timeout: 10000,
  },

  webServer: process.env.PLAYWRIGHT_URL
    ? []
    : [
        {
          command: `${startCommand} --config ${baseConfig} --config ${configPath}/app-config-e2e-en.yaml`,
          url: 'http://localhost:7007/.backstage/health/v1/readiness',
          timeout: 120000,
          reuseExistingServer: false,
          cwd: __dirname,
        },
        {
          command: `${startCommand} --config ${baseConfig} --config ${configPath}/app-config-e2e-fr.yaml`,
          url: 'http://localhost:7008/.backstage/health/v1/readiness',
          timeout: 120000,
          reuseExistingServer: false,
          cwd: __dirname,
        },
        {
          command: `${startCommand} --config ${baseConfig} --config ${configPath}/app-config-e2e-it.yaml`,
          url: 'http://localhost:7009/.backstage/health/v1/readiness',
          timeout: 120000,
          reuseExistingServer: false,
          cwd: __dirname,
        },
        {
          command: `${startCommand} --config ${baseConfig} --config ${configPath}/app-config-e2e-ja.yaml`,
          url: 'http://localhost:7010/.backstage/health/v1/readiness',
          timeout: 120000,
          reuseExistingServer: false,
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
    // Enable visual mode when HEADED environment variable is set
    headless: process.env.HEADED !== 'true',
  },

  outputDir: `node_modules/.cache/e2e-test-results-${appMode}`,

  projects: [
    {
      name: 'en',
      testDir: 'packages/app-legacy/e2e-tests',
      use: {
        channel: 'chrome',
        locale: 'en',
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'fr',
      testDir: 'packages/app-legacy/e2e-tests',
      use: {
        channel: 'chrome',
        locale: 'fr',
        baseURL: 'http://localhost:3001',
      },
    },
    {
      name: 'it',
      testDir: 'packages/app-legacy/e2e-tests',
      use: {
        channel: 'chrome',
        locale: 'it',
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'ja',
      testDir: 'packages/app-legacy/e2e-tests',
      use: {
        channel: 'chrome',
        locale: 'ja',
        baseURL: 'http://localhost:3003',
      },
    },
  ],
});
