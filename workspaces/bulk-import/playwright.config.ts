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

const baseConfig = '../../app-config.yaml';
const configPath = '../app/e2e-tests/test_yamls';

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
          command: `yarn start --config ${baseConfig} --config ${configPath}/app-config-e2e-en.yaml`,
          url: 'http://localhost:7007/.backstage/health/v1/readiness',
          timeout: 120000,
          reuseExistingServer: false,
        },
        {
          command: `yarn start --config ${baseConfig} --config ${configPath}/app-config-e2e-fr.yaml`,
          url: 'http://localhost:7008/.backstage/health/v1/readiness',
          timeout: 120000,
          reuseExistingServer: false,
        },
        {
          command: `yarn start --config ${baseConfig} --config ${configPath}/app-config-e2e-it.yaml`,
          url: 'http://localhost:7009/.backstage/health/v1/readiness',
          timeout: 120000,
          reuseExistingServer: false,
        },
        {
          command: `yarn start --config ${baseConfig} --config ${configPath}/app-config-e2e-ja.yaml`,
          url: 'http://localhost:7010/.backstage/health/v1/readiness',
          timeout: 120000,
          reuseExistingServer: false,
        },
      ],

  retries: process.env.CI ? 2 : 0,

  reporter: [['html', { open: 'never', outputFolder: 'e2e-test-report' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    // Enable visual mode when HEADED environment variable is set
    headless: process.env.HEADED !== 'true',
  },

  outputDir: 'node_modules/.cache/e2e-test-results',

  projects: [
    {
      name: 'en',
      testDir: 'packages/app/e2e-tests',
      use: {
        channel: 'chrome',
        locale: 'en',
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'fr',
      testDir: 'packages/app/e2e-tests',
      use: {
        channel: 'chrome',
        locale: 'fr',
        baseURL: 'http://localhost:3001',
      },
    },
    {
      name: 'it',
      testDir: 'packages/app/e2e-tests',
      use: {
        channel: 'chrome',
        locale: 'it',
        baseURL: 'http://localhost:3002',
      },
    },
    {
      name: 'ja',
      testDir: 'packages/app/e2e-tests',
      use: {
        channel: 'chrome',
        locale: 'ja',
        baseURL: 'http://localhost:3003',
      },
    },
  ],
});
