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

export default defineConfig({
  timeout: 60_000,

  expect: {
    timeout: 10_000,
  },

  webServer: process.env.PLAYWRIGHT_URL
    ? []
    : [
        {
          command: 'yarn start app',
          port: 3000,
          reuseExistingServer: true,
          timeout: 60_000,
        },
        {
          command: 'yarn start backend',
          port: 7007,
          reuseExistingServer: true,
          timeout: 60_000,
        },
      ],

  forbidOnly: !!process.env.CI,

  workers: process.env.CI ? 2 : 1,

  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'e2e-test-report' }],
    ['junit', { outputFile: 'playwright-results.xml' }],
  ],

  use: {
    actionTimeout: 10_000,
    baseURL: process.env.PLAYWRIGHT_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },

  outputDir: 'test-results',

  projects: [
    // Merge-gate safe: runs against the local dev server in CI
    {
      name: 'chromium',
      testDir: 'packages/app/e2e-tests',
      testMatch: /app\.test\.ts$/,
      use: {
        channel: 'chrome',
      },
    },
    // Downstream E2E only: requires a deployed RHDH+X2A environment.
    // Activated by setting PLAYWRIGHT_URL to the live cluster base URL.
    // Run with: PLAYWRIGHT_URL=https://... yarn test:e2e:live
    ...(process.env.PLAYWRIGHT_URL
      ? [
          {
            name: 'live',
            testDir: 'packages/app/e2e-tests',
            testMatch: /^(?!app\.test\.ts$).*\.test\.ts$/,
            use: {
              channel: 'chrome' as const,
            },
          },
        ]
      : []),
  ],
});
