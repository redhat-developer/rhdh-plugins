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

const baseConfig = `${__dirname}/app-config.yaml`;

export default defineConfig({
  timeout: 2 * 60 * 1000,

  expect: {
    timeout: 10_000,
  },

  webServer: process.env.PLAYWRIGHT_URL
    ? []
    : {
        command: `yarn start --config ${baseConfig}`,
        url: 'http://localhost:7007/.backstage/health/v1/readiness',
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
        cwd: __dirname,
      },

  retries: process.env.CI ? 2 : 0,

  reporter: [['html', { open: 'never', outputFolder: 'e2e-test-report' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  outputDir: 'node_modules/.cache/e2e-test-results',

  testDir: 'packages/app/e2e-tests',
});
